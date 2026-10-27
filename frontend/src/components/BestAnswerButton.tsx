'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { chooseBestAnswer } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function BestAnswerButton({
  discussionDocumentId,
  replyDocumentId,
  discussionAuthorId,
  selected,
}: {
  discussionDocumentId: string;
  replyDocumentId: string;
  discussionAuthorId?: number;
  selected: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!user || user.id !== discussionAuthorId) return null;

  async function markAsBestAnswer() {
    setBusy(true);
    setError(null);
    try {
      await chooseBestAnswer(discussionDocumentId, replyDocumentId);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de choisir cette réponse.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className={`act ${selected ? 'on-ok' : ''}`} onClick={() => void markAsBestAnswer()} disabled={busy || selected}>
        {selected ? '✓ Meilleure réponse' : '✓ Choisir comme meilleure réponse'}
      </button>
      {error && <span className="form-error" role="alert">{error}</span>}
    </>
  );
}
