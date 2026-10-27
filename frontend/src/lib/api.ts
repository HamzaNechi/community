const STRAPI_URL = typeof window === 'undefined'
  ? (process.env.STRAPI_INTERNAL_URL || 'http://localhost:1337')  // Docker injecte l'URL interne
  : (process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'); // côté navigateur

export interface StrapiUser {
  id: number;
  documentId: string;
  username: string;
  email: string;
  totalPoints?: number;
}

export interface Category {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description: string;
}

export interface Reply {
  id: number;
  documentId: string;
  content: string;
  author: StrapiUser | null;
  createdAt: string;
  likes?: number;
}

export interface Discussion {
  id: number;
  documentId: string;
  title: string;
  content: string;
  type: 'question' | 'discussion';
  author: StrapiUser | null;
  category: Category | null;
  replies: Reply[];
  createdAt: string;
  views?: number;
  likes?: number;
  bestAnswer?: Reply | null;
}

export interface LikeState {
  likes: number;
  liked: boolean;
}

export interface LeaderboardEntry {
  documentId: string;
  username: string;
  points: number;
  totalPoints?: number;
}

export interface CommunityPoints {
  totalPoints: number;
  monthlyPoints: number;
}

export interface CommunityPoll {
  documentId: string;
  title: string;
  options: { label: string }[];
  counts: number[];
  totalVotes: number;
  selectedOption: number | null;
}


function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

function setToken(jwt: string): void {
  if (typeof document === 'undefined') return;
  // Met à jour le cookie d'access token
  document.cookie = `jwt=${encodeURIComponent(jwt)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}


function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)jwt=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function restoreSession(): Promise<boolean> {
  const token = getToken();
  if (token && !isTokenExpired(token)) return true;
  return refreshAccessToken();
}

export function clearStoredSession(): void {
  if (typeof document !== 'undefined') document.cookie = 'jwt=; path=/; max-age=0; SameSite=Lax';
  if (typeof window !== 'undefined') {
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('strapi_user');
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(normalized)) as { exp?: number };
    return typeof claims.exp !== 'number' || claims.exp <= Date.now() / 1000 + 30;
  } catch {
    return true;
  }
}

async function strapiFetch<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = getToken(); // lit l'access token
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${STRAPI_URL}${path}`, { ...options, headers, cache: 'no-store', credentials: 'include' });

  // Si 401 et qu'on a un refresh token, tenter de rafraîchir
  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return strapiFetch(path, options, false); // réessayer avec le nouveau token
    }
    clearStoredSession();
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('community-session-expired'));
  }

  const json = await res.json();
  if (!res.ok) {
    const message = json?.error?.message;
    if (res.status === 401 || message === 'Missing or invalid credentials') {
      throw new Error('Votre session a expiré ou est invalide. Reconnectez-vous pour continuer.');
    }
    if (res.status === 403) {
      throw new Error('Strapi refuse cette opération. Vérifiez les permissions du rôle dans le dashboard.');
    }
    throw new Error(message || `Erreur HTTP ${res.status}`);
  }
  return json;
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  const currentToken = getToken(); // récupère l'access token actuel (peut être expiré)
  if (!refreshToken) return false;

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  
  if (currentToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${currentToken}`;
  }

  const res = await fetch(`${STRAPI_URL}/api/auth/refresh`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ refreshToken }),
    credentials: 'include',
  });
  if (!res.ok) return false;
  const data = await res.json();
  setToken(data.jwt);
  
  if (data.refreshToken && typeof window !== 'undefined') {
    localStorage.setItem('refreshToken', data.refreshToken);
  }
  return true;
}

export async function getDiscussions(params: { categorySlug?: string } = {}): Promise<Discussion[]> {
  const query = new URLSearchParams({
    'populate[author]': 'true',
    'populate[category]': 'true',
    'populate[replies][populate]': 'author',
    'sort[0]': 'createdAt:desc',
    'pagination[pageSize]': '100',
  });
  if (params.categorySlug) query.append('filters[category][slug][$eq]', params.categorySlug);
  const json = await strapiFetch<{ data: Discussion[] }>(`/api/discussions?${query}`);
  return json.data;
}

export async function getDiscussion(documentId: string): Promise<Discussion> {
  const query = new URLSearchParams({
    'populate[author]': 'true',
    'populate[category]': 'true',
    'populate[replies][populate]': 'author',
    'populate[replies][sort][0]': 'createdAt:asc',
    'populate[bestAnswer]': 'true',
    'filters[documentId][$eq]': documentId,
  });
  const json = await strapiFetch<{ data: Discussion[] }>(`/api/discussions?${query}`);
  if (!json.data.length) throw new Error('Discussion introuvable');
  return json.data[0];
}

export async function recordDiscussionView(documentId: string): Promise<number> {
  const json = await strapiFetch<{ views: number }>(`/api/community/discussions/${encodeURIComponent(documentId)}/views`, {
    method: 'POST',
  });
  return json.views;
}

export async function getLikeState(targetType: 'discussion' | 'reply', documentId: string): Promise<LikeState> {
  return strapiFetch<LikeState>(
    `/api/community/${targetType}/${encodeURIComponent(documentId)}/like-state`,
  );
}

export async function toggleLike(targetType: 'discussion' | 'reply', documentId: string): Promise<LikeState> {
  const result = await strapiFetch<LikeState>(
    `/api/community/${targetType}/${encodeURIComponent(documentId)}/like`,
    { method: 'POST' },
  );
  window.dispatchEvent(new CustomEvent('community-points-refresh'));
  return result;
}

export async function chooseBestAnswer(discussionDocumentId: string, replyDocumentId: string): Promise<void> {
  await strapiFetch(`/api/community/discussions/${encodeURIComponent(discussionDocumentId)}/best-answer/${encodeURIComponent(replyDocumentId)}`, {
    method: 'POST',
  });
  window.dispatchEvent(new CustomEvent('community-points-refresh'));
}

export async function getLeaderboard(period: 'all' | 'month'): Promise<LeaderboardEntry[]> {
  const query = new URLSearchParams({ period });
  const json = await strapiFetch<{ data: LeaderboardEntry[] }>(`/api/community/leaderboard?${query}`);
  return json.data;
}

export async function getMyCommunityPoints(): Promise<CommunityPoints> {
  return strapiFetch<CommunityPoints>('/api/community/me/points');
}

export async function recordDailyVisit(): Promise<{ awarded: boolean; totalPoints: number }> {
  return strapiFetch('/api/community/daily-visit', { method: 'POST' });
}

export async function getActivePoll(isAuthenticated = false): Promise<CommunityPoll | null> {
  const json = await strapiFetch<{ data: CommunityPoll | null }>('/api/community/polls/active');
  if (!json.data || !isAuthenticated) return json.data;
  const vote = await strapiFetch<{ selectedOption: number | null }>(
    `/api/community/polls/${encodeURIComponent(json.data.documentId)}/my-vote`,
  );
  return { ...json.data, selectedOption: vote.selectedOption };
}

export async function voteInPoll(documentId: string, optionIndex: number): Promise<{ selectedOption: number; awarded: boolean; totalPoints: number }> {
  return strapiFetch(`/api/community/polls/${encodeURIComponent(documentId)}/vote`, {
    method: 'POST',
    body: JSON.stringify({ optionIndex }),
  });
}

export async function getMyInterests(): Promise<string[]> {
  const json = await strapiFetch<{ interests: string[] }>('/api/community/me/interests');
  return json.interests;
}

export async function updateMyInterests(interests: string[]): Promise<string[]> {
  const json = await strapiFetch<{ interests: string[] }>('/api/community/me/interests', {
    method: 'PUT',
    body: JSON.stringify({ interests }),
  });
  return json.interests;
}

export async function createDiscussion(data: {
  title: string;
  content: string;
  type: 'question' | 'discussion';
  categoryDocumentId: string;
}): Promise<Discussion> {
  const json = await strapiFetch<{ data: Discussion }>('/api/discussions', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        category: data.categoryDocumentId,
      },
    }),
  });
  window.dispatchEvent(new CustomEvent('community-points-refresh'));
  return json.data;
}

export async function createReply(discussionDocumentId: string, content: string): Promise<Reply> {
  const json = await strapiFetch<{ data: Reply }>('/api/replies', {
    method: 'POST',
    body: JSON.stringify({ data: { content, discussion: discussionDocumentId } }),
  });
  window.dispatchEvent(new CustomEvent('community-points-refresh'));
  return json.data;
}

export async function getCategories(): Promise<Category[]> {
  const query = new URLSearchParams({ 'sort[0]': 'name:asc', 'pagination[pageSize]': '50' });
  const json = await strapiFetch<{ data: Category[] }>(`/api/categories?${query}`);
  return json.data;
}

export async function login(identifier: string, password: string) {
  const json = await strapiFetch<{ jwt: string; user: StrapiUser; refreshToken?: string }>('/api/auth/local', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });

  if (json.refreshToken && typeof window !== 'undefined') {
    localStorage.setItem('refreshToken', json.refreshToken);
  }
  
  return json;
}