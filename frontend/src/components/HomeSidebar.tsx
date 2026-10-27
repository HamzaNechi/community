'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getActivePoll, getLeaderboard, getMyCommunityPoints, CommunityPoll, LeaderboardEntry, voteInPoll } from '@/lib/api';
import { getCommunityLevel } from '@/lib/community';
import { useAuth } from '@/lib/auth';
import CommunityIcon from '@/components/CommunityIcon';
import JoinCommunityButton from '@/components/JoinCommunityButton';

function PollWidget({ onPointsChange }: { onPointsChange: (points: number) => void }) {
  const { user, isLoading: authLoading } = useAuth();
  const [poll, setPoll] = useState<CommunityPoll | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (authLoading) return () => { active = false; };
    getActivePoll(Boolean(user))
      .then(result => { if (active) setPoll(result); })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : 'Impossible de charger le sondage.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, user]);

  async function vote(index: number) {
    if (!user || !poll || busy) return;
    setBusy(true);
    setError(null);
    try {
      await voteInPoll(poll.documentId, index);
      const [updatedPoll, communityPoints] = await Promise.all([getActivePoll(true), getMyCommunityPoints()]);
      setPoll(updatedPoll);
      onPointsChange(communityPoints.totalPoints);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible d’enregistrer votre vote.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card w-poll">
      <div className="w-label"><CommunityIcon name="trend" />Sondage de la semaine</div>
      {loading ? <p className="muted">Chargement du sondage…</p> : poll ? (
        <>
          <h3 className="poll-title">{poll.title}</h3>
          <p className="muted">Votez pour enregistrer votre choix et consulter les résultats. Un vote rapporte 1 point, une seule fois.</p>
          <div className="poll">
            {poll.options.map(({ label }, index) => {
              const voted = poll.selectedOption !== null;
              const count = poll.counts[index] ?? 0;
              const percentage = poll.totalVotes ? Math.round(count * 100 / poll.totalVotes) : 0;
              return voted ? (
                <button
                  type="button"
                  className={`popt res ${poll.selectedOption === index ? 'mine' : ''}`}
                  key={`${index}-${label}`}
                  onClick={() => void vote(index)}
                  disabled={busy || !user}
                  aria-pressed={poll.selectedOption === index}
                >
                  <span className="pbar" style={{ '--w': `${percentage}%` } as React.CSSProperties} />
                  <span className="plabel">{poll.selectedOption === index && <CommunityIcon name="check" />}{label}</span>
                  <span className="ppct">{percentage} %</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="popt"
                  key={`${index}-${label}`}
                  onClick={() => void vote(index)}
                  disabled={busy || authLoading}
                >
                  <span className="pradio" /><span className="plabel">{label}</span>
                </button>
              );
            })}
            <p className="pfoot">{poll.totalVotes.toLocaleString('fr-FR')} votes · {poll.selectedOption === null ? 'Votez pour voir les résultats' : 'Touchez une autre réponse pour changer d’avis'}</p>
            {!user && !authLoading && poll.selectedOption === null && <Link className="text-link" href="/login">Connectez-vous pour voter</Link>}
            {error && <p className="form-error" role="alert">{error}</p>}
          </div>
        </>
      ) : <p className={error ? 'form-error' : 'muted'} role={error ? 'alert' : undefined}>{error ?? 'Aucun sondage actif pour le moment.'}</p>}
    </section>
  );
}

const events = [
  ['Le Revenu répond : vos questions sur l’assurance-vie', 'La rédaction du Revenu', '3 jours', 142],
  ['Atelier débutants : construire son premier portefeuille', 'La rédaction et des membres experts', '10 jours', 87],
  ['Le Revenu répond : préparer sa retraite', 'La rédaction du Revenu', '17 jours', 63],
] as const;

export default function HomeSidebar() {
  const { user, isLoading: authLoading } = useAuth();
  const [pointsData, setPointsData] = useState<{ userId: number; points: number } | null>(null);
  const [members, setMembers] = useState<LeaderboardEntry[]>([]);
  const [pointsError, setPointsError] = useState<{ userId: number; message: string } | null>(null);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (authLoading) return () => { active = false; };
    if (user) {
      getMyCommunityPoints()
        .then(result => {
          if (active) {
            setPointsData({ userId: user.id, points: result.totalPoints });
            setPointsError(null);
          }
        })
        .catch(cause => {
          if (active) setPointsError({
            userId: user.id,
            message: cause instanceof Error ? cause.message : 'Impossible de charger votre progression.',
          });
        });
    }
    getLeaderboard('month')
      .then(result => { if (active) setMembers(result.slice(0, 5)); })
      .catch(cause => {
        if (active) setLeaderboardError(cause instanceof Error ? cause.message : 'Impossible de charger le classement mensuel.');
      });
    const updatePoints = (event: Event) => {
      const total = (event as CustomEvent<number>).detail;
      if (user && typeof total === 'number') {
        setPointsData({ userId: user.id, points: total });
        setPointsError(null);
      }
    };
    const refreshPoints = () => {
      if (!user) return;
      getMyCommunityPoints()
        .then(result => { if (active) setPointsData({ userId: user.id, points: result.totalPoints }); })
        .catch(cause => {
          if (active) setPointsError({
            userId: user.id,
            message: cause instanceof Error ? cause.message : 'Impossible d’actualiser votre progression.',
          });
        });
    };
    window.addEventListener('community-points-updated', updatePoints);
    window.addEventListener('community-points-refresh', refreshPoints);
    return () => {
      active = false;
      window.removeEventListener('community-points-updated', updatePoints);
      window.removeEventListener('community-points-refresh', refreshPoints);
    };
  }, [authLoading, user]);

  const points = user && pointsData?.userId === user.id ? pointsData.points : null;
  const displayedPointsError = user && pointsError?.userId === user.id ? pointsError.message : null;
  const level = getCommunityLevel(points ?? 0);
  const pointsToNext = level.pointsToNext;
  return (
    <aside className="right">
      {user ? (
        <section className="card">
          <h2 className="card-title">Votre progression<Link className="more" href="/profil">Mon profil</Link></h2>
          <div className="prog-head">
            <span className="av av-md member-avatar" aria-hidden="true">{user.username.slice(0, 1).toUpperCase()}</span>
            <div><h3>{level.name}</h3><small>{points === null ? 'Chargement…' : `${points} points`}</small></div>
          </div>
          {displayedPointsError ? <p className="form-error" role="alert">{displayedPointsError}</p> : points === null ? null : (
            <>
              <div className="progress" role="progressbar" aria-valuenow={level.progress} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${level.progress}%` }} />
              </div>
              <div className="prog-meta">
                {level.nextName ? <>Encore <b className="num">{pointsToNext}</b> pts pour « {level.nextName} »</> : 'Niveau maximum'}
              </div>
            </>
          )}
        </section>
      ) : (
        <section className="card join-card">
          <h3>Rejoignez la communauté</h3>
          <p>Avec votre compte lerevenu.com, gratuitement.</p>
          <ul>
            <li><CommunityIcon name="check" />Posez vos questions d&apos;argent à des milliers de lecteurs</li>
            <li><CommunityIcon name="check" />Recevez les réponses de la rédaction</li>
            <li><CommunityIcon name="check" />Gagnez des badges en aidant les autres</li>
          </ul>
          <JoinCommunityButton label="Rejoindre la communauté" className="btn btn-primary btn-block" />
        </section>
      )}

      <section className="card w-q">
        <div className="w-label"><CommunityIcon name="trophy" />Question de la semaine</div>
        <h3>Quel est le meilleur conseil d&apos;argent que vous ayez reçu ?</h3>
        <div className="meta"><span>5 réponses · posée par la rédaction</span></div>
        <Link href="/?category=cafe" className="btn btn-secondary btn-sm">Je réponds</Link>
      </section>

      <PollWidget onPointsChange={totalPoints => {
        if (user) setPointsData({ userId: user.id, points: totalPoints });
      }} />

      <section className="card">
        <h2 className="card-title"><CommunityIcon name="book" />Billets des membres</h2>
        <div className="rlist">
          <Link className="ritem" href="/profil"><b>Dix ans d&apos;investissement passif : ce que j&apos;ai appris</b><p>Vincent_ETF · 5 min de lecture</p></Link>
          <Link className="ritem" href="/profil"><b>Mes trois pires erreurs en Bourse (et ce qu&apos;elles m&apos;ont appris)</b><p>PapyBoursier · 6 min de lecture</p></Link>
          <Link className="ritem" href="/profil"><b>Première année de retraite : comment nous avons revu notre budget</b><p>Odile.Retraite · 4 min de lecture</p></Link>
        </div>
        {user && <Link href="/profil" className="btn btn-secondary btn-sm">Écrire un billet</Link>}
      </section>

      <section className="card">
        <h2 className="card-title"><CommunityIcon name="book" />À la une sur lerevenu.com</h2>
        <div className="rlist site-news">
          <a className="ritem" href="https://www.lerevenu.com" target="_blank" rel="noopener noreferrer"><small>Diversifier vos placements</small><b>Fonds euros : les rendements servis par les assureurs</b></a>
          <a className="ritem" href="https://www.lerevenu.com" target="_blank" rel="noopener noreferrer"><small>Réussir en Bourse</small><b>Les valeurs à surveiller cette semaine</b></a>
          <a className="ritem" href="https://www.lerevenu.com" target="_blank" rel="noopener noreferrer"><small>Réduire vos impôts</small><b>Déclaration de revenus : les cases à ne pas oublier</b></a>
        </div>
        <a href="https://www.lerevenu.com" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm btn-block">Aller sur lerevenu.com<CommunityIcon name="external" /></a>
      </section>

      <section className="card">
        <h2 className="card-title"><CommunityIcon name="clock" />Le Revenu répond</h2>
        <p className="muted">Agenda indicatif de la maquette. Les inscriptions ne sont pas encore disponibles.</p>
        {events.map(([title, host, date, participants]) => (
        <article className="ev" key={title}>
          <div className="ev-date"><small>Dans</small><b>{date.split(' ')[0]}</b></div>
          <div><h4>{title}</h4><p>{date} · {host}</p><span className="muted">{participants} participants annoncés</span></div>
        </article>
        ))}
      </section>

      <section className="card">
        <h2 className="card-title"><CommunityIcon name="trophy" />Top du mois<Link className="more" href="/classement">Classement</Link></h2>
        {members.map((member, index) => (
          <div className="top-row" key={member.documentId}>
            <span className="top-rank">{index + 1}</span>
            <span className="av av-sm" style={{ '--c': 'var(--av-1)' } as React.CSSProperties}>{member.username.slice(0, 1).toUpperCase()}</span>
            <Link className="top-name" href="/classement">{member.username}<small>{getCommunityLevel(member.totalPoints ?? member.points).name}</small></Link>
            <span className="top-pts">+{member.points}</span>
          </div>
        ))}
        {leaderboardError
          ? <p className="form-error" role="alert">{leaderboardError}</p>
          : !members.length && <p className="muted">Aucune contribution classée pour ce mois.</p>}
      </section>
    </aside>
  );
}
