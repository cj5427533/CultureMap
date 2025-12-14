import api from '../utils/api';
import type { Comment, CommentRequest } from '../types/index';

export const commentService = {
  getComments: async (postId: number): Promise<Comment[]> => {
    try {
      if (!postId || postId <= 0) {
        throw new Error('유효하지 않은 게시글 ID입니다.');
      }
      const response = await api.get<Comment[]>(`/comments/post/${postId}`);
      return response.data || [];
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('댓글 목록 조회 실패:', error);
      throw new Error(err.response?.data?.message || err.message || '댓글 목록을 불러오는데 실패했습니다.');
    }
  },

  createComment: async (data: CommentRequest): Promise<Comment> => {
    try {
      // 입력 검증
      if (!data.postId || data.postId <= 0) {
        throw new Error('유효하지 않은 게시글 ID입니다.');
      }
      if (!data.content || !data.content.trim()) {
        throw new Error('댓글 내용을 입력해주세요.');
      }
      if (data.rating && (data.rating < 1 || data.rating > 5)) {
        throw new Error('별점은 1~5 사이의 값이어야 합니다.');
      }

      const response = await api.post<Comment>('/comments', data);
      if (!response.data) {
        throw new Error('댓글 생성 응답이 없습니다.');
      }
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('댓글 생성 실패:', error);
      throw new Error(err.response?.data?.message || err.message || '댓글 작성에 실패했습니다.');
    }
  },

  updateComment: async (id: number, data: CommentRequest): Promise<Comment> => {
    try {
      if (!id || id <= 0) {
        throw new Error('유효하지 않은 댓글 ID입니다.');
      }
      if (!data.content || !data.content.trim()) {
        throw new Error('댓글 내용을 입력해주세요.');
      }

      const response = await api.put<Comment>(`/comments/${id}`, data);
      if (!response.data) {
        throw new Error('댓글 수정 응답이 없습니다.');
      }
      return response.data;
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      console.error('댓글 수정 실패:', error);
      if (err.response?.status === 404) {
        throw new Error('댓글을 찾을 수 없습니다.');
      }
      if (err.response?.status === 403) {
        throw new Error('댓글을 수정할 권한이 없습니다.');
      }
      throw new Error(err.response?.data?.message || err.message || '댓글 수정에 실패했습니다.');
    }
  },

  deleteComment: async (id: number): Promise<void> => {
    try {
      if (!id || id <= 0) {
        throw new Error('유효하지 않은 댓글 ID입니다.');
      }
      await api.delete(`/comments/${id}`);
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      console.error('댓글 삭제 실패:', error);
      if (err.response?.status === 404) {
        throw new Error('댓글을 찾을 수 없습니다.');
      }
      if (err.response?.status === 403) {
        throw new Error('댓글을 삭제할 권한이 없습니다.');
      }
      throw new Error(err.response?.data?.message || err.message || '댓글 삭제에 실패했습니다.');
    }
  },
};
