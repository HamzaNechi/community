import { factories } from '@strapi/strapi';
import type { Core } from '@strapi/strapi';
import { awardCommunityPoints } from '../../../utils/community-points';

const LIKE_UID = 'api::community-like.community-like';

type LikeTarget = 'discussion' | 'reply';

export default factories.createCoreController('api::discussion.discussion', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("Vous devez être connecté pour créer une discussion.");
    }

    const body = ctx.request.body as { data?: Record<string, unknown> };
    const data = body.data;
    if (!data || typeof data.title !== 'string' || typeof data.content !== 'string'
      || (data.type !== 'question' && data.type !== 'discussion')) {
      return ctx.badRequest('Les informations de la discussion sont invalides.');
    }

    const entry = await strapi.documents('api::discussion.discussion').create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        ...(typeof data.category === 'string' ? { category: data.category } : {}),
        author: user.id,
      },
    });

    await awardCommunityPoints(strapi, user.id, `discussion:${entry.documentId}`, 5);
    return { data: entry };
  },

  async recordView(ctx) {
    const { documentId } = ctx.params;
    const discussion = await strapi.documents('api::discussion.discussion').findOne({
      documentId,
      fields: ['documentId', 'views'],
    });
    if (!discussion) return ctx.notFound('Discussion introuvable.');

    const tableName = strapi.db.metadata.get('api::discussion.discussion').tableName;
    await strapi.db.connection(tableName)
      .where({ document_id: documentId })
      .update({ views: strapi.db.connection.raw('COALESCE(??, 0) + 1', ['views']) });
    const updated = await strapi.documents('api::discussion.discussion').findOne({
      documentId,
      fields: ['views'],
    });
    if (!updated) return ctx.notFound('Discussion introuvable.');
    return { views: updated.views };
  },

  async getLikeState(ctx) {
    const { documentId } = ctx.params;
    const targetType: string = ctx.params.targetType;
    if (targetType !== 'discussion' && targetType !== 'reply') {
      return ctx.badRequest('Type de publication invalide.');
    }
    const target = await findLikeTarget(strapi, targetType, documentId);
    if (!target) return ctx.notFound('Publication introuvable.');

    const liked = ctx.state.user
      ? Boolean(await strapi.db.query(LIKE_UID).findOne({
        where: {
          targetKey: `${ctx.state.user.id}:${targetType}:${documentId}`,
          active: true,
        },
      }))
      : false;
    const likes = await syncLikeCount(strapi, targetType, documentId);
    return { likes, liked };
  },

  async toggleLike(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Connectez-vous pour marquer une publication comme utile.');

    const { documentId } = ctx.params;
    const targetType: string = ctx.params.targetType;
    if (targetType !== 'discussion' && targetType !== 'reply') {
      return ctx.badRequest('Type de publication invalide.');
    }
    const target = await findLikeTarget(strapi, targetType, documentId);
    if (!target) return ctx.notFound('Publication introuvable.');
    if (target.author?.id === user.id) return ctx.badRequest('Vous ne pouvez pas marquer votre propre publication comme utile.');

    const targetKey = `${user.id}:${targetType}:${documentId}`;
    const like = await strapi.db.query(LIKE_UID).findOne({ where: { targetKey } });
    if (like) {
      const active = !like.active;
      await strapi.db.query(LIKE_UID).update({ where: { id: like.id }, data: { active } });
      const likes = await syncLikeCount(strapi, targetType, documentId);
      return { likes, liked: active };
    }

    await strapi.db.query(LIKE_UID).create({
      data: {
        targetKey,
        targetType,
        targetDocumentId: documentId,
        active: true,
        user: user.id,
        [targetType]: target.id,
      },
    });
    const likes = await syncLikeCount(strapi, targetType, documentId);
    if (target.author?.id) {
      await awardCommunityPoints(strapi, Number(target.author.id), `like:${targetKey}`, 5);
    }
    return { likes, liked: true };
  },

  async chooseBestAnswer(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Connectez-vous pour choisir une meilleure réponse.');

    const discussion = await strapi.documents('api::discussion.discussion').findOne({
      documentId: ctx.params.documentId,
      populate: { author: true, bestAnswer: true },
    });
    if (!discussion) return ctx.notFound('Discussion introuvable.');
    if (discussion.type !== 'question' || discussion.author?.id !== user.id) {
      return ctx.forbidden('Seul l’auteur d’une question peut choisir sa meilleure réponse.');
    }
    if (discussion.bestAnswer) {
      if (discussion.bestAnswer.documentId === ctx.params.replyDocumentId) {
        return { bestAnswer: discussion.bestAnswer.documentId };
      }
      return ctx.badRequest('Une meilleure réponse a déjà été choisie pour cette question.');
    }

    if (!discussion.author) return ctx.badRequest('Cette discussion n’a pas d’auteur attribué.');

    const reply = await strapi.documents('api::reply.reply').findOne({
      documentId: ctx.params.replyDocumentId,
      populate: { author: true, discussion: true },
    });
    if (!reply || reply.discussion?.documentId !== discussion.documentId) {
      return ctx.badRequest('Cette réponse ne correspond pas à la discussion.');
    }

    await strapi.documents('api::discussion.discussion').update({
      documentId: discussion.documentId,
      data: { bestAnswer: reply.documentId },
    });
    if (reply.author?.id) {
      await awardCommunityPoints(strapi, Number(reply.author.id), `solution:${reply.documentId}`, 20);
    }
    return { bestAnswer: reply.documentId };
  },
}));

async function findLikeTarget(strapi: Core.Strapi, type: LikeTarget, documentId: string) {
  if (type === 'discussion') {
    return strapi.documents('api::discussion.discussion').findOne({
      documentId,
      fields: ['id', 'likes'],
      populate: { author: { fields: ['id'] } },
    });
  }
  return strapi.documents('api::reply.reply').findOne({
    documentId,
    fields: ['id', 'likes'],
    populate: { author: { fields: ['id'] } },
  });
}

async function syncLikeCount(strapi: Core.Strapi, type: LikeTarget, documentId: string) {
  const uid = type === 'discussion' ? 'api::discussion.discussion' : 'api::reply.reply';
  const likes = await strapi.db.query(LIKE_UID).count({
    where: { targetType: type, targetDocumentId: documentId, active: true },
  });
  const tableName = strapi.db.metadata.get(uid).tableName;
  await strapi.db.connection(tableName)
    .where({ document_id: documentId })
    .update({ likes });
  return likes;
}