import api from '../utils/api';
import type { Comment, CommentRequest } from '../types/index';

export const commentService = {
  getComments: async (postId: number): Promise<Comment[]> => {
    const response = await api.get<Comment[]>(`/comments/post/${postId}`);
    return response.data;
  },

  createComment: async (data: CommentRequest): Promise<Comment> => {
    const response = await api.post<Comment>('/comments', data);
    return response.data;
  },

  updateComment: async (id: number, data: CommentRequest): Promise<Comment> => {
    const response = await api.put<Comment>(`/comments/${id}`, data);
    return response.data;
  },

  deleteComment: async (id: number): Promise<void> => {
    await api.delete(`/comments/${id}`);
  },
};
