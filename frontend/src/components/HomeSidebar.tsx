'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import JoinCommunityButton from '@/components/JoinCommunityButton';

export default function HomeSidebar({ discussionCount, unansweredCount }: { discussionCount: number; unansweredCount: number }) {
  const { user } = useAuth();

  return (
    <aside className="right">
      {user ? (
        <section className="card">
          <h2 className="card-title">Votre espace membre</h2>
          <div className="prog-head">
            <span className="nav-icon member-avatar" aria-hidden="true">{user.username.slice(0, 1).toUpperCase()}</span>
            <div><strong>{user.username}</strong><small>Compte Le Revenu connecté</small></div>
          </div>
          <p className="progress-caption">Suivez vos contributions et vos centres d’intérêt depuis votre profil.</p>
          <Link href="/profil" className="btn btn-secondary btn-block">Voir mon profil</Link>
        </section>
      ) : (
        <section className="card join-card">
          <h2>Rejoignez la communauté</h2>
          <p>Avec votre compte lerevenu.com, gratuitement.</p>
          <ul>
            <li>✓ Posez vos questions aux lecteurs</li>
            <li>✓ Recevez les réponses de la rédaction</li>
            <li>✓ Aidez les autres membres</li>
          </ul>
          <JoinCommunityButton label="Rejoindre la communauté" className="btn btn-primary btn-block" />
        </section>
      )}

      <section className="card weekly">
        <div className="card-title">✦ À la une de la communauté</div>
        <h3>Les échanges continuent ici</h3>
        <p>Questions d’argent, retours d’expérience et discussions entre lecteurs du Revenu.</p>
        <div className="stats-grid">
          <div><strong className="num">{discussionCount}</strong><small>discussions</small></div>
          <div><strong className="num">{unansweredCount}</strong><small>sans réponse</small></div>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Besoin d’aide ?</h2>
        <p className="card-copy">Consultez les règles qui garantissent des échanges utiles et respectueux.</p>
        <p className="text-link">Bienveillance · expérience personnelle · pas de sollicitation</p>
      </section>
    </aside>
  );
}
