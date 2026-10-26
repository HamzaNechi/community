'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('demo@example.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(identifier, password);
      router.push('/');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="wrap login-wrap">
      <section className="card login-card">
        <h1>Se connecter</h1>
        <p className="muted">Retrouvez les lecteurs et participez aux échanges.</p>
        <form onSubmit={handleSubmit} className="compose-form login-form">
          <div className="field">
            <label htmlFor="login-email">Adresse e-mail</label>
            <input id="login-email" value={identifier} onChange={e => setIdentifier(e.target.value)} type="email" placeholder="Email" />
          </div>
          <div className="field">
            <label htmlFor="login-password">Mot de passe</label>
            <input id="login-password" value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Mot de passe" />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <p className="field-hint login-hint">Démo : demo@example.com / 123456</p>
      </section>
    </main>
  );
}