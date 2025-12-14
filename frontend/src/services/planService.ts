import api from '../utils/api';
import type { Plan, PlanRequest } from '../types/index';

export interface AddPlaceToPlanRequest {
  planDate: string;
  placeId: number;
  visitTime?: string;
  title?: string;
}

export const planService = {
  getMyPlans: async (date?: string): Promise<Plan[]> => {
    try {
      const params = date ? { date } : {};
      const response = await api.get<Plan[]>('/plans', { params });
      return response.data || [];
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('플랜 목록 조회 실패:', error);
      throw new Error(err.response?.data?.message || err.message || '플랜 목록을 불러오는데 실패했습니다.');
    }
  },

  getPlan: async (id: number): Promise<Plan> => {
    try {
      if (!id || id <= 0) {
        throw new Error('유효하지 않은 플랜 ID입니다.');
      }
      const response = await api.get<Plan>(`/plans/${id}`);
      if (!response.data) {
        throw new Error('플랜 데이터가 없습니다.');
      }
      return response.data;
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      console.error('플랜 조회 실패:', error);
      if (err.response?.status === 404) {
        throw new Error('플랜을 찾을 수 없습니다.');
      }
      throw new Error(err.response?.data?.message || err.message || '플랜을 불러오는데 실패했습니다.');
    }
  },

  createPlan: async (data: PlanRequest): Promise<Plan> => {
    try {
      // 입력 검증
      if (!data.planDate) {
        throw new Error('날짜를 선택해주세요.');
      }
      if (!data.title || !data.title.trim()) {
        throw new Error('플랜 제목을 입력해주세요.');
      }

      const response = await api.post<Plan>('/plans', data);
      if (!response.data) {
        throw new Error('플랜 생성 응답이 없습니다.');
      }
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('플랜 생성 실패:', error);
      throw new Error(err.response?.data?.message || err.message || '플랜 생성에 실패했습니다.');
    }
  },

  updatePlan: async (id: number, data: PlanRequest): Promise<Plan> => {
    try {
      if (!id || id <= 0) {
        throw new Error('유효하지 않은 플랜 ID입니다.');
      }
      if (!data.planDate) {
        throw new Error('날짜를 선택해주세요.');
      }

      const response = await api.put<Plan>(`/plans/${id}`, data);
      if (!response.data) {
        throw new Error('플랜 수정 응답이 없습니다.');
      }
      return response.data;
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      console.error('플랜 수정 실패:', error);
      if (err.response?.status === 404) {
        throw new Error('플랜을 찾을 수 없습니다.');
      }
      if (err.response?.status === 403) {
        throw new Error('플랜을 수정할 권한이 없습니다.');
      }
      throw new Error(err.response?.data?.message || err.message || '플랜 수정에 실패했습니다.');
    }
  },

  deletePlan: async (id: number): Promise<void> => {
    try {
      if (!id || id <= 0) {
        throw new Error('유효하지 않은 플랜 ID입니다.');
      }
      await api.delete(`/plans/${id}`);
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      console.error('플랜 삭제 실패:', error);
      if (err.response?.status === 404) {
        throw new Error('플랜을 찾을 수 없습니다.');
      }
      if (err.response?.status === 403) {
        throw new Error('플랜을 삭제할 권한이 없습니다.');
      }
      throw new Error(err.response?.data?.message || err.message || '플랜 삭제에 실패했습니다.');
    }
  },

  addPlaceToPlan: async (data: AddPlaceToPlanRequest): Promise<Plan> => {
    try {
      if (!data.planDate) {
        throw new Error('날짜를 입력해주세요.');
      }
      if (!data.placeId || data.placeId <= 0) {
        throw new Error('유효하지 않은 장소 ID입니다.');
      }

      const response = await api.post<Plan>('/plans/add-place', data);
      if (!response.data) {
        throw new Error('장소 추가 응답이 없습니다.');
      }
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('장소 추가 실패:', error);
      throw new Error(err.response?.data?.message || err.message || '장소 추가에 실패했습니다.');
    }
  },

  inviteMember: async (data: { planId: number; email: string; role: string }): Promise<void> => {
    try {
      if (!data.planId || data.planId <= 0) {
        throw new Error('유효하지 않은 플랜 ID입니다.');
      }
      if (!data.email || !data.email.trim()) {
        throw new Error('이메일을 입력해주세요.');
      }
      if (!data.email.includes('@')) {
        throw new Error('유효한 이메일 형식이 아닙니다.');
      }
      if (!['VIEWER', 'EDITOR'].includes(data.role)) {
        throw new Error('유효하지 않은 권한입니다.');
      }

      await api.post('/plans/invite', data);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('멤버 초대 실패:', error);
      throw new Error(err.response?.data?.message || err.message || '멤버 초대에 실패했습니다.');
    }
  },

  getSharedPlans: async (): Promise<Plan[]> => {
    try {
      const response = await api.get<Plan[]>('/plans/shared');
      return response.data || [];
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('공유 플랜 목록 조회 실패:', error);
      throw new Error(err.response?.data?.message || err.message || '공유 플랜 목록을 불러오는데 실패했습니다.');
    }
  },
};

