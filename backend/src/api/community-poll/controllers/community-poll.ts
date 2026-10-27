import { factories } from '@strapi/strapi';
import { awardCommunityPoints, getCommunityPointTotals } from '../../../utils/community-points';

const POLL_UID = 'api::community-poll.community-poll';
const VOTE_UID = 'api::community-vote.community-vote';
const USER_UID = 'plugin::users-permissions.user';

type PollOption = { label: string };

export default factories.createCoreController(POLL_UID, ({ strapi }) => ({
  async active(ctx) {
    const poll = await strapi.db.query(POLL_UID).findOne({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      select: ['id', 'documentId', 'title', 'options'],
    });
    if (!poll) return { data: null };

    const options = normalizeOptions(poll.options);
    const votes = await strapi.db.query(VOTE_UID).findMany({
      where: { poll: { id: poll.id } },
      select: ['optionIndex'],
    });
    const counts = options.map(() => 0);
    for (const vote of votes) {
      if (Number.isInteger(vote.optionIndex) && vote.optionIndex >= 0 && vote.optionIndex < counts.length) {
        counts[vote.optionIndex] += 1;
      }
    }

    return {
      data: {
        documentId: poll.documentId,
        title: poll.title,
        options,
        counts,
        totalVotes: votes.length,
        selectedOption: null,
      },
    };
  },

  async myVote(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Connectez-vous pour consulter votre vote.');
    const vote = await strapi.db.query(VOTE_UID).findOne({
      where: { voteKey: `${ctx.params.documentId}:${user.id}` },
      select: ['optionIndex'],
    });
    return { selectedOption: vote?.optionIndex ?? null };
  },

  async vote(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Connectez-vous pour voter au sondage.');

    const poll = await strapi.db.query(POLL_UID).findOne({
      where: { documentId: ctx.params.documentId, active: true },
      select: ['id', 'documentId', 'options'],
    });
    if (!poll) return ctx.notFound('Ce sondage n’est plus disponible.');

    const options = normalizeOptions(poll.options);
    const optionIndex = ctx.request.body?.optionIndex;
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= options.length) {
      return ctx.badRequest('Choisissez une réponse valide.');
    }

    const voteKey = `${poll.documentId}:${user.id}`;
    const existing = await strapi.db.query(VOTE_UID).findOne({ where: { voteKey } });
    if (existing) {
      await strapi.db.query(VOTE_UID).update({
        where: { id: existing.id },
        data: { optionIndex },
      });
    } else {
      await strapi.db.query(VOTE_UID).create({
        data: {
          voteKey,
          optionIndex,
          poll: poll.id,
          user: user.id,
        },
      });
    }

    const awarded = await awardCommunityPoints(strapi, user.id, `poll:${poll.documentId}:${user.id}`, 1);
    const totals = await getCommunityPointTotals(strapi, user.id);
    return { selectedOption: optionIndex, awarded, totalPoints: totals.totalPoints };
  },

  async myInterests(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Connectez-vous pour consulter vos espaces suivis.');
    const currentUser = await strapi.db.query(USER_UID).findOne({
      where: { id: user.id },
      select: ['communityInterests'],
    });
    return { interests: normalizeInterests(currentUser?.communityInterests) };
  },

  async updateMyInterests(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Connectez-vous pour enregistrer vos espaces suivis.');

    const interests = ctx.request.body?.interests;
    if (!Array.isArray(interests) || interests.some(value => typeof value !== 'string')) {
      return ctx.badRequest('La liste des espaces suivis est invalide.');
    }
    const uniqueInterests = [...new Set(interests)] as string[];
    const categories = await strapi.db.query('api::category.category').findMany({
      where: { slug: { $in: uniqueInterests } },
      select: ['slug'],
    });
    if (categories.length !== uniqueInterests.length) {
      return ctx.badRequest('Un ou plusieurs espaces sélectionnés n’existent pas.');
    }

    await strapi.db.query(USER_UID).update({
      where: { id: user.id },
      data: { communityInterests: uniqueInterests },
    });
    return { interests: uniqueInterests };
  },
}));

function normalizeOptions(value: unknown): PollOption[] {
  if (!Array.isArray(value) || value.length < 2
    || value.some(option => !option || typeof option !== 'object'
      || typeof (option as Record<string, unknown>).label !== 'string')) {
    throw new Error('Les options du sondage actif sont mal configurées dans Strapi.');
  }
  return value as PollOption[];
}

function normalizeInterests(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((slug): slug is string => typeof slug === 'string') : [];
}
