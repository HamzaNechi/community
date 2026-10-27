'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { COMMUNITY_CATEGORIES } from '@/lib/categories';

export default function CategoryFilter({ current }: { current?: string }) {
  const searchParams = useSearchParams();
  const hrefFor = (slug?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set('category', slug);
    else params.delete('category');
    params.delete('page');
    const query = params.toString();
    return query ? `/?${query}` : '/';
  };

  return (
    <nav className="cat-scroller" id="espaces" aria-label="Filtrer par espace">
      <Link href={hrefFor()} className={`chip ${!current ? 'active' : ''}`}>Tout</Link>
      {COMMUNITY_CATEGORIES.map(category => (
        <Link
          key={category.slug}
          href={hrefFor(category.slug)}
          className={`chip ${current === category.slug ? 'active' : ''}`}
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
}
