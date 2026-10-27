import { factories } from '@strapi/strapi';
import { awardCommunityPoints } from '../../../utils/community-points';

export default factories.createCoreController('api::reply.reply', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("Vous devez être connecté pour publier une réponse.");
    }

    const body = ctx.request.body as { data?: Record<string, unknown> };
    const data = body.data;
    if (!data || typeof data.content !== 'string' || typeof data.discussion !== 'string') {
      return ctx.badRequest('Les informations de la réponse sont invalides.');
    }

    const entry = await strapi.documents('api::reply.reply').create({
      data: {
        content: data.content,
        discussion: data.discussion,
        author: user.id,
      },
      status: 'published',
    });

    await awardCommunityPoints(strapi, user.id, `reply:${entry.documentId}`, 3);
    return { data: entry };
  },
}));