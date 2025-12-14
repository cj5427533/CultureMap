import api from '../utils/api';
import type { History } from '../types/index';

export const historyService = {
  getMyHistories: async (): Promise<History[]> => {
    try {
      const response = await api.get<History[]>('/histories');
      return response.data || [];
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('히스토리 목록 조회 실패:', error);
      throw new Error(err.response?.data?.message || err.message || '히스토리 목록을 불러오는데 실패했습니다.');
    }
  },
  
  initializeHistory: async (): Promise<void> => {
    try {
      await api.post('/histories/initialize');
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('히스토리 초기화 실패:', error);
      throw new Error(err.response?.data?.message || err.message || '히스토리 초기화에 실패했습니다.');
    }
  },
};
