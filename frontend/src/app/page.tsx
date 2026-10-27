import { Suspense } from 'react';
import Link from 'next/link';
import { getDiscussions, Discussion } from '@/lib/api';
import DiscussionCard from '@/components/DiscussionCard';
import CategoryFilter from '@/components/CategoryFilter';
import HomeWelcome from '@/components/HomeWelcome';
import HomeSidebar from '@/components/HomeSidebar';
import CommunityIcon from '@/components/CommunityIcon';
import CommunitySideNav from '@/components/CommunitySideNav';

type HomeSearchParams = Promise<{ category?: string; q?: string; sort?: string; page?: string }>;

const DISCUSSIONS_PER_PAGE = 10;

async function DiscussionsContent({ searchParams }: { searchParams: HomeSearchParams }) {
  const params = await searchParams;
  const categorySlug = params.category;
  const query = params.q?.trim().toLocaleLowerCase('fr');
  const sort = params.sort ?? 'popular';
  const requestedPage = Number.parseInt(params.page ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  let discussions: Discussion[] = [];
  let error: string | null = null;
  try {
    discussions = await getDiscussions({ categorySlug });
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
  const hot = (discussion: Discussion) => {
    const score = 1 + discussion.replies.length * 3 + (discussion.likes ?? 0) * 2 + (discussion.views ?? 0) / 25;
    return score;
  };
  const sortedDiscussions = [...(sort === 'unanswered' ? unanswered : matchingDiscussions)].sort((a, b) => {
    if (sort === 'popular') return hot(b) - hot(a);
    return b.createdAt.localeCompare(a.createdAt);
  });
  const pageCount = Math.ceil(sortedDiscussions.length / DISCUSSIONS_PER_PAGE);
  const currentPage = pageCount ? Math.min(page, pageCount) : 1;
  const pageDiscussions = sortedDiscussions.slice(
    (currentPage - 1) * DISCUSSIONS_PER_PAGE,
    currentPage * DISCUSSIONS_PER_PAGE,
  );

  const hrefForSort = (value: string) => {
    const searchParamsForSort = new URLSearchParams();
    if (categorySlug) searchParamsForSort.set('category', categorySlug);
    if (query) searchParamsForSort.set('q', params.q ?? '');
    if (value !== 'popular') searchParamsForSort.set('sort', value);
    const search = searchParamsForSort.toString();
    return search ? `/?${search}` : '/';
  };
  const hrefForPage = (value: number) => {
    const searchParamsForPage = new URLSearchParams();
    if (categorySlug) searchParamsForPage.set('category', categorySlug);
    if (query) searchParamsForPage.set('q', params.q ?? '');
    if (sort !== 'popular') searchParamsForPage.set('sort', sort);
    if (value > 1) searchParamsForPage.set('page', String(value));
    const search = searchParamsForPage.toString();
    return search ? `/?${search}` : '/';
  };

  return (
    <div className="layout">
      <CommunitySideNav active={categorySlug ? `cat:${categorySlug}` : 'home'} />

      <main className="main">
        <HomeWelcome />

        <Link href="/discussions/new" className="quick">
          <span className="av av-md" aria-hidden="true"><CommunityIcon name="user" /></span>
          <span className="quick-input">Posez votre question à la communauté…</span>
          <span className="quick-types" aria-hidden="true"><span className="quick-type"><CommunityIcon name="help" />Question</span><span className="quick-type"><CommunityIcon name="msg" />Discussion</span></span>
        </Link>

        <CategoryFilter current={categorySlug} />
        {query && <p className="search-result-label">{matchingDiscussions.length} résultat{matchingDiscussions.length > 1 ? 's' : ''} pour « {params.q} »</p>}
        <div className="feed-bar">
          <nav className="tabs" aria-label="Trier les discussions">
            <Link href={hrefForSort('popular')} className={`tab ${sort === 'popular' ? 'active' : ''}`}><CommunityIcon name="trend" />Tendances</Link>
            <Link href={hrefForSort('recent')} className={`tab ${sort === 'recent' ? 'active' : ''}`}><CommunityIcon name="clock" />Récentes</Link>
            <Link href={hrefForSort('unanswered')} className={`tab ${sort === 'unanswered' ? 'active' : ''}`}>
              <CommunityIcon name="help" />Sans réponse{unanswered.length > 0 && <span className="tab-count">{unanswered.length}</span>}
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
            {pageDiscussions.map(discussion => <DiscussionCard key={discussion.documentId} discussion={discussion} />)}
          </div>
        )}
        {pageCount > 1 && (
          <nav className="pagination" aria-label="Pagination des discussions">
            <Link
              href={hrefForPage(currentPage - 1)}
              className={`pagination-link ${currentPage === 1 ? 'disabled' : ''}`}
              aria-disabled={currentPage === 1}
              tabIndex={currentPage === 1 ? -1 : undefined}
            >
              Précédent
            </Link>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map(pageNumber => (
              <Link
                key={pageNumber}
                href={hrefForPage(pageNumber)}
                className={`pagination-link ${pageNumber === currentPage ? 'active' : ''}`}
                aria-current={pageNumber === currentPage ? 'page' : undefined}
                aria-label={`Page ${pageNumber}`}
              >
                {pageNumber}
              </Link>
            ))}
            <Link
              href={hrefForPage(currentPage + 1)}
              className={`pagination-link ${currentPage === pageCount ? 'disabled' : ''}`}
              aria-disabled={currentPage === pageCount}
              tabIndex={currentPage === pageCount ? -1 : undefined}
            >
              Suivant
            </Link>
          </nav>
        )}
      </main>

      <HomeSidebar />
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
