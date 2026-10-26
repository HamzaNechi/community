import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::discussion.discussion', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("Vous devez être connecté pour créer une discussion.");
    }

    const { data } = ctx.request.body as any;

    // Création directe via le Document Service, en forçant l'auteur
    const entry = await strapi.documents('api::discussion.discussion').create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        category: data.category, // si fourni
        author: user.id,         // injecté ici, pas dans le body
      },
    });

    // On formate la réponse pour qu'elle ressemble à celle de l'API standard
    return { data: entry };
  },
}));