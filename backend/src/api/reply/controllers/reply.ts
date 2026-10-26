import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::reply.reply', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("Vous devez être connecté pour publier une réponse.");
    }

    const { data } = ctx.request.body as any;

    const entry = await strapi.documents('api::reply.reply').create({
      data: {
        content: data.content,
        discussion: data.discussion,
        author: user.id,
      },
    });

    return { data: entry };
  },
}));