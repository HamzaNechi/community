'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { clearStoredSession, login as apiLogin, restoreSession, StrapiUser } from './api';

interface AuthContextType {
  user: StrapiUser | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<StrapiUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function isStoredUser(value: unknown): value is StrapiUser {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'number'
    && typeof candidate.documentId === 'string'
    && typeof candidate.username === 'string'
    && typeof candidate.email === 'string';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StrapiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const expireSession = () => setUser(null);
    window.addEventListener('community-session-expired', expireSession);
    Promise.resolve().then(async () => {
      if (cancelled) return;
      try {
        const stored = localStorage.getItem('strapi_user');
        if (stored) {
          let parsed: unknown;
          try {
            parsed = JSON.parse(stored);
          } catch (cause) {
            console.error('Le profil enregistré est illisible et a été supprimé.', cause);
            localStorage.removeItem('strapi_user');
            parsed = null;
          }
          if (isStoredUser(parsed)) {
            if (await restoreSession()) {
              if (!cancelled) setUser(parsed);
            } else {
              clearStoredSession();
            }
          }
          else if (parsed !== null) {
            console.error('Le profil enregistré ne respecte pas le format attendu.');
            localStorage.removeItem('strapi_user');
          }
        }
      } catch (cause) {
        console.error('Impossible de restaurer le profil enregistré.', cause);
        clearStoredSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
      window.removeEventListener('community-session-expired', expireSession);
    };
  }, []);

  async function login(identifier: string, password: string) {
    const { jwt, user } = await apiLogin(identifier, password);
    Cookies.set('jwt', jwt, { expires: 7 });
    localStorage.setItem('strapi_user', JSON.stringify(user));
    setUser(user);
    return user;
  }

  function logout() {
    Cookies.remove('jwt', { path: '/' });
    clearStoredSession();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}