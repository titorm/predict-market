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
import { useRouter } from 'next/navigation';
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
  const toast = useToast();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const lastRefreshRef = useRef<number>(Date.now());
  const userRef = useRef<AuthUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

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
          queueMicrotask(() => {
            setUser(data.user ?? null);
          });
        }
        return true;
      }

      if (res.status === 401 && userRef.current) {
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
      queueMicrotask(() => {
        setUser(null);
      });
      toast.info('Sessão encerrada com sucesso.', 'Logout');
      router.push('/auth/login');
    }
  }, [router, toast]);

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = (await res.json()) as { user: AuthUser | null };
          if (isMounted) {
            lastRefreshRef.current = Date.now();
            queueMicrotask(() => {
              setUser(data.user);
              setIsLoading(false);
            });
          }
        } else {
          if (isMounted) {
            queueMicrotask(() => {
              setUser(null);
              setIsLoading(false);
            });
          }
        }
      } catch {
        if (isMounted) {
          queueMicrotask(() => {
            setUser(null);
            setIsLoading(false);
          });
        }
      }
    }

    initialLoad();

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
      isMounted = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleActivity);
      window.removeEventListener('focus', handleActivity);
    };
  }, [refreshSession]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    refreshSession,
    logout,
    setUser: (newUser: AuthUser | null) => {
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
