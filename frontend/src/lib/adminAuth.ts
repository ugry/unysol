import api from './api';
import type { AdminLoginResponse, AdminUser } from '@/types';

export async function adminLogin(email: string, password: string): Promise<AdminUser> {
  const res = await api.post<AdminLoginResponse>('/api/auth/login', { email, password });

  if (res.data.role !== 'SUPER_ADMIN') {
    throw new Error('Bu hesap yönetici yetkisine sahip değil');
  }

  const user: AdminUser = {
    id: String(res.data.user_id),
    email: res.data.email,
    ad: 'Yönetici',
    rol: 'SUPER_ADMIN',
  };

  localStorage.setItem('unysol_admin_token', res.data.access_token);
  localStorage.setItem('unysol_admin_user', JSON.stringify(user));
  return user;
}

export function adminLogout(): void {
  localStorage.removeItem('unysol_admin_token');
  localStorage.removeItem('unysol_admin_user');
  window.location.href = '/admin/login';
}

export function isAdminAuthenticated(): boolean {
  return !!localStorage.getItem('unysol_admin_token');
}

export function getStoredAdminUser(): AdminUser | null {
  const raw = localStorage.getItem('unysol_admin_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}
