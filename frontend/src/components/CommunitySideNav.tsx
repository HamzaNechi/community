import Link from 'next/link';
import CommunityIcon from '@/components/CommunityIcon';
import { COMMUNITY_CATEGORIES } from '@/lib/categories';

export default function CommunitySideNav({ active }: { active?: string }) {
  return (
    <nav className="side" aria-label="Navigation principale">
      <Link href="/" className={`nav-link ${active === 'home' ? 'on' : ''}`}><CommunityIcon name="home" />Accueil</Link>
      <Link href="/espaces" className={`nav-link ${active === 'spaces' ? 'on' : ''}`}><CommunityIcon name="grid" />Tous les espaces</Link>
      <Link href="/classement" className={`nav-link ${active === 'leaderboard' ? 'on' : ''}`}><CommunityIcon name="trophy" />Classement</Link>
      <Link href="/charte" className={`nav-link ${active === 'charter' ? 'on' : ''}`}><CommunityIcon name="book" />Charte</Link>
      <div className="nav-title">Espaces</div>
      {COMMUNITY_CATEGORIES.map(category => (
        <Link
          key={category.slug}
          href={`/?category=${encodeURIComponent(category.slug)}`}
          className={`nav-link ${active === `cat:${category.slug}` ? 'on' : ''}`}
        >
          <span className="sp-ic" style={{ '--c': category.color } as React.CSSProperties}><CommunityIcon name={category.icon} /></span>
          <span>{category.name}</span>
        </Link>
      ))}
      <a href="https://www.lerevenu.com" target="_blank" rel="noopener noreferrer" className="nav-foot">
        <span>Retour sur lerevenu.com</span><CommunityIcon name="external" />
      </a>
    </nav>
  );
}
