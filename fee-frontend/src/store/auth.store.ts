import { create } from 'zustand';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher';
  permissions: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  updateUser: (userData: User, token: string) => void; // Naya function
  logout: () => void;
}

// Safe tareeqa localStorage se data nikalne ka
const getInitialUser = () => {
  try {
    const stored = localStorage.getItem('user');
    if (!stored || stored === 'undefined') return null;
    return JSON.parse(stored);
  } catch (error) {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  token: localStorage.getItem('token') || null,
  login: (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    set({ user: userData, token });
  },
  updateUser: (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    set({ user: userData, token });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));