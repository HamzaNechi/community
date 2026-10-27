import Link from 'next/link';
import { Discussion } from '@/lib/api';
import CommunityIcon from '@/components/CommunityIcon';

function relativeTime(value: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'hier' : `il y a ${days} j`;
}

export default function DiscussionCard({ discussion }: { discussion: Discussion }) {
  const author = discussion.author?.username ?? 'Anonyme';
  const category = discussion.category?.name ?? 'Sans catégorie';
  const age = relativeTime(discussion.createdAt);
  const replies = discussion.replies ?? [];
  const solved = Boolean(discussion.bestAnswer);

  return (
    <Link href={`/discussions/${discussion.documentId}`} className="tcard">
      <div className={`tcount ${solved ? 'solved' : replies.length === 0 ? 'zero' : ''}`}>
        <strong className="num">{solved && <CommunityIcon name="check" />}{replies.length}</strong>
        <small>réponse{replies.length > 1 ? 's' : ''}</small>
      </div>
      <div>
        <div className="tmeta">
          <span className="cat-tag">{category}</span>
          <span className={`tag ${discussion.type === 'question' ? 'tag-q' : ''}`}>
            {discussion.type === 'question' ? 'Question' : 'Discussion'}
          </span>
          {age === 'à l’instant' && <span className="tag tag-new">Nouveau</span>}
        </div>
        <h2 className="ttitle">{discussion.title}</h2>
        <p className="texcerpt">{discussion.content}</p>
        <div className="tfoot">
          <span className="byline">
            <span className="av av-xs" style={{ '--c': 'var(--av-1)' } as React.CSSProperties}>{author.slice(0, 1).toUpperCase()}</span>
            <b>{author}</b>
            <span>· {age}</span>
          </span>
          <span className="tstats" aria-label={`${replies.length} réponses, ${discussion.likes ?? 0} mentions utiles, ${discussion.views ?? 0} vues`}>
            <span><CommunityIcon name="thumb" /><span className="num">{discussion.likes ?? 0}</span></span>
            <span className="views"><CommunityIcon name="eye" /><span className="num">{(discussion.views ?? 0).toLocaleString('fr-FR')}</span></span>
          </span>
        </div>
      </div>
    </Link>
  );
}
