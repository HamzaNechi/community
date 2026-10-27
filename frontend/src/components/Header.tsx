'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import JoinCommunityButton from '@/components/JoinCommunityButton';
import CommunityIcon from '@/components/CommunityIcon';
import MobileCommunityNav from '@/components/MobileCommunityNav';

const siteSections = ['Bourse', 'Économie', 'Placements', 'Immobilier', 'Impôts', 'Succession', 'Vie pratique'];

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [accountOpen, setAccountOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push('/');
    router.refresh();
  }

  return (
    <>
      <div className="sitebar">
        <div className="wrap sitebar-inner">
          <a className="sb-back" href="https://www.lerevenu.com" target="_blank" rel="noopener noreferrer"><CommunityIcon name="arrowL" />Retour sur lerevenu.com</a>
          <nav className="sb-links" aria-label="Rubriques de lerevenu.com">
            {siteSections.map(section => (
              <a key={section} href="https://www.lerevenu.com" target="_blank" rel="noreferrer">{section}</a>
            ))}
          </nav>
          <span className="sb-right">
            <a className="sb-mag" href="https://www.lerevenu.com" target="_blank" rel="noopener noreferrer"><CommunityIcon name="book" />Le magazine</a>
            <a className="subscribe" href="https://www.lerevenu.com" target="_blank" rel="noopener noreferrer">S’abonner</a>
          </span>
        </div>
      </div>
      <header className="hdr">
        <div className="wrap hdr-inner">
          <Link href="/" className="brand" aria-label="Le Revenu, accueil de la communauté">
            <span className="lr-logo" aria-hidden="true"><span className="lr-le">LE</span><span className="lr-revenu">REVENU</span></span>
            <span className="brand-sep" />
            <span className="brand-sub">Communauté</span>
          </Link>
          <form action="/" className="search" role="search">
            <CommunityIcon name="search" />
            <input name="q" placeholder="Rechercher une discussion, un sujet…" aria-label="Rechercher" />
          </form>
          <details className="search-mobile">
            <summary aria-label="Rechercher"><CommunityIcon name="search" /></summary>
            <form action="/" role="search">
              <input name="q" placeholder="Rechercher une discussion…" aria-label="Rechercher une discussion" />
            </form>
          </details>
          <nav className="hdr-actions" aria-label="Compte">
            {user ? (
              <>
                <Link href="/discussions/new" className="btn btn-primary hdr-publish"><CommunityIcon name="plus" />Publier</Link>
                <div className="account-menu-wrap">
                  <button
                    type="button"
                    className="account-trigger"
                    aria-expanded={accountOpen}
                    aria-label={`Mon compte : ${user.username}`}
                    onClick={() => setAccountOpen(open => !open)}
                  >
                    <span className="account-avatar">{user.username.slice(0, 1).toUpperCase()}</span>
                    <span className="account-name">{user.username}</span>
                    <span aria-hidden="true">⌄</span>
                  </button>
                  {accountOpen && (
                    <div className="account-dropdown" role="menu">
                      <div className="account-summary">
                        <span className="account-avatar large">{user.username.slice(0, 1).toUpperCase()}</span>
                        <span><b>{user.username}</b><small>Membre de la communauté</small></span>
                      </div>
                      <Link role="menuitem" href="/profil" onClick={() => setAccountOpen(false)}><CommunityIcon name="user" />Mon profil</Link>
                      <Link role="menuitem" href="/classement" onClick={() => setAccountOpen(false)}><CommunityIcon name="trophy" />Classement</Link>
                      <Link role="menuitem" href="/charte" onClick={() => setAccountOpen(false)}><CommunityIcon name="book" />Charte</Link>
                      <Link role="menuitem" href="/discussions/new" onClick={() => setAccountOpen(false)}><CommunityIcon name="plus" />Publier une discussion</Link>
                      <button role="menuitem" type="button" onClick={handleLogout}><CommunityIcon name="external" />Déconnexion</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-quiet">Se connecter</Link>
                <JoinCommunityButton label="Rejoindre" className="btn btn-primary hdr-publish" />
              </>
            )}
          </nav>
        </div>
      </header>
      <Suspense fallback={null}><MobileCommunityNav user={user} /></Suspense>
    </>
  );
}
