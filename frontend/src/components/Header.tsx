'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faHouse, faLayerGroup, faPlus, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import JoinCommunityButton from '@/components/JoinCommunityButton';

const siteSections = ['Bourse', 'Économie', 'Placements', 'Immobilier', 'Impôts', 'Succession'];

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
          <a href="https://www.lerevenu.com" target="_blank" rel="noreferrer">← Retour sur lerevenu.com</a>
          <nav className="sb-links" aria-label="Rubriques de lerevenu.com">
            {siteSections.map(section => (
              <a key={section} href="https://www.lerevenu.com" target="_blank" rel="noreferrer">{section}</a>
            ))}
          </nav>
          <a className="sb-right subscribe" href="https://www.lerevenu.com" target="_blank" rel="noreferrer">
            S’abonner
          </a>
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
            <span aria-hidden="true">⌕</span>
            <input name="q" placeholder="Rechercher une discussion, un sujet…" aria-label="Rechercher" />
          </form>
          <details className="search-mobile">
            <summary aria-label="Rechercher">⌕</summary>
            <form action="/" role="search">
              <input name="q" placeholder="Rechercher une discussion…" aria-label="Rechercher une discussion" />
            </form>
          </details>
          <nav className="hdr-actions" aria-label="Compte">
            {user ? (
              <>
                <Link href="/discussions/new" className="btn btn-primary hdr-publish">＋ Publier</Link>
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
                      <Link role="menuitem" href="/profil" onClick={() => setAccountOpen(false)}>◉ Mon profil</Link>
                      <Link role="menuitem" href="/discussions/new" onClick={() => setAccountOpen(false)}>＋ Publier une discussion</Link>
                      <button role="menuitem" type="button" onClick={handleLogout}>↪ Déconnexion</button>
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
      <nav className="bnav" aria-label="Navigation mobile">
        <Link href="/">
          <FontAwesomeIcon icon={faHouse} aria-hidden="true" />
          <span>Accueil</span>
        </Link>
        <Link href="/espaces">
          <FontAwesomeIcon icon={faLayerGroup} aria-hidden="true" />
          <span>Espaces</span>
        </Link>
        <Link href="/discussions/new" aria-label="Publier">
          <span className="plus"><FontAwesomeIcon icon={faPlus} aria-hidden="true" /></span>
        </Link>
        <Link href={user ? '/profil' : '/login'}>
          <FontAwesomeIcon icon={faBell} aria-hidden="true" />
          <span>Activité</span>
        </Link>
        <Link href={user ? '/profil' : '/login'}>
          <FontAwesomeIcon icon={faUser} aria-hidden="true" />
          <span>{user ? 'Profil' : 'Connexion'}</span>
        </Link>
      </nav>
    </>
  );
}
