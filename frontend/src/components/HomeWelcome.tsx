'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import JoinCommunityButton from '@/components/JoinCommunityButton';

type Props = { categoryCount: number; discussionCount: number; replyCount: number };

export default function HomeWelcome({ categoryCount, discussionCount, replyCount }: Props) {
  const { user } = useAuth();

  if (user) {
    return (
      <section className="member-greeting">
        <div>
          <span className="eyebrow">VOTRE COMMUNAUTÉ</span>
          <h1>Bonjour {user.username}</h1>
          <p>Reprenez les échanges et découvrez les dernières discussions des lecteurs.</p>
        </div>
        <Link href="/profil" className="btn btn-secondary">Mon profil</Link>
      </section>
    );
  }

  return (
    <section className="hero">
      <div>
        <h1>La communauté des lecteurs du Revenu</h1>
        <p>Posez vos questions d’argent, partagez vos expériences et échangez avec la rédaction. Bourse, épargne, impôts, retraite, transmission.</p>
        <div className="hero-stats">
          <span><b>{categoryCount}</b>espaces</span>
          <span><b>{discussionCount}</b>discussions</span>
          <span><b>{replyCount}</b>réponses</span>
        </div>
      </div>
      <div className="hero-cta">
        <JoinCommunityButton label="Rejoindre gratuitement" />
        <Link href="/espaces" className="btn btn-quiet">Explorer les espaces</Link>
      </div>
    </section>
  );
}
