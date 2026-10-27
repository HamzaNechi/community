import type { Core } from '@strapi/strapi';

const POINT_UID = 'api::community-point.community-point';
const USER_UID = 'plugin::users-permissions.user';

export async function getCommunityPointTotals(strapi: Core.Strapi, userId: number) {
  const events = await strapi.db.query(POINT_UID).findMany({
    where: { user: { id: userId } },
    select: ['points', 'createdAt'],
  });
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const totalPoints = events.reduce((total, event) => total + Number(event.points), 0);
  const monthlyPoints = events.reduce(
    (total, event) => total + (new Date(event.createdAt) >= monthStart ? Number(event.points) : 0),
    0,
  );
  const user = await strapi.db.query(USER_UID).findOne({
    where: { id: userId },
    select: ['totalPoints'],
  });
  if (Number(user?.totalPoints ?? 0) !== totalPoints) {
    await strapi.db.query(USER_UID).update({
      where: { id: userId },
      data: { totalPoints },
    });
  }
  return { totalPoints, monthlyPoints };
}

export async function awardCommunityPoints(
  strapi: Core.Strapi,
  userId: number,
  actionKey: string,
  points: number,
): Promise<boolean> {
  const pointsQuery = strapi.db.query(POINT_UID);
  const existing = await pointsQuery.findOne({ where: { actionKey } });
  if (existing) return false;

  try {
    await strapi.db.transaction(async () => {
      const duplicate = await pointsQuery.findOne({ where: { actionKey } });
      if (duplicate) return;

      await pointsQuery.create({ data: { actionKey, points, user: userId } });
      const user = await strapi.db.query(USER_UID).findOne({
        where: { id: userId },
        select: ['id'],
      });
      if (!user) throw new Error(`Impossible d'attribuer des points à l'utilisateur ${userId}.`);
      const usersTable = strapi.db.metadata.get(USER_UID).tableName;
      await strapi.db.connection(usersTable).where({ id: userId }).increment('total_points', points);
    });
  } catch (cause) {
    const duplicate = await pointsQuery.findOne({ where: { actionKey } });
    if (duplicate) return false;
    throw cause;
  }
  return true;
}
