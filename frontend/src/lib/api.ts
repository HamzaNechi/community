const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export interface StrapiUser {
  id: number;
  documentId: string;
  username: string;
  email: string;
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

async function strapiFetch<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = getToken(); // lit l'access token
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${STRAPI_URL}${path}`, { ...options, headers, cache: 'no-store' });

  // Si 401 et qu'on a un refresh token, tenter de rafraîchir
  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return strapiFetch(path, options, false); // réessayer avec le nouveau token
    }
  }

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || `Erreur HTTP ${res.status}`);
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
    'pagination[pageSize]': '50',
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
    'filters[documentId][$eq]': documentId,
  });
  const json = await strapiFetch<{ data: Discussion[] }>(`/api/discussions?${query}`);
  if (!json.data.length) throw new Error('Discussion introuvable');
  return json.data[0];
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
  return json.data;
}

export async function createReply(discussionDocumentId: string, content: string): Promise<Reply> {
  const json = await strapiFetch<{ data: Reply }>('/api/replies', {
    method: 'POST',
    body: JSON.stringify({ data: { content, discussion: discussionDocumentId } }),
  });
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