'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { Category, Discussion, getCategories, getDiscussions, getMyCommunityPoints, getMyInterests, updateMyInterests } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getCommunityLevel } from '@/lib/community';
import CommunityShell from '@/components/CommunityShell';

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [monthlyPoints, setMonthlyPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([getCategories(), getDiscussions(), getMyCommunityPoints(), getMyInterests()])
      .then(([loadedCategories, loadedDiscussions, communityPoints, savedInterests]) => {
        if (!active) return;
        setCategories(loadedCategories);
        setDiscussions(loadedDiscussions);
        setTotalPoints(communityPoints.totalPoints);
        setMonthlyPoints(communityPoints.monthlyPoints);
        setInterests(savedInterests);
      })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : 'Impossible de charger le profil.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [user]);

  if (isLoading) return <CommunityShell active="profile"><p className="loading-state">Chargement du profil…</p></CommunityShell>;
  if (!user) {
    return (
      <CommunityShell active="profile">
        <section className="card empty-state">
          <h1>Connectez-vous pour voir votre profil</h1>
          <p>Retrouvez vos contributions et personnalisez les espaces qui vous intéressent.</p>
          <Link href="/login" className="btn btn-primary">Se connecter</Link>
        </section>
      </CommunityShell>
    );
  }

  const myDiscussions = discussions.filter(discussion => discussion.author?.documentId === user.documentId);
  const myReplies = discussions.reduce(
    (total, discussion) => total + discussion.replies.filter(reply => reply.author?.documentId === user.documentId).length,
    0,
  );
  const level = getCommunityLevel(totalPoints);

  function toggleInterest(slug: string) {
    setInterests(current => current.includes(slug)
      ? current.filter(value => value !== slug)
      : [...current, slug]);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!user) {
      setError('Connectez-vous pour modifier vos préférences.');
      return;
    }
    if (!interests.length) {
      setError('Sélectionnez au moins un espace pour personnaliser votre fil.');
      return;
    }
    try {
      const savedInterests = await updateMyInterests(interests);
      setInterests(savedInterests);
      setMessage('Vos centres d’intérêt ont été enregistrés.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Vos préférences n’ont pas pu être enregistrées.');
    }
  }

  return (
    <CommunityShell active="profile">
    <section className="profile-wrap">
      <div className="profile-layout">
        <div className="main">
          <section className="card profile-header">
            <span className="profile-avatar" aria-hidden="true">{user.username.slice(0, 1).toUpperCase()}</span>
            <div className="profile-identity">
              <span className="eyebrow">PROFIL MEMBRE</span>
              <h1>{user.username}</h1>
              <p>@{user.username} · Compte connecté au Revenu</p>
            </div>
            <Link href="/discussions/new" className="btn btn-primary">＋ Publier</Link>
          </section>

          <section className="profile-stats">
            <div className="card"><b>{totalPoints}</b><small>points</small></div>
            <div className="card"><b>{monthlyPoints}</b><small>points ce mois</small></div>
            <div className="card"><b>{myDiscussions.length}</b><small>discussions</small></div>
            <div className="card"><b>{myReplies}</b><small>réponses</small></div>
            <div className="card"><b>{interests.length}</b><small>espaces suivis</small></div>
          </section>
          <section className="card profile-level">
            <div className="section-heading">
              <div><h2>{level.name}</h2><p>{level.nextName ? `Encore ${level.pointsToNext} points pour devenir « ${level.nextName} »` : 'Niveau maximum atteint'}</p></div>
              <Link href="/classement" className="text-link">Classement →</Link>
            </div>
            <div className="level-progress" role="progressbar" aria-label="Progression vers le prochain niveau" aria-valuenow={level.progress} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${level.progress}%` }} />
            </div>
          </section>

          <form className="card interests-form" onSubmit={saveProfile}>
            <div className="section-heading">
              <div><h2>Mes centres d’intérêt</h2><p>Ces espaces préférés sont enregistrés sur votre compte. La personnalisation automatique du fil n’est pas encore active.</p></div>
              <span className="interest-count">{interests.length} sélectionné{interests.length === 1 ? '' : 's'}</span>
            </div>
            {loading ? <p className="muted">Chargement de vos espaces…</p> : (
              <div className="interest-grid profile-interest-grid">
                {categories.map(category => (
                  <label key={category.documentId} className={`interest-option ${interests.includes(category.slug) ? 'selected' : ''}`}>
                    <input type="checkbox" checked={interests.includes(category.slug)} onChange={() => toggleInterest(category.slug)} />
                    <span>{category.name}</span>
                    <span className="interest-check" aria-hidden="true">{interests.includes(category.slug) ? '✓' : ''}</span>
                  </label>
                ))}
              </div>
            )}
            {error && <p className="form-error" role="alert">{error}</p>}
            {message && <p className="form-success" role="status">{message}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading}>Enregistrer mes préférences</button>
          </form>

          <section className="card profile-activity">
            <div className="section-heading"><div><h2>Mes discussions</h2><p>Vos publications récentes dans la communauté.</p></div></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            {myDiscussions.length ? (
              <div className="profile-discussion-list">
                {myDiscussions.map(discussion => (
                  <Link key={discussion.documentId} href={`/discussions/${discussion.documentId}`} className="profile-discussion">
                    <span className="cat-tag">{discussion.category?.name ?? 'Sans catégorie'}</span>
                    <b>{discussion.title}</b>
                    <small>{discussion.replies.length} réponse{discussion.replies.length === 1 ? '' : 's'}</small>
                  </Link>
                ))}
              </div>
            ) : <p className="muted">Vous n’avez pas encore publié de discussion.</p>}
            <Link href="/discussions/new" className="text-link">Lancer une discussion →</Link>
          </section>
        </div>

        <aside className="right">
          <section className="card">
            <h2 className="card-title">Votre compte</h2>
            <p className="card-copy">Connecté avec l’adresse e-mail de votre compte Le Revenu.</p>
            <span className="account-email">{user.email}</span>
          </section>
          <section className="card join-card">
            <h2>Faites vivre la communauté</h2>
            <p>Une question sans réponse attend peut-être votre expérience.</p>
            <Link href="/?sort=unanswered" className="btn btn-secondary btn-block">Aider un membre</Link>
          </section>
        </aside>
      </div>
    </section>
    </CommunityShell>
  );
}
