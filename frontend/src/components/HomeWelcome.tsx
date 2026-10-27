'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import JoinCommunityButton from '@/components/JoinCommunityButton';

export default function HomeWelcome() {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="greet"><h1>Bonjour {user.username}</h1></div>
    );
  }

  return (
    <section className="hero">
      <div>
        <h1>La communauté des lecteurs du Revenu</h1>
        <p>Posez vos questions d&apos;argent, partagez vos expériences et échangez avec la rédaction. Bourse, épargne, impôts, retraite, transmission.</p>
        <div className="hero-stats">
          <span><b>4 812</b>membres</span>
          <span><b>1 808</b>discussions</span>
          <span><b>13 700</b>réponses</span>
          <span><b>94 %</b>des questions résolues</span>
        </div>
      </div>
      <div className="hero-cta">
        <JoinCommunityButton label="Rejoindre gratuitement" />
        <Link href="/espaces" className="btn btn-quiet">Explorer les espaces</Link>
      </div>
    </section>
  );
}
