export default {
  routes: [
    {
      method: 'POST',
      path: '/community/discussions/:documentId/views',
      handler: 'discussion.recordView',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/community/:targetType/:documentId/like-state',
      handler: 'discussion.getLikeState',
    },
    {
      method: 'POST',
      path: '/community/:targetType/:documentId/like',
      handler: 'discussion.toggleLike',
    },
    {
      method: 'POST',
      path: '/community/discussions/:documentId/best-answer/:replyDocumentId',
      handler: 'discussion.chooseBestAnswer',
    },
  ],
};
