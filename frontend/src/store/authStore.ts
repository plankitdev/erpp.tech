import { create } from 'zustand';
import type { User, Company } from '../types';
import { authApi, superAdminApi } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  forcePasswordChange: boolean;

  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  switchCompany: (companyId: number) => Promise<void>;
  fetchUser: () => Promise<void>;
  hydrate: () => void;
  hasPermission: (permission: string) => boolean;
  clearForcePasswordChange: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: true,
  forcePasswordChange: false,

  hydrate: () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        set({ token, user: JSON.parse(savedUser), loading: false });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ loading: false });
      }
    } else {
      set({ loading: false });
    }
  },

  login: async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    const { token, user, force_password_change } = data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, forcePasswordChange: !!force_password_change });
    return user;
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  switchCompany: async (companyId: number) => {
    const { data } = await superAdminApi.switchCompany(companyId);
    const resp = data.data as { token: string; company: import('../types').Company };
    const currentUser = get().user;
    const updatedUser = currentUser ? { ...currentUser, company: resp.company } : null;
    localStorage.setItem('token', resp.token);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ token: resp.token, user: updatedUser });
  },

  fetchUser: async () => {
    try {
      const { data } = await authApi.me();
      const user = data.data;
      // Preserve company for super_admin (set via switchCompany, not in DB)
      const currentUser = get().user;
      if (currentUser?.role === 'super_admin' && currentUser?.company && !user.company) {
        user.company = currentUser.company;
      }
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null });
    }
  },

  hasPermission: (permission: string) => {
    const { user } = get();
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    const perms = user.permissions || [];
    return perms.some(p => {
      if (p === permission) return true;
      // Only allow hierarchical matching with exact module prefix
      // e.g. permission 'clients' matches 'clients.view', 'clients.create'
      // but 'client' does NOT match 'clients.view'
      if (permission.includes('.') && p === permission.split('.')[0]) return true;
      if (p.includes('.') && permission === p.split('.')[0]) return true;
      return false;
    });
  },

  clearForcePasswordChange: () => {
    set({ forcePasswordChange: false });
  },
}));
