'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function MemberModePreview() {
  const [mode, setMode] = useState<'visitor' | 'member'>('visitor');

  return (
    <section className="prototype-bar" aria-label="Aperçu des vues de la communauté">
      <span className="prototype-label"><b>Aperçu</b> Données de membre fictives</span>
      <div className="prototype-segment" role="group" aria-label="Choisir une vue">
        <button type="button" className={mode === 'visitor' ? 'active' : ''} aria-pressed={mode === 'visitor'} onClick={() => setMode('visitor')}>Visiteur</button>
        <button type="button" className={mode === 'member' ? 'active' : ''} aria-pressed={mode === 'member'} onClick={() => setMode('member')}>Membre actif</button>
      </div>
      {mode === 'member' && (
        <div className="member-mode-panel">
          <div className="member-welcome">
            <span className="member-avatar large">C</span>
            <div>
              <span className="eyebrow">APERÇU MEMBRE</span>
              <h2>Bonjour Camille</h2>
              <p>Membre · Abonnée · 142 points</p>
            </div>
          </div>
          <div className="member-preview-stats">
            <span><b>6 jours</b><small>de présence d’affilée</small></span>
            <span><b>3</b><small>notifications non lues</small></span>
            <span><b>5 badges</b><small>déjà obtenus</small></span>
          </div>
          <div className="member-preview-bottom">
            <div className="preview-interests"><span className="eyebrow">VOS ESPACES</span><span>Bourse & actions</span><span>Assurance-vie</span><span>Retraite</span></div>
            <div className="preview-level"><span className="eyebrow">PROGRESSION</span><b>Membre · 142 pts</b><span className="progress"><span /></span><small>Encore 158 pts pour « Contributeur averti »</small></div>
          </div>
          <Link href="/profil" className="text-link">Voir le vrai profil connecté →</Link>
        </div>
      )}
    </section>
  );
}
