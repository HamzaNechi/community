'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createReply } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function ReplyForm({ discussionDocumentId }: { discussionDocumentId: string }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!user) {
    return (
      <div className="card reply-login">
        <p className="muted">Connectez-vous pour répondre.</p>
        <Link href="/login" className="btn btn-primary">
          Se connecter
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (content.trim().length < 2) {
      setError('Votre réponse est trop courte.');
      return;
    }
    setLoading(true);
    try {
      await createReply(discussionDocumentId, content.trim());
      setContent('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card reply-compose">
      <h3>Répondre en tant que {user.username}</h3>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        className="reply-textarea"
        placeholder="Partagez votre expérience…"
      />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? 'Envoi…' : 'Publier ma réponse'}
      </button>
    </form>
  );
}