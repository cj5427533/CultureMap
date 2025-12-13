import api from '../utils/api';
import type { Rating } from '../types/index';

export interface RatingRequest {
  postId: number;
  score: number;
}

export interface RatingResponse {
  id?: number;
  postId: number;
  score: number;
  userRating?: number;
}

export const ratingService = {
  getRating: async (postId: number): Promise<RatingResponse> => {
    const response = await api.get<RatingResponse>(`/ratings/post/${postId}`);
    return response.data;
  },

  createOrUpdateRating: async (data: RatingRequest): Promise<RatingResponse> => {
    const response = await api.post<RatingResponse>('/ratings', data);
    return response.data;
  },

  deleteRating: async (postId: number): Promise<void> => {
    await api.delete(`/ratings/post/${postId}`);
  },
};
