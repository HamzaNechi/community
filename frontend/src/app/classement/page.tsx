import { Suspense } from 'react';
import Link from 'next/link';
import { getLeaderboard, LeaderboardEntry } from '@/lib/api';
import { getCommunityLevel } from '@/lib/community';
import CommunityIcon from '@/components/CommunityIcon';
import CommunityShell from '@/components/CommunityShell';

const pointRules = [
  ['Publier une réponse', 3],
  ['Lancer une discussion', 5],
  ['Recevoir un « Utile »', 5],
  ['Meilleure réponse', 20],
  ['Voter à un sondage', 1],
  ['Visite quotidienne', 1],
] as const;

const levels = [
  ['Nouveau venu', 0],
  ['Membre', 25],
  ['Contributeur', 100],
  ['Contributeur averti', 300],
  ['Pilier de la communauté', 750],
] as const;

const badges = [
  ['Bienvenue', 'A rejoint la communauté', 'hand'],
  ['Premier pas', 'A lancé sa première discussion', 'pen'],
  ['Entraide', 'A publié sa première réponse', 'msg'],
  ['Apprécié', 'A reçu son premier « Utile »', 'thumb'],
  ['Populaire', 'A reçu 25 « Utile »', 'star'],
  ['Bonne réponse', 'Réponse choisie comme meilleure réponse', 'check'],
] as const;

async function LeaderboardContent({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period } = await searchParams;
  const activePeriod = period === 'all' ? 'all' : 'month';
  let members: LeaderboardEntry[] = [];
  let error: string | null = null;
  try {
    members = await getLeaderboard(activePeriod);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'Erreur inconnue';
  }
  const displayMembers = members.map(member => ({
    ...member,
    displayName: member.username,
    avatarColor: '--av-1',
  }));

  return (
    <CommunityShell active="leaderboard" right={
      <>
        <section className="card">
          <h2 className="card-title">Gagner des points</h2>
          <ul className="plist">{pointRules.map(([label, points]) => <li key={label}><span>{label}</span><b>+{points}</b></li>)}</ul>
        </section>
        <section className="card">
          <h2 className="card-title">Les niveaux</h2>
          <ul className="plist">{levels.map(([label, points]) => <li key={label}><span>{label}</span><b>{points}</b></li>)}</ul>
        </section>
        <section className="card">
          <h2 className="card-title">Badges à débloquer</h2>
          <div className="badge-preview-list">
            {badges.map(([name, description, icon]) => (
              <div className="badge-preview" key={name}>
                <span className="bdg locked"><CommunityIcon name={icon} /></span>
                <span><b>{name}</b><small>{description}</small></span>
              </div>
            ))}
          </div>
        </section>
      </>
    }>
      <section className="leaderboard-page">
        <header className="page-head">
          <h1>Classement des contributeurs</h1>
          <p>Les membres qui font vivre la communauté. Aidez les autres, gagnez des points, montez de niveau.</p>
        </header>
        <nav className="tabs leaderboard-tabs" aria-label="Période du classement">
          <Link href="/classement?period=month" className={`tab ${activePeriod === 'month' ? 'on' : ''}`}><CommunityIcon name="clock" />Ce mois-ci</Link>
          <Link href="/classement?period=all" className={`tab ${activePeriod === 'all' ? 'on' : ''}`}><CommunityIcon name="trophy" />Depuis toujours</Link>
        </nav>
        {error ? (
          <p className="card error-card" role="alert">Impossible de charger le classement : {error}</p>
        ) : (
          <ol className="lb card">
            {displayMembers.map((member, index) => (
              <li key={member.documentId}>
                <span className="rank">{index < 3 ? <span className={`medal m${index + 1}`}>{index + 1}</span> : index + 1}</span>
                <span className="av av-sm" style={{ '--c': `var(${member.avatarColor})` } as React.CSSProperties}>{member.displayName.slice(0, 1).toUpperCase()}</span>
                <span className="who"><b>{member.displayName}</b><small>{getCommunityLevel(member.totalPoints ?? member.points).name}</small></span>
                <span className="pts num">{activePeriod === 'all' ? member.totalPoints ?? member.points : `+${member.points}`} pts</span>
              </li>
            ))}
            {!displayMembers.length && <li className="empty-state">Aucun membre n’a encore gagné de points pour cette période.</li>}
          </ol>
        )}
      </section>
    </CommunityShell>
  );
}

export default function LeaderboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  return (
    <Suspense fallback={<CommunityShell active="leaderboard"><p className="loading-state">Chargement du classement…</p></CommunityShell>}>
      <LeaderboardContent searchParams={searchParams} />
    </Suspense>
  );
}
