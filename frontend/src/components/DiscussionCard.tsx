import Link from 'next/link';
import { Discussion } from '@/lib/api';

export default function DiscussionCard({ discussion }: { discussion: Discussion }) {
  const author = discussion.author?.username ?? 'Anonyme';
  const category = discussion.category?.name ?? 'Sans catégorie';
  const date = new Date(discussion.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });
  const replies = discussion.replies ?? [];

  return (
    <Link href={`/discussions/${discussion.documentId}`} className="tcard">
      <div className={`tcount ${replies.length === 0 ? 'empty' : ''}`}>
        <strong className="num">{replies.length}</strong>
        <small>réponse{replies.length > 1 ? 's' : ''}</small>
      </div>
      <div>
        <div className="tmeta">
          <span className="cat-tag">{category}</span>
          <span className={`tag ${discussion.type === 'question' ? 'question' : ''}`}>
            {discussion.type === 'question' ? 'Question' : 'Discussion'}
          </span>
        </div>
        <h2 className="ttitle">{discussion.title}</h2>
        <p className="texcerpt">{discussion.content}</p>
        <div className="tfoot">
          <span className="byline">
            <span className="nav-icon" aria-hidden="true">{author.slice(0, 1).toUpperCase()}</span>
            <b>{author}</b>
            <span>· {date}</span>
          </span>
          <span className="tstats" aria-label={`${replies.length} réponse${replies.length > 1 ? 's' : ''}`}>
            <span aria-hidden="true">◌</span>
            <span>{replies.length}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
