'use client';

import { useEffect, useRef } from 'react';
import { recordDailyVisit } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function DailyCommunityVisit() {
  const { user } = useAuth();
  const processedUser = useRef<number | null>(null);

  useEffect(() => {
    if (!user || processedUser.current === user.id) return;
    processedUser.current = user.id;
    void recordDailyVisit()
      .then(result => {
        window.dispatchEvent(new CustomEvent('community-points-updated', { detail: result.totalPoints }));
      })
      .catch(error => console.error('Impossible d’enregistrer la visite quotidienne.', error));
  }, [user]);

  return null;
}
