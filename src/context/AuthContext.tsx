'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { AuthUser } from '@/lib/auth/types';
import { useToast } from '@/components/ui/Toast';

const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const lastRefreshRef = useRef<number>(Date.now());
  const userRef = useRef<AuthUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const loadCurrentUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { user: AuthUser | null };
        lastRefreshRef.current = Date.now();
        userRef.current = data.user ?? null;
        queueMicrotask(() => {
          setUser(data.user ?? null);
          setIsLoading(false);
        });
        return data.user ?? null;
      }
      userRef.current = null;
      queueMicrotask(() => {
        setUser(null);
        setIsLoading(false);
      });
      return null;
    } catch {
      queueMicrotask(() => {
        setUser(null);
        setIsLoading(false);
      });
      return null;
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = (await res.json()) as {
          authenticated: boolean;
          refreshed: boolean;
          user?: AuthUser;
        };

        lastRefreshRef.current = Date.now();

        if (data.user) {
          userRef.current = data.user;
          queueMicrotask(() => {
            setUser(data.user ?? null);
          });
        }
        return true;
      }

      if (res.status === 401 && userRef.current) {
        userRef.current = null;
        queueMicrotask(() => {
          setUser(null);
        });
      }

      return false;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      userRef.current = null;
      queueMicrotask(() => {
        setUser(null);
      });
      toast.info('Sessão encerrada com sucesso.', 'Logout');
      router.push('/auth/login');
    }
  }, [router, toast]);

  useEffect(() => {
    loadCurrentUser();

    const intervalId = setInterval(() => {
      if (userRef.current) {
        refreshSession();
      }
    }, REFRESH_INTERVAL_MS);

    const handleActivity = () => {
      if (document.visibilityState === 'visible' && userRef.current) {
        const elapsed = Date.now() - lastRefreshRef.current;
        if (elapsed >= REFRESH_INTERVAL_MS) {
          refreshSession();
        }
      }
    };

    document.addEventListener('visibilitychange', handleActivity);
    window.addEventListener('focus', handleActivity);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleActivity);
      window.removeEventListener('focus', handleActivity);
    };
  }, [loadCurrentUser, refreshSession]);

  useEffect(() => {
    if (!pathname.startsWith('/auth/') && !userRef.current) {
      loadCurrentUser();
    }
  }, [pathname, loadCurrentUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    refreshSession,
    logout,
    setUser: (newUser: AuthUser | null) => {
      userRef.current = newUser;
      queueMicrotask(() => {
        setUser(newUser);
      });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
