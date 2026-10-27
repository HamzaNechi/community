import type { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Vérifie si la base est déjà peuplée pour éviter les doublons
    const count = await strapi.documents('api::category.category').count({});
    if (count > 0) {
      strapi.log.info('Seed ignoré : la base contient déjà des données.');
      return;
    }

    strapi.log.info('Démarrage du seeding automatique…');
    try {
      await seed(strapi);
      strapi.log.info('Seeding terminé avec succès.');
    } catch (error) {
      strapi.log.error('Erreur lors du seeding :', error);
    }
  },
};

async function seed(strapi: Core.Strapi) {
  // 1. Catégories
  const categoriesData = [
    { name: 'Bourse & actions', slug: 'bourse', description: 'Actions, ETF, PEA, compte-titres.' },
    { name: 'Épargne & placements', slug: 'epargne', description: 'Livrets, fonds euros, obligations.' },
    { name: 'Assurance-vie', slug: 'assurance-vie', description: 'Choisir son contrat, arbitrer, transmettre.' },
    { name: 'Immobilier & SCPI', slug: 'immobilier', description: 'Résidence principale, locatif, SCPI.' },
    { name: 'Impôts & fiscalité', slug: 'impots', description: 'Déclaration, niches fiscales, IFI.' },
    { name: 'Retraite', slug: 'retraite', description: 'PER, rachat de trimestres, cumul emploi-retraite.' },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const entry = await strapi.documents('api::category.category').create({
      data: cat,
      status: 'published',
    });
    categories[cat.slug] = entry.documentId;
    strapi.log.info(`Catégorie créée : ${cat.name}`);
  }

  // 2. Discussions
  const discussionsData = [
    {
      title: 'Ouvrir un PEA avec 5 000 € : par où commencer ?',
      content: 'Bonjour, je viens d\'ouvrir un PEA en ligne et j\'ai 5 000 € à y placer. Vaut-il mieux tout investir d\'un coup ou étaler ?',
      type: 'question' as const,
      category: categories.bourse,
    },
    {
      title: 'Assurance-vie après 70 ans : est-ce encore intéressant ?',
      content: 'J\'ai 71 ans et je me demande s\'il est encore utile de verser sur une assurance-vie pour la transmission à mes petits-enfants.',
      type: 'question' as const,
      category: categories['assurance-vie'],
    },
    {
      title: 'SCPI : vous avez renforcé ces derniers mois ou vous attendez ?',
      content: 'Après les baisses de prix de parts de certaines SCPI, je vois deux écoles. Et vous, comment avez-vous réagi ?',
      type: 'discussion' as const,
      category: categories.immobilier,
    },
    {
      title: 'Frais réels ou abattement de 10 % : comment choisir ?',
      content: 'Je fais 35 km aller-retour par jour en voiture. Est-ce que je devrais passer aux frais réels ?',
      type: 'question' as const,
      category: categories.impots,
    },
    {
      title: 'PER : vos retours d\'expérience après quelques années ?',
      content: 'J\'ai ouvert un PER il y a trois ans pour la déduction fiscale. Je m\'interroge sur les frais et la sortie.',
      type: 'discussion' as const,
      category: categories.retraite,
    },
  ];

  const discussions: any[] = [];
  for (const disc of discussionsData) {
    const entry = await strapi.documents('api::discussion.discussion').create({
      data: disc,
      status: 'published',
    });
    discussions.push(entry);
    strapi.log.info(`Discussion créée : ${disc.title}`);
  }

  // 3. Réponses
  const repliesData = [
    { discussion: discussions[0].documentId, content: 'Pour débuter, un ETF éligible au PEA qui réplique un indice mondial fait très bien le travail. Une seule ligne, des frais faibles.' },
    { discussion: discussions[0].documentId, content: 'Investir une partie maintenant puis programmer un versement mensuel permet de lisser son point d\'entrée.' },
    { discussion: discussions[1].documentId, content: 'Pour les versements après 70 ans, l\'abattement est de 30 500 € au total, et il ne porte que sur les primes versées : les gains sont exonérés.' },
    { discussion: discussions[2].documentId, content: 'J\'ai renforcé, mais uniquement sur des SCPI récentes, sans immobilier de bureaux acheté au plus haut.' },
    { discussion: discussions[3].documentId, content: 'Faites le calcul simplement : additionnez vos frais et comparez avec 10 % de votre salaire.' },
    { discussion: discussions[4].documentId, content: 'Le point clé pour moi : les frais. Un PER en ligne avec des ETF, c\'est très différent d\'un PER bancaire avec 3 % de frais d\'entrée.' },
  ];

  for (const reply of repliesData) {
    await strapi.documents('api::reply.reply').create({
      data: reply,
      status: 'published',
    });
  }
  strapi.log.info(`${repliesData.length} réponses créées`);
}