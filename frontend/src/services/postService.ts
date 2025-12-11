import api from '../utils/api';
import type { PlanPost, PlanPostRequest } from '../types/index';

export const postService = {
  getAllPosts: async (): Promise<PlanPost[]> => {
    const response = await api.get<PlanPost[]>('/posts');
    return response.data;
  },

  getPost: async (id: number): Promise<PlanPost> => {
    const response = await api.get<PlanPost>(`/posts/${id}`);
    return response.data;
  },

  createPost: async (data: PlanPostRequest): Promise<PlanPost> => {
    const response = await api.post<PlanPost>('/posts', data);
    return response.data;
  },

  updatePost: async (id: number, data: PlanPostRequest): Promise<PlanPost> => {
    const response = await api.put<PlanPost>(`/posts/${id}`, data);
    return response.data;
  },

  deletePost: async (id: number): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },
};

