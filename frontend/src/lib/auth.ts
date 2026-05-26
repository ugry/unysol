import api from './api';
import type { LoginResponse, SignupPayload, User } from '@/types';

export async function login(email: string, password: string): Promise<User> {
  const res = await api.post<LoginResponse>('/api/auth/login', { email, password });

  const token = res.data.access_token;
  const user: User = {
    id: res.data.user_id,
    email: res.data.email,
    tenant_id: res.data.tenant_id,
    role: res.data.role,
  };

  localStorage.setItem('unysol_token', token);
  localStorage.setItem('unysol_user', JSON.stringify(user));

  return user;
}

export async function signup(data: SignupPayload): Promise<{ requires_verification: boolean; email: string; user_id: number; tenant_id: number }> {
  const res = await api.post('/api/auth/signup', {
    tenant_name: data.firma_unvani,
    email: data.email,
    password: data.password,
    telefon: data.telefon,
  });

  if (res.data.requires_verification) {
    return {
      requires_verification: true,
      email: res.data.email,
      user_id: res.data.user_id,
      tenant_id: res.data.tenant_id,
    };
  }

  // Legacy flow (shouldn't happen anymore)
  const token = res.data.access_token;
  const user: User = {
    id: res.data.user_id,
    email: res.data.email,
    tenant_id: res.data.tenant_id,
    role: res.data.role,
  };
  localStorage.setItem('unysol_token', token);
  localStorage.setItem('unysol_user', JSON.stringify(user));
  return { requires_verification: false, email: res.data.email, user_id: user.id, tenant_id: user.tenant_id };
}

export function logout(): void {
  localStorage.removeItem('unysol_token');
  localStorage.removeItem('unysol_user');
  window.location.href = '/';
}

export function getToken(): string | null {
  return localStorage.getItem('unysol_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('unysol_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
