export default {
  routes: [
    {
      method: 'GET',
      path: '/community/polls/active',
      handler: 'community-poll.active',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/community/polls/:documentId/my-vote',
      handler: 'community-poll.myVote',
    },
    {
      method: 'POST',
      path: '/community/polls/:documentId/vote',
      handler: 'community-poll.vote',
    },
    {
      method: 'GET',
      path: '/community/me/interests',
      handler: 'community-poll.myInterests',
    },
    {
      method: 'PUT',
      path: '/community/me/interests',
      handler: 'community-poll.updateMyInterests',
    },
  ],
};
