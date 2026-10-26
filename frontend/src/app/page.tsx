import { Suspense } from 'react';
import Link from 'next/link';
import { getDiscussions, getCategories, Discussion, Category } from '@/lib/api';
import DiscussionCard from '@/components/DiscussionCard';
import CategoryFilter from '@/components/CategoryFilter';
import HomeSidebar from '@/components/HomeSidebar';
import HomeWelcome from '@/components/HomeWelcome';
import MemberModePreview from '@/components/MemberModePreview';

type HomeSearchParams = Promise<{ category?: string; q?: string; sort?: string }>;

async function DiscussionsContent({ searchParams }: { searchParams: HomeSearchParams }) {
  const params = await searchParams;
  const categorySlug = params.category;
  const query = params.q?.trim().toLocaleLowerCase('fr');
  const sort = params.sort ?? 'popular';

  let discussions: Discussion[] = [];
  let categories: Category[] = [];
  let error: string | null = null;
  try {
    [discussions, categories] = await Promise.all([
      getDiscussions({ categorySlug }),
      getCategories(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Erreur inconnue';
  }

  if (error) {
    return <div className="card error-card">Impossible de charger les discussions : {error}</div>;
  }

  const matchingDiscussions = discussions.filter(discussion => (
    !query || `${discussion.title} ${discussion.content} ${discussion.category?.name ?? ''}`
      .toLocaleLowerCase('fr')
      .includes(query)
  ));
  const unanswered = matchingDiscussions.filter(discussion => discussion.replies.length === 0);
  const sortedDiscussions = [...(sort === 'unanswered' ? unanswered : matchingDiscussions)].sort((a, b) => {
    if (sort === 'popular') return b.replies.length - a.replies.length || b.createdAt.localeCompare(a.createdAt);
    return b.createdAt.localeCompare(a.createdAt);
  });

  const hrefForSort = (value: string) => {
    const searchParamsForSort = new URLSearchParams();
    if (categorySlug) searchParamsForSort.set('category', categorySlug);
    if (query) searchParamsForSort.set('q', params.q ?? '');
    if (value !== 'popular') searchParamsForSort.set('sort', value);
    const search = searchParamsForSort.toString();
    return search ? `/?${search}` : '/';
  };

  return (
    <div className="layout">
      <nav className="side" aria-label="Navigation principale">
        <Link href="/" className="nav-link active"><span className="nav-icon">⌂</span>Accueil</Link>
        <Link href="/espaces" className="nav-link"><span className="nav-icon">▦</span>Tous les espaces</Link>
        <div className="side-title">Espaces</div>
        {categories.map((category, index) => (
          <Link
            key={category.documentId}
            href={`/?category=${encodeURIComponent(category.slug)}`}
            className={`nav-link ${categorySlug === category.slug ? 'active' : ''}`}
          >
            <span className="nav-icon" data-tone={index % 6}>{category.name.slice(0, 1)}</span>
            <span>{category.name}</span>
          </Link>
        ))}
        <a href="https://www.lerevenu.com" target="_blank" rel="noreferrer" className="nav-foot">Retour sur lerevenu.com ↗</a>
      </nav>

      <main className="main">
        <MemberModePreview />
        <HomeWelcome
          categoryCount={categories.length}
          discussionCount={discussions.length}
          replyCount={discussions.reduce((total, discussion) => total + discussion.replies.length, 0)}
        />

        <Link href="/discussions/new" className="quick">
          <span className="nav-icon member-avatar" aria-hidden="true">+</span>
          <span className="quick-input">Posez votre question à la communauté…</span>
          <span className="quick-types" aria-hidden="true"><span className="quick-type">Question</span><span className="quick-type">Discussion</span></span>
        </Link>

        <div className="spaces-heading">
          <h2>Les espaces de la communauté</h2>
          <Link href="/espaces" className="text-link">Explorer tous les espaces →</Link>
        </div>
        <CategoryFilter categories={categories} current={categorySlug} />
        {query && <p className="search-result-label">{matchingDiscussions.length} résultat{matchingDiscussions.length > 1 ? 's' : ''} pour « {params.q} »</p>}
        <div className="feed-bar">
          <nav className="tabs" aria-label="Trier les discussions">
            <Link href={hrefForSort('popular')} className={`tab ${sort === 'popular' ? 'active' : ''}`}>↗ Tendances</Link>
            <Link href={hrefForSort('recent')} className={`tab ${sort === 'recent' ? 'active' : ''}`}>◷ Récentes</Link>
            <Link href={hrefForSort('unanswered')} className={`tab ${sort === 'unanswered' ? 'active' : ''}`}>
              ? Sans réponse{unanswered.length > 0 && <span className="tab-count">{unanswered.length}</span>}
            </Link>
          </nav>
        </div>

        {sortedDiscussions.length === 0 ? (
          <div className="feed empty-state">
            <h3>{query ? 'Aucune discussion trouvée' : 'Aucune discussion pour l’instant'}</h3>
            <p>{query ? 'Essayez un autre terme ou posez votre question à la communauté.' : 'Lancez la première discussion de cet espace.'}</p>
            <Link href="/discussions/new" className="btn btn-primary">＋ Publier une discussion</Link>
          </div>
        ) : (
          <div className="feed">
            {sortedDiscussions.map(discussion => <DiscussionCard key={discussion.documentId} discussion={discussion} />)}
          </div>
        )}
      </main>

      <HomeSidebar
        discussionCount={discussions.length}
        unansweredCount={unanswered.length}
      />
    </div>
  );
}

export default function HomePage({ searchParams }: { searchParams: HomeSearchParams }) {
  return (
    <div className="wrap">
      <Suspense fallback={<p className="loading-state">Chargement de la communauté…</p>}>
        <DiscussionsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
