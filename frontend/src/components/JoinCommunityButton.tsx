'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category, getCategories } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Props = { label: string; className?: string };

export default function JoinCommunityButton({ label, className = 'btn btn-primary' }: Props) {
  const { user, login } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'login' | 'interests'>('login');
  const [categories, setCategories] = useState<Category[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function openDialog() {
    setError(null);
    setOpen(true);
    if (user) {
      setStep('interests');
      await loadInterests();
    } else {
      setStep('login');
    }
  }

  async function loadInterests() {
    try {
      const result = await getCategories();
      setCategories(result);
      if (user) {
        const stored = localStorage.getItem(`community-interests:${user.documentId}`);
        setInterests(stored ? JSON.parse(stored) as string[] : []);
      }
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de charger les espaces.');
      return false;
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await getCategories();
      const loggedInUser = await login(identifier, password);
      setCategories(result);
      const stored = localStorage.getItem(`community-interests:${loggedInUser.documentId}`);
      setInterests(stored ? JSON.parse(stored) as string[] : []);
      setStep('interests');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La connexion a échoué.');
    } finally {
      setLoading(false);
    }
  }

  function handleInterests(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setError('Connectez-vous pour enregistrer vos centres d’intérêt.');
      return;
    }
    if (!interests.length) {
      setError('Choisissez au moins un espace pour personnaliser votre fil.');
      return;
    }
    try {
      localStorage.setItem(`community-interests:${user.documentId}`, JSON.stringify(interests));
      setOpen(false);
      router.refresh();
    } catch {
      setError('Vos préférences n’ont pas pu être enregistrées sur cet appareil.');
    }
  }

  function toggleInterest(slug: string) {
    setInterests(current => current.includes(slug)
      ? current.filter(value => value !== slug)
      : [...current, slug]);
  }

  return (
    <>
      <button type="button" className={className} onClick={() => void openDialog()}>{label}</button>
      {open && (
        <div className="modal-overlay" onMouseDown={event => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <section className="join-modal" role="dialog" aria-modal="true" aria-labelledby="join-title">
            <header className="modal-header">
              <div>
                <span className="step-label">ÉTAPE {step === 'login' ? '1' : '2'} SUR 2</span>
                <h2 id="join-title">{step === 'login' ? 'Rejoindre la communauté' : 'Qu’est-ce qui vous intéresse ?'}</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Fermer">×</button>
            </header>
            {step === 'login' ? (
              <form onSubmit={handleLogin} className="modal-body">
                <div className="step-indicator"><span className="active" /><span /></div>
                <p className="muted">Utilisez le compte lerevenu.com que vous utilisez déjà sur le site ou pour le magazine.</p>
                <div className="account-sso"><span className="lr-logo">R</span><span><b>Votre compte Le Revenu</b><small>Un seul identifiant pour participer.</small></span></div>
                <div className="field">
                  <label htmlFor="join-email">Adresse e-mail</label>
                  <input id="join-email" type="email" autoComplete="email" required value={identifier} onChange={event => setIdentifier(event.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="join-password">Mot de passe</label>
                  <input id="join-password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
                </div>
                {error && <p className="form-error" role="alert">{error}</p>}
                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Connexion…' : 'Continuer'}
                </button>
                <p className="modal-footnote">Pas encore de compte ? <a href="https://www.lerevenu.com" target="_blank" rel="noreferrer">Créer un compte sur lerevenu.com</a></p>
              </form>
            ) : (
              <form onSubmit={handleInterests} className="modal-body">
                <div className="step-indicator"><span className="active" /><span className="active" /></div>
                <p className="muted">Choisissez au moins un espace. Votre fil « Pour vous » sera personnalisé à partir de vos choix.</p>
                <div className="interest-grid">
                  {categories.map(category => (
                    <label key={category.documentId} className={`interest-option ${interests.includes(category.slug) ? 'selected' : ''}`}>
                      <input type="checkbox" checked={interests.includes(category.slug)} onChange={() => toggleInterest(category.slug)} />
                      <span>{category.name}</span>
                      <span className="interest-check" aria-hidden="true">{interests.includes(category.slug) ? '✓' : ''}</span>
                    </label>
                  ))}
                  {!categories.length && !error && <p className="muted">Chargement des espaces…</p>}
                </div>
                {error && <p className="form-error" role="alert">{error}</p>}
                <button type="submit" className="btn btn-primary btn-block">C’est parti</button>
                {!user && <p className="modal-footnote">Connectez-vous pour enregistrer vos préférences.</p>}
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
