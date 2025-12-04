import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import { AUTH_STORAGE_KEY } from '../api/client';

type Role = 'ADMIN' | 'SEKRETARIS' | 'COSM';

interface User {
  username: string;
  role: Role;
  token: string;
}

interface AuthContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: (next) => {
        setUser(next);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      },
      logout: () => {
        setUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
