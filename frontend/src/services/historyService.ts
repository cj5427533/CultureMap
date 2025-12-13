import api from '../utils/api';
import type { History } from '../types/index';

export const historyService = {
  getMyHistories: async (): Promise<History[]> => {
    const response = await api.get<History[]>('/histories');
    return response.data;
  },
  
  initializeHistory: async (): Promise<void> => {
    await api.post('/histories/initialize');
  },
};
