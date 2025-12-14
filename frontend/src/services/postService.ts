import api from '../utils/api';
import type { PlanPost, PlanPostRequest } from '../types/index';

export const postService = {
  getAllPosts: async (): Promise<PlanPost[]> => {
    try {
      const response = await api.get<PlanPost[]>('/posts');
      return response.data || [];
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('게시글 목록 조회 실패:', error);
      throw new Error(err.response?.data?.message || err.message || '게시글 목록을 불러오는데 실패했습니다.');
    }
  },

  getPost: async (id: number): Promise<PlanPost> => {
    try {
      if (!id || id <= 0) {
        throw new Error('유효하지 않은 게시글 ID입니다.');
      }
      const response = await api.get<PlanPost>(`/posts/${id}`);
      if (!response.data) {
        throw new Error('게시글 데이터가 없습니다.');
      }
      return response.data;
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      console.error('게시글 조회 실패:', error);
      if (err.response?.status === 404) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }
      throw new Error(err.response?.data?.message || err.message || '게시글을 불러오는데 실패했습니다.');
    }
  },

  createPost: async (data: PlanPostRequest): Promise<PlanPost> => {
    try {
      // 입력 검증
      if (!data.planId || data.planId <= 0) {
        throw new Error('플랜을 선택해주세요.');
      }
      if (!data.title || !data.title.trim()) {
        throw new Error('게시글 제목을 입력해주세요.');
      }

      const response = await api.post<PlanPost>('/posts', data);
      if (!response.data) {
        throw new Error('게시글 생성 응답이 없습니다.');
      }
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('게시글 생성 실패:', error);
      throw new Error(err.response?.data?.message || err.message || '게시글 생성에 실패했습니다.');
    }
  },

  updatePost: async (id: number, data: PlanPostRequest): Promise<PlanPost> => {
    try {
      if (!id || id <= 0) {
        throw new Error('유효하지 않은 게시글 ID입니다.');
      }
      if (!data.title || !data.title.trim()) {
        throw new Error('게시글 제목을 입력해주세요.');
      }

      const response = await api.put<PlanPost>(`/posts/${id}`, data);
      if (!response.data) {
        throw new Error('게시글 수정 응답이 없습니다.');
      }
      return response.data;
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      console.error('게시글 수정 실패:', error);
      if (err.response?.status === 404) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }
      if (err.response?.status === 403) {
        throw new Error('게시글을 수정할 권한이 없습니다.');
      }
      throw new Error(err.response?.data?.message || err.message || '게시글 수정에 실패했습니다.');
    }
  },

  deletePost: async (id: number): Promise<void> => {
    try {
      if (!id || id <= 0) {
        throw new Error('유효하지 않은 게시글 ID입니다.');
      }
      await api.delete(`/posts/${id}`);
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      console.error('게시글 삭제 실패:', error);
      if (err.response?.status === 404) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }
      if (err.response?.status === 403) {
        throw new Error('게시글을 삭제할 권한이 없습니다.');
      }
      throw new Error(err.response?.data?.message || err.message || '게시글 삭제에 실패했습니다.');
    }
  },
};

