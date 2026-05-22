import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, SignupPayload } from '@/types';
import * as authLib from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (data: SignupPayload) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = authLib.getStoredUser();
    if (stored && authLib.isAuthenticated()) {
      setUser(stored);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const u = await authLib.login(email, password);
    setUser(u);
    return u;
  };

  const signupFn = async (data: SignupPayload) => {
    const u = await authLib.signup(data);
    setUser(u);
    return u;
  };

  const logout = () => {
    setUser(null);
    authLib.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup: signupFn,
        logout,
        isAuthenticated: !!user && authLib.isAuthenticated(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
