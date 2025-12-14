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
    try {
      // 입력 검증
      if (typeof payload.originLat !== 'number' || isNaN(payload.originLat) || 
          payload.originLat < -90 || payload.originLat > 90) {
        throw new Error('유효하지 않은 출발지 위도입니다.');
      }
      if (typeof payload.originLng !== 'number' || isNaN(payload.originLng) || 
          payload.originLng < -180 || payload.originLng > 180) {
        throw new Error('유효하지 않은 출발지 경도입니다.');
      }
      if (typeof payload.destLat !== 'number' || isNaN(payload.destLat) || 
          payload.destLat < -90 || payload.destLat > 90) {
        throw new Error('유효하지 않은 목적지 위도입니다.');
      }
      if (typeof payload.destLng !== 'number' || isNaN(payload.destLng) || 
          payload.destLng < -180 || payload.destLng > 180) {
        throw new Error('유효하지 않은 목적지 경도입니다.');
      }

      const { data } = await api.post<DirectionsResponse>('/directions', payload);
      if (!data) {
        throw new Error('경로 정보 응답이 없습니다.');
      }
      if (!data.path || !Array.isArray(data.path) || data.path.length === 0) {
        throw new Error('경로 정보가 올바르지 않습니다.');
      }
      return data;
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      console.error('경로 조회 실패:', error);
      if (err.response?.status === 400) {
        throw new Error(err.response?.data?.message || '잘못된 경로 요청입니다.');
      }
      if (err.response?.status === 500) {
        throw new Error('경로 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      throw new Error(err.response?.data?.message || err.message || '경로를 불러오는데 실패했습니다.');
    }
  },
};
