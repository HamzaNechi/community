import { factories } from '@strapi/strapi';
import type { Core } from '@strapi/strapi';
import { awardCommunityPoints, getCommunityPointTotals } from '../../../utils/community-points';

const USER_UID = 'plugin::users-permissions.user';
const POINT_UID = 'api::community-point.community-point';

export default factories.createCoreController('api::community-point.community-point', ({ strapi }) => ({
  async dailyVisit(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Connectez-vous pour participer au classement.');
    const today = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const awarded = await awardCommunityPoints(strapi, user.id, `visit:${user.id}:${today}`, 1);
    const totals = await getCommunityPointTotals(strapi, user.id);
    return { awarded, totalPoints: totals.totalPoints };
  },

  async me(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Connectez-vous pour consulter vos points.');

    return getCommunityPointTotals(strapi, user.id);
  },

  async leaderboard(ctx) {
    const period = ctx.query.period === 'month' ? 'month' : 'all';
    const monthStart = getMonthStart();
    const events = await strapi.db.query(POINT_UID).findMany({
      populate: { user: { select: ['id', 'documentId', 'username', 'totalPoints', 'blocked'] } },
      select: ['points', 'createdAt'],
    });
    const monthlyPoints = new Map<number, {
      documentId: string;
      username: string;
      points: number;
      totalPoints: number;
    }>();
    for (const event of events) {
      const user = event.user as {
        id: number;
        documentId: string;
        username: string;
        totalPoints: number | null;
        blocked: boolean;
      } | null;
      if (!user || user.blocked) continue;
      const entry = monthlyPoints.get(user.id) ?? {
        documentId: user.documentId,
        username: user.username,
        points: 0,
        totalPoints: 0,
      };
      const points = Number(event.points);
      entry.totalPoints += points;
      if (new Date(event.createdAt) >= monthStart) entry.points += points;
      monthlyPoints.set(user.id, entry);
    }

    return {
      data: [...monthlyPoints.values()]
        .map(user => ({ ...user, points: period === 'month' ? user.points : user.totalPoints }))
        .filter(user => user.points > 0)
        .sort((a, b) => b.points - a.points)
        .slice(0, 100),
    };
  },
}));

async function getUserPointTotals(strapi: Core.Strapi, userId: number) {
  const events = await strapi.db.query(POINT_UID).findMany({
    where: { user: { id: userId } },
    select: ['points', 'createdAt'],
  });
  const monthStart = getMonthStart();
  const totalPoints = events.reduce((total, event) => total + Number(event.points), 0);
  const monthlyPoints = events.reduce(
    (total, event) => total + (new Date(event.createdAt) >= monthStart ? Number(event.points) : 0),
    0,
  );
  const currentUser = await strapi.db.query(USER_UID).findOne({
    where: { id: userId },
    select: ['totalPoints'],
  });
  if (Number(currentUser?.totalPoints ?? 0) !== totalPoints) {
    await strapi.db.query(USER_UID).update({
      where: { id: userId },
      data: { totalPoints },
    });
  }
  return { totalPoints, monthlyPoints };
}

function getMonthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
