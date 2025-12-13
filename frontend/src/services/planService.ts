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
    const params = date ? { date } : {};
    const response = await api.get<Plan[]>('/plans', { params });
    return response.data;
  },

  getPlan: async (id: number): Promise<Plan> => {
    const response = await api.get<Plan>(`/plans/${id}`);
    return response.data;
  },

  createPlan: async (data: PlanRequest): Promise<Plan> => {
    const response = await api.post<Plan>('/plans', data);
    return response.data;
  },

  updatePlan: async (id: number, data: PlanRequest): Promise<Plan> => {
    const response = await api.put<Plan>(`/plans/${id}`, data);
    return response.data;
  },

  deletePlan: async (id: number): Promise<void> => {
    await api.delete(`/plans/${id}`);
  },

  addPlaceToPlan: async (data: AddPlaceToPlanRequest): Promise<Plan> => {
    const response = await api.post<Plan>('/plans/add-place', data);
    return response.data;
  },

  inviteMember: async (data: { planId: number; email: string; role: string }): Promise<void> => {
    await api.post('/plans/invite', data);
  },

  getSharedPlans: async (): Promise<Plan[]> => {
    const response = await api.get<Plan[]>('/plans/shared');
    return response.data;
  },
};

