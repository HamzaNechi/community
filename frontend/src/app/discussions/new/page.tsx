'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createDiscussion, getCategories, Category } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function NewDiscussionPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'question' | 'discussion'>('question');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getCategories().then(setCategories).catch(() => {}); }, []);
  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [isLoading, user, router]);

  if (isLoading || !user) return <p className="text-center py-16">Chargement…</p>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 10) return setError('Le titre doit contenir au moins 10 caractères.');
    if (!content.trim()) return setError('Le contenu est obligatoire.');
    if (!categoryId) return setError('Choisissez une catégorie.');
    setLoading(true);
    try {
      const created = await createDiscussion({
        title: title.trim(), content: content.trim(), type, categoryDocumentId: categoryId,
      });
      router.push(`/discussions/${created.documentId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="wrap form-wrap">
      <header className="page-head">
        <h1>Nouvelle discussion</h1>
        <p>Partagez votre question ou votre expérience avec les lecteurs du Revenu.</p>
      </header>
      <form onSubmit={handleSubmit} className="compose-form">
        <div className="field">
          <label>Type de publication</label>
          <div className="type-options">
            <label className="flex items-center gap-2">
              <input type="radio" value="question" checked={type === 'question'} onChange={() => setType('question')} /> Question
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" value="discussion" checked={type === 'discussion'} onChange={() => setType('discussion')} /> Discussion
            </label>
          </div>
        </div>
        <div className="field">
          <label>Titre</label>
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={150} placeholder="Ex. : Faut-il ouvrir un PER à 45 ans ?" />
          <p className="field-hint">{title.length}/150 · minimum 10 caractères</p>
        </div>
        <div className="field">
          <label>Espace</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">Choisissez…</option>
            {categories.map(c => <option key={c.documentId} value={c.documentId}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Détails</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Votre situation, ce que vous avez déjà envisagé…" />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Publication…' : 'Publier'}
        </button>
      </form>
    </main>
  );
}