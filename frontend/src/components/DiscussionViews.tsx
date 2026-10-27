'use client';

import { useEffect, useRef, useState } from 'react';
import { recordDiscussionView } from '@/lib/api';

export default function DiscussionViews({ documentId, initialViews = 0 }: { documentId: string; initialViews?: number }) {
  const [views, setViews] = useState(initialViews);
  const [error, setError] = useState<string | null>(null);
  const countedDocumentId = useRef<string | null>(null);

  useEffect(() => {
    if (countedDocumentId.current === documentId) return;
    countedDocumentId.current = documentId;
    let active = true;
    recordDiscussionView(documentId)
      .then(count => { if (active) setViews(count); })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : 'Impossible de compter cette vue.');
      });
    return () => { active = false; };
  }, [documentId]);

  return (
    <span className="discussion-views">
      {views.toLocaleString('fr-FR')} vues
      {error && <span className="form-error" role="alert">{error}</span>}
    </span>
  );
}
