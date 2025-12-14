import api from '../utils/api';
import type { Place } from '../types/index';

export interface PlaceRequest {
  name: string;
  address?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  externalId?: string;
}

export const placeService = {
  searchPlaces: async (keyword?: string): Promise<Place[]> => {
    try {
      const params = keyword ? { keyword } : {};
      const response = await api.get<Place[]>('/places', { params });
      return response.data || [];
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('장소 검색 실패:', error);
      throw new Error(err.response?.data?.message || err.message || '장소 검색에 실패했습니다.');
    }
  },

  getPlace: async (id: number): Promise<Place> => {
    try {
      if (!id || id <= 0) {
        throw new Error('유효하지 않은 장소 ID입니다.');
      }
      const response = await api.get<Place>(`/places/${id}`);
      if (!response.data) {
        throw new Error('장소 데이터가 없습니다.');
      }
      return response.data;
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      console.error('장소 조회 실패:', error);
      if (err.response?.status === 404) {
        throw new Error('장소를 찾을 수 없습니다.');
      }
      throw new Error(err.response?.data?.message || err.message || '장소를 불러오는데 실패했습니다.');
    }
  },

  createPlace: async (data: PlaceRequest): Promise<Place> => {
    try {
      // 입력 검증
      if (!data.name || !data.name.trim()) {
        throw new Error('장소 이름을 입력해주세요.');
      }

      const response = await api.post<Place>('/places', data);
      if (!response.data) {
        throw new Error('장소 생성 응답이 없습니다.');
      }
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('장소 생성 실패:', error);
      throw new Error(err.response?.data?.message || err.message || '장소 생성에 실패했습니다.');
    }
  },
};

