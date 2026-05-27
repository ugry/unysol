import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, SignupPayload } from '@/types';
import * as authLib from '@/lib/auth';

type SignupResult = User | { requires_verification: boolean; email: string; user_id: number; tenant_id: number };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (data: SignupPayload) => Promise<SignupResult>;
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

  // Auto-recover user if token exists but user is null (e.g., Google login)
  useEffect(() => {
    if (!user && authLib.isAuthenticated()) {
      const stored = authLib.getStoredUser();
      if (stored) setUser(stored);
    }
  }, [user, loading]);

  const login = async (email: string, password: string) => {
    const u = await authLib.login(email, password);
    setUser(u);
    return u;
  };

  const signupFn = async (data: SignupPayload) => {
    const result = await authLib.signup(data);
    if ('requires_verification' in result && result.requires_verification) {
      return result;
    }
    if ('id' in result && 'role' in result) {
      setUser(result as unknown as User);
    }
    return result;
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
        isAuthenticated: authLib.isAuthenticated() || !!user,
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
