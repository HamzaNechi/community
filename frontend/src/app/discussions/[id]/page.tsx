// frontend/src/app/discussions/[id]/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDiscussion } from '@/lib/api';
import ReplyForm from '@/components/ReplyForm';

async function DiscussionContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let discussion;
  try {
    discussion = await getDiscussion(id);
  } catch {
    notFound();
  }

  const author = discussion.author?.username ?? 'Anonyme';
  const category = discussion.category?.name ?? 'Sans catégorie';
  const date = new Date(discussion.createdAt).toLocaleString('fr-FR');

  return (
    <div className="detail-layout">
      <div className="main">
      <nav className="crumbs">
        <Link href="/">Accueil</Link><span>›</span><span>{category}</span>
      </nav>
      <article className="post">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 flex-wrap">
          <span className="cat-tag">{category}</span>
          <span>·</span>
          <span>{author}</span>
          <span>·</span>
          <span>{date}</span>
          {discussion.type === 'question' && (
            <span className="tag question">Question</span>
          )}
        </div>
        <h1>{discussion.title}</h1>
        <div className="post-content">{discussion.content}</div>
      </article>

      <section className="replies">
        <h2 className="section-title">
          {discussion.replies.length} réponse{discussion.replies.length > 1 ? 's' : ''}
        </h2>
        {discussion.replies.length === 0 && (
          <p className="muted">Aucune réponse pour l&apos;instant.</p>
        )}
        <div className="reply-list">
          {discussion.replies.map(r => (
            <article key={r.documentId} className="reply-card">
              <div className="reply-meta">
                <span className="font-semibold">{r.author?.username ?? 'Anonyme'}</span>
                <span> · </span>
                <span>{new Date(r.createdAt).toLocaleString('fr-FR')}</span>
              </div>
              <p className="post-content">{r.content}</p>
            </article>
          ))}
        </div>
      </section>

      <ReplyForm discussionDocumentId={discussion.documentId} />
      </div>
      <aside className="right">
        <section className="card">
          <h2 className="card-title">Cette discussion</h2>
          <div className="stats-grid">
            <div><strong>{discussion.replies.length}</strong><small>réponses</small></div>
            <div><strong>{discussion.type === 'question' ? 'Question' : 'Discussion'}</strong><small>type</small></div>
          </div>
          <Link href="/" className="text-link">← Retour au fil</Link>
        </section>
      </aside>
    </div>
  );
}

export default function DiscussionPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="wrap detail-wrap">
      <Suspense fallback={<p className="loading-state">Chargement de la discussion…</p>}>
        <DiscussionContent params={params} />
      </Suspense>
    </main>
  );
}