export default {
  routes: [
    {
      method: 'POST',
      path: '/community/daily-visit',
      handler: 'community-point.dailyVisit',
    },
    {
      method: 'GET',
      path: '/community/me/points',
      handler: 'community-point.me',
    },
    {
      method: 'GET',
      path: '/community/leaderboard',
      handler: 'community-point.leaderboard',
      config: { auth: false },
    },
  ],
};
