'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StrapiUser } from '@/lib/api';
import CommunityIcon from '@/components/CommunityIcon';

export default function MobileCommunityNav({ user }: { user: StrapiUser | null }) {
  const pathname = usePathname();

  return (
    <nav className="bnav" aria-label="Navigation mobile">
      <Link href="/" className={pathname === '/' ? 'on' : ''}>
        <CommunityIcon name="home" /><span>Accueil</span>
      </Link>
      <Link href="/espaces" className={pathname === '/espaces' ? 'on' : ''}>
        <CommunityIcon name="grid" /><span>Espaces</span>
      </Link>
      <Link href="/discussions/new" aria-label="Publier">
        <span className="plus"><CommunityIcon name="plus" /></span>
      </Link>
      <Link href={user ? '/profil' : '/login'}>
        <CommunityIcon name="bell" /><span>Activité</span>
      </Link>
      <Link href={user ? '/profil' : '/login'} className={pathname === '/profil' ? 'on' : ''}>
        <CommunityIcon name="user" /><span>{user ? 'Profil' : 'Connexion'}</span>
      </Link>
    </nav>
  );
}
