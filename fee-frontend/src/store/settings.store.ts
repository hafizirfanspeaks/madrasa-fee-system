import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

interface SettingsState {
  settings: any;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {
    madarsaName: 'مدرسہ فیض القرآن',
    address: '1-K-3, Al Hasan Chowk, Nazimabad, No. 1',
    phone: '0300-1234567',
    email: 'IrfanzSolutions@gmail.com',
    footerText: 'Prepared by Irfanz Solutions'
  },
  fetchSettings: async () => {
    try {
      const res = await apiClient.get('/settings');
      set({ settings: res.data.data });
    } catch (error) {
      console.error('Settings not loaded');
    }
  }
}));