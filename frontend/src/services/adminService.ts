import api from '../utils/api';
import type { AdminStats } from '../types/index';

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get<AdminStats>('/admin/stats');
    return response.data;
  },
};
