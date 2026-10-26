import { Suspense } from 'react';
import Link from 'next/link';
import { getCategories, getDiscussions, Category, Discussion } from '@/lib/api';

async function SpacesContent() {
  let categories: Category[];
  let discussions: Discussion[];
  try {
    [categories, discussions] = await Promise.all([getCategories(), getDiscussions()]);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Erreur inconnue';
    return (
      <main className="wrap spaces-page">
        <header className="page-head"><h1>Tous les espaces</h1><p>Explorez les thèmes de la communauté.</p></header>
        <p className="card error-card">Impossible de charger les espaces : {message}</p>
      </main>
    );
  }

  return (
    <main className="wrap spaces-page">
      <header className="page-head">
        <h1>Tous les espaces</h1>
        <p>Choisissez un thème pour retrouver les discussions et les expériences des lecteurs du Revenu.</p>
      </header>
      <div className="spaces-grid">
        {categories.map((category, index) => {
          const topics = discussions.filter(discussion => discussion.category?.slug === category.slug);
          const replies = topics.reduce((total, discussion) => total + discussion.replies.length, 0);
          return (
            <Link key={category.documentId} href={`/?category=${encodeURIComponent(category.slug)}`} className="space-card">
              <span className={`space-icon tone-${index % 8}`} aria-hidden="true">{category.name.slice(0, 1)}</span>
              <h2>{category.name}</h2>
              <p>{category.description}</p>
              <span className="space-stats">{topics.length} discussion{topics.length === 1 ? '' : 's'} · {replies} réponse{replies === 1 ? '' : 's'}</span>
              <span className="space-link">Explorer cet espace →</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

export default function SpacesPage() {
  return (
    <Suspense fallback={<main className="wrap spaces-page"><p className="loading-state">Chargement des espaces…</p></main>}>
      <SpacesContent />
    </Suspense>
  );
}
