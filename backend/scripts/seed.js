const STRAPI_URL = 'http://localhost:1337';
const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = '123456';

async function api(path, options = {}) {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${path} → ${res.status} ${JSON.stringify(json)}`);
  return json;
}

async function main() {
  console.log('→ Connexion…');
  const { jwt } = await api('/api/auth/local', {
    method: 'POST',
    body: JSON.stringify({ identifier: DEMO_EMAIL, password: DEMO_PASSWORD }),
  });
  const auth = { Authorization: `Bearer ${jwt}` };

  console.log('→ Création des catégories…');
  const categoriesData = [
    { name: 'Bourse & actions', slug: 'bourse', description: 'Actions, ETF, PEA, compte-titres.' },
    { name: 'Épargne & placements', slug: 'epargne', description: 'Livrets, fonds euros, obligations.' },
    { name: 'Assurance-vie', slug: 'assurance-vie', description: 'Choisir son contrat, arbitrer, transmettre.' },
    { name: 'Immobilier & SCPI', slug: 'immobilier', description: 'Résidence principale, locatif, SCPI.' },
    { name: 'Impôts & fiscalité', slug: 'impots', description: 'Déclaration, niches fiscales, IFI.' },
    { name: 'Retraite', slug: 'retraite', description: 'PER, rachat de trimestres, cumul emploi-retraite.' },
  ];
  const categories = {};
  for (const c of categoriesData) {
    const { data } = await api('/api/categories', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ data: c }),
    });
    categories[c.slug] = data.documentId;
    console.log(`  ✓ ${c.name}`);
  }

  console.log('→ Création des discussions…');
  const discussionsData = [
    {
      title: 'Ouvrir un PEA avec 5 000 € : par où commencer ?',
      content: 'Bonjour, je viens d\'ouvrir un PEA en ligne et j\'ai 5 000 € à y placer. Vaut-il mieux tout investir d\'un coup ou étaler ?',
      type: 'question',
      category: categories.bourse,
    },
    {
      title: 'Assurance-vie après 70 ans : est-ce encore intéressant ?',
      content: 'J\'ai 71 ans et je me demande s\'il est encore utile de verser sur une assurance-vie pour la transmission à mes petits-enfants.',
      type: 'question',
      category: categories['assurance-vie'],
    },
    {
      title: 'SCPI : vous avez renforcé ces derniers mois ou vous attendez ?',
      content: 'Après les baisses de prix de parts de certaines SCPI, je vois deux écoles. Et vous, comment avez-vous réagi ?',
      type: 'discussion',
      category: categories.immobilier,
    },
    {
      title: 'Frais réels ou abattement de 10 % : comment choisir ?',
      content: 'Je fais 35 km aller-retour par jour en voiture. Est-ce que je devrais passer aux frais réels ?',
      type: 'question',
      category: categories.impots,
    },
    {
      title: 'PER : vos retours d\'expérience après quelques années ?',
      content: 'J\'ai ouvert un PER il y a trois ans pour la déduction fiscale. Je m\'interroge sur les frais et la sortie.',
      type: 'discussion',
      category: categories.retraite,
    },
  ];

  const discussions = [];
  for (const d of discussionsData) {
    const { data } = await api('/api/discussions', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ data: d }),
    });
    discussions.push(data);
    console.log(`  ✓ ${d.title}`);
  }

  console.log('→ Création des réponses…');
  const repliesData = [
    { discussion: discussions[0].documentId, content: 'Pour débuter, un ETF éligible au PEA qui réplique un indice mondial fait très bien le travail. Une seule ligne, des frais faibles.' },
    { discussion: discussions[0].documentId, content: 'Investir une partie maintenant puis programmer un versement mensuel permet de lisser son point d\'entrée.' },
    { discussion: discussions[1].documentId, content: 'Pour les versements après 70 ans, l\'abattement est de 30 500 € au total, et il ne porte que sur les primes versées : les gains sont exonérés.' },
    { discussion: discussions[2].documentId, content: 'J\'ai renforcé, mais uniquement sur des SCPI récentes, sans immobilier de bureaux acheté au plus haut.' },
    { discussion: discussions[3].documentId, content: 'Faites le calcul simplement : additionnez vos frais et comparez avec 10 % de votre salaire.' },
    { discussion: discussions[4].documentId, content: 'Le point clé pour moi : les frais. Un PER en ligne avec des ETF, c\'est très différent d\'un PER bancaire avec 3 % de frais d\'entrée.' },
  ];
  for (const r of repliesData) {
    await api('/api/replies', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ data: r }),
    });
  }
  console.log(`  ✓ ${repliesData.length} réponses créées`);

  console.log('\n✅ Seeding terminé avec succès.');
}

main().catch(err => {
  console.error('❌ Erreur de seeding :', err.message);
  process.exit(1);
});