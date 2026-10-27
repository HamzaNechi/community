import CommunityShell from '@/components/CommunityShell';

const rules = [
  ['Bienveillance', 'On débat des idées, jamais des personnes. Les débutants sont les bienvenus : aucune question n’est bête.'],
  ['Expérience, pas conseil personnalisé', 'Partagez ce que vous faites et pourquoi. Chacun reste responsable de ses décisions d’investissement.'],
  ['Pas de sollicitation', 'Aucune promotion de produit, de parrainage ou de service payant.'],
  ['Des liens vers des sources fiables', 'Pour éviter la publicité déguisée, seuls les liens vers lerevenu.com et les sources officielles (sites publics, AMF, Banque de France, Insee, Cour des comptes) sont acceptés. Les autres liens sont réservés aux membres confirmés et vérifiés par la modération avant d’être cliquables.'],
  ['Pas de rumeurs de marché', 'Les « tuyaux » non sourcés et les incitations à acheter ou vendre un titre sont supprimés.'],
  ['Protégez-vous', 'Un pseudonyme suffit pour participer : seuls les professionnels vérifiés apparaissent sous leur nom. Ne publiez jamais vos coordonnées bancaires, numéros de contrat ou informations permettant de vous identifier.'],
  ['Signalez plutôt que répondre', 'Un message vous semble problématique ? Utilisez « Signaler » : l’équipe de modération intervient rapidement.'],
];

export default function CharterPage() {
  return (
    <CommunityShell active="charter">
    <section className="charter-page">
      <header className="page-head">
        <h1>La charte de la communauté</h1>
        <p>Sept règles simples pour que les échanges restent utiles, sûrs et agréables. Elles se lisent en deux minutes.</p>
      </header>
      <ol className="rules">
        {rules.map(([title, description]) => (
          <li key={title}>
            <div><h3>{title}</h3><p>{description}</p></div>
          </li>
        ))}
      </ol>
    </section>
    </CommunityShell>
  );
}
