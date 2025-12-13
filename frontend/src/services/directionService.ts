import api from '../utils/api';

export interface DirectionsLatLng {
  lat: number;
  lng: number;
}

export interface DirectionsResponse {
  distanceMeters: number;
  durationSeconds: number;
  path: DirectionsLatLng[];
  fromCache: boolean;
  provider: string;
  transportMode: string;
}

export const directionService = {
  async getDirections(payload: {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    waypoints?: DirectionsLatLng[];
  }): Promise<DirectionsResponse> {
    const { data } = await api.post<DirectionsResponse>('/directions', payload);
    return data;
  },
};
