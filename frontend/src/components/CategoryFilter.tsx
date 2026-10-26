'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Category } from '@/lib/api';

const categoryColors = ['#007aff', '#3d5a80', '#34c759', '#30b0c7', '#ff9500', '#5856d6', '#ff2d55', '#af52de', '#00a99d', '#8e8e93', '#a2845e'];

export default function CategoryFilter({ categories, current }: { categories: Category[]; current?: string }) {
  const searchParams = useSearchParams();
  const hrefFor = (slug?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set('category', slug);
    else params.delete('category');
    const query = params.toString();
    return query ? `/?${query}` : '/';
  };

  return (
    <nav className="category-scroller" id="espaces" aria-label="Filtrer par espace">
      <Link href={hrefFor()} className={`chip ${!current ? 'active' : ''}`}>Tout</Link>
      {categories.map((category, index) => (
        <Link
          key={category.documentId}
          href={hrefFor(category.slug)}
          className={`chip ${current === category.slug ? 'active' : ''}`}
          style={{ '--category-color': categoryColors[index % categoryColors.length] } as React.CSSProperties}
        >
          <span className="category-dot" aria-hidden="true" />
          {category.name}
        </Link>
      ))}
    </nav>
  );
}
