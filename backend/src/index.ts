import type { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await initializeCommunityCounters(strapi);
    const count = await strapi.documents('api::category.category').count({});
    if (count > 0) {
      const categories = [
        { name: 'Économie', slug: 'economie', description: "Conjoncture, taux, inflation, emploi : l'actualité économique en France, en Europe et dans le monde." },
        { name: 'Famille & transmission', slug: 'transmission', description: 'Donation, succession, protection du conjoint.' },
        { name: 'Or, cryptos & alternatifs', slug: 'alternatifs', description: 'Or physique, cryptoactifs, forêts, private equity.' },
        { name: 'Budget & conso', slug: 'budget', description: 'Banques, crédits, assurances, bons plans.' },
        { name: 'Le Café du Revenu', slug: 'cafe', description: 'Présentations, discussions libres, idées pour la rédaction.' },
      ];
      const existing = await strapi.db.query('api::category.category').findMany({
        select: ['slug'],
      });
      const existingSlugs = new Set(existing.map(category => category.slug));
      for (const category of categories) {
        if (existingSlugs.has(category.slug)) continue;
        await strapi.documents('api::category.category').create({
          data: category,
          status: 'published',
        });
        strapi.log.info(`Catégorie créée : ${category.name}`);
      }
      await ensureCommunityPoll(strapi);
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

async function initializeCommunityCounters(strapi: Core.Strapi) {
  for (const uid of ['api::discussion.discussion', 'api::reply.reply'] as const) {
    const tableName = strapi.db.metadata.get(uid).tableName;
    const table = strapi.db.connection(tableName);
    if (uid === 'api::discussion.discussion') {
      await table.whereNull('likes').orWhereNull('views').update({
        likes: strapi.db.connection.raw('COALESCE(??, 0)', ['likes']),
        views: strapi.db.connection.raw('COALESCE(??, 0)', ['views']),
      });
    } else {
      await table.whereNull('likes').update({
        likes: strapi.db.connection.raw('COALESCE(??, 0)', ['likes']),
      });
    }
  }
  await synchronizeLikeCounters(strapi);
}

async function synchronizeLikeCounters(strapi: Core.Strapi) {
  await migrateLikeTargets(strapi);
  const likes = await strapi.db.query('api::community-like.community-like').findMany({
    where: { active: true },
    select: ['targetType', 'targetDocumentId'],
  });
  const discussionCounts = new Map<string, number>();
  const replyCounts = new Map<string, number>();
  for (const like of likes) {
    const targetDocumentId = like.targetDocumentId as string | null;
    if (!targetDocumentId) continue;
    const counts = like.targetType === 'discussion' ? discussionCounts
      : like.targetType === 'reply' ? replyCounts
        : null;
    if (counts) counts.set(targetDocumentId, (counts.get(targetDocumentId) ?? 0) + 1);
  }

  for (const [uid, counts] of [
    ['api::discussion.discussion', discussionCounts],
    ['api::reply.reply', replyCounts],
  ] as const) {
    const entries = await strapi.documents(uid).findMany({ fields: ['documentId'] });
    const tableName = strapi.db.metadata.get(uid).tableName;
    for (const entry of entries) {
      await strapi.db.connection(tableName)
        .where({ document_id: entry.documentId })
        .update({ likes: counts.get(entry.documentId) ?? 0 });
    }
  }
}

async function migrateLikeTargets(strapi: Core.Strapi) {
  const likes = await strapi.db.query('api::community-like.community-like').findMany({
    select: ['id', 'targetKey', 'targetType', 'targetDocumentId'],
  });
  for (const like of likes) {
    const match = /^(\d+):(discussion|reply):(.+)$/.exec(String(like.targetKey));
    if (!match) {
      strapi.log.warn(`Like communautaire ${like.id} ignoré : sa clé cible est invalide.`);
      continue;
    }

    const [, , targetType, targetDocumentId] = match;
    const uid = targetType === 'discussion' ? 'api::discussion.discussion' : 'api::reply.reply';
    const target = await strapi.documents(uid).findOne({
      documentId: targetDocumentId,
      fields: ['id'],
    });
    if (!target) {
      strapi.log.warn(`Like communautaire ${like.id} ignoré : publication ${targetDocumentId} introuvable.`);
      continue;
    }

    await strapi.db.query('api::community-like.community-like').update({
      where: { id: like.id },
      data: {
        targetType,
        targetDocumentId,
        discussion: targetType === 'discussion' ? target.id : null,
        reply: targetType === 'reply' ? target.id : null,
      },
    });
  }
}

async function seed(strapi: Core.Strapi) {
  // 1. Catégories
  const categoriesData = [
    { name: 'Bourse & actions', slug: 'bourse', description: 'Actions, ETF, PEA, compte-titres.' },
    { name: 'Économie', slug: 'economie', description: "Conjoncture, taux, inflation, emploi : l'actualité économique en France, en Europe et dans le monde." },
    { name: 'Épargne & placements', slug: 'epargne', description: 'Livrets, fonds euros, obligations.' },
    { name: 'Assurance-vie', slug: 'assurance-vie', description: 'Choisir son contrat, arbitrer, transmettre.' },
    { name: 'Immobilier & SCPI', slug: 'immobilier', description: 'Résidence principale, locatif, SCPI.' },
    { name: 'Impôts & fiscalité', slug: 'impots', description: 'Déclaration, niches fiscales, IFI.' },
    { name: 'Retraite', slug: 'retraite', description: 'PER, rachat de trimestres, cumul emploi-retraite.' },
    { name: 'Famille & transmission', slug: 'transmission', description: 'Donation, succession, protection du conjoint.' },
    { name: 'Or, cryptos & alternatifs', slug: 'alternatifs', description: 'Or physique, cryptoactifs, forêts, private equity.' },
    { name: 'Budget & conso', slug: 'budget', description: 'Banques, crédits, assurances, bons plans.' },
    { name: 'Le Café du Revenu', slug: 'cafe', description: 'Présentations, discussions libres, idées pour la rédaction.' },
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
  await ensureCommunityPoll(strapi);
}

async function ensureCommunityPoll(strapi: Core.Strapi) {
  const count = await strapi.db.query('api::community-poll.community-poll').count({});
  if (count > 0) return;

  await strapi.documents('api::community-poll.community-poll').create({
    data: {
      title: 'Quel est votre placement prioritaire pour les 12 prochains mois ?',
      options: [
        { label: 'Assurance-vie' },
        { label: 'Actions / PEA' },
        { label: 'Immobilier / SCPI' },
        { label: 'Livrets et épargne sans risque' },
        { label: 'Or' },
        { label: 'Rembourser mes crédits' },
      ],
      active: true,
    },
  });
  strapi.log.info('Sondage communautaire créé.');
}