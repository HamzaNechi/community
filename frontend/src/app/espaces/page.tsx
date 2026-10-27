import { Suspense } from 'react';
import Link from 'next/link';
import { COMMUNITY_CATEGORIES } from '@/lib/categories';
import CommunityIcon from '@/components/CommunityIcon';
import CommunityShell from '@/components/CommunityShell';

async function SpacesContent() {
  return (
    <CommunityShell active="spaces">
    <section className="spaces-page">
      <header className="page-head">
        <h1>Tous les espaces</h1>
        <p>Onze espaces thématiques, calqués sur les grandes rubriques du Revenu.</p>
      </header>
      <div className="spaces-grid">
        {COMMUNITY_CATEGORIES.map(category => {
          return (
            <Link key={category.slug} href={`/?category=${encodeURIComponent(category.slug)}`} className="space-card">
              <span className="sp-ic md" style={{ '--c': category.color } as React.CSSProperties}><CommunityIcon name={category.icon} /></span>
              <h2>{category.name}</h2>
              <p>{category.description}</p>
              <span className="space-stats"><span className="num">{category.topics}</span> discussions · <span className="num">{category.replies.toLocaleString('fr-FR')}</span> réponses</span>
            </Link>
          );
        })}
      </div>
    </section>
    </CommunityShell>
  );
}

export default function SpacesPage() {
  return (
    <Suspense fallback={<CommunityShell active="spaces"><p className="loading-state">Chargement des espaces…</p></CommunityShell>}>
      <SpacesContent />
    </Suspense>
  );
}
