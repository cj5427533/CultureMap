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
    const params = keyword ? { keyword } : {};
    const response = await api.get<Place[]>('/places', { params });
    return response.data;
  },

  getPlace: async (id: number): Promise<Place> => {
    const response = await api.get<Place>(`/places/${id}`);
    return response.data;
  },

  createPlace: async (data: PlaceRequest): Promise<Place> => {
    const response = await api.post<Place>('/places', data);
    return response.data;
  },
};

