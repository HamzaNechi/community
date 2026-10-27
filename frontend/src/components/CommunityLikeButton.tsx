'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getLikeState, LikeState, toggleLike } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function CommunityLikeButton({
  targetType,
  documentId,
  initialLikes = 0,
}: {
  targetType: 'discussion' | 'reply';
  documentId: string;
  initialLikes?: number;
}) {
  const { user, isLoading } = useAuth();
  const [state, setState] = useState<LikeState>({ likes: initialLikes, liked: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    getLikeState(targetType, documentId)
      .then(result => { if (active) setState(result); })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : 'Impossible de charger votre réaction.');
      });
    return () => { active = false; };
  }, [documentId, targetType, user]);

  async function handleToggle() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      setState(await toggleLike(targetType, documentId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible d’enregistrer votre réaction.');
    } finally {
      setBusy(false);
    }
  }

  if (!user && !isLoading) {
    return (
      <Link href="/login" className="act useful" aria-label={`${state.likes} mentions utiles. Connectez-vous pour réagir.`}>
        ♡ Utile <span className="num">{state.likes}</span>
      </Link>
    );
  }

  return (
    <>
      <button type="button" className={`act useful ${state.liked ? 'on' : ''}`} onClick={() => void handleToggle()} disabled={busy || isLoading} aria-pressed={state.liked}>
        {state.liked ? '♥' : '♡'} Utile <span className="num">{state.likes}</span>
      </button>
      {error && <span className="form-error" role="alert">{error}</span>}
    </>
  );
}
