// Kakao Local API를 사용한 주변 문화시설 검색
// 백엔드 프록시를 통해 호출 (CORS 문제 해결)

export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  x: string; // longitude
  y: string; // latitude
  phone: string;
  place_url: string;
}

export interface KakaoLocalResponse {
  documents: KakaoPlace[];
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
}

import api from '../utils/api';

export const kakaoLocalService = {
  /**
   * 주변 문화시설 검색 (카테고리: 문화시설)
   * 백엔드 프록시를 통해 Kakao Local API 호출
   * @param lat 위도
   * @param lng 경도
   * @param radius 반경 (미터, 기본 2000m)
   */
  searchNearbyCulturePlaces: async (
    lat: number,
    lng: number,
    radius: number = 2000
  ): Promise<KakaoPlace[]> => {
    try {
      // 백엔드 프록시 API 호출
      const response = await api.get('/places/kakao/nearby', {
        params: {
          lat,
          lng,
          radius,
        },
      });

      // 백엔드가 Kakao API 응답을 JSON 문자열로 반환하므로 파싱
      const data: KakaoLocalResponse = typeof response.data === 'string' 
        ? JSON.parse(response.data) 
        : response.data;
      
      console.log('검색된 문화시설 수:', data.documents.length);
      return data.documents;
    } catch (error: any) {
      console.error('주변 문화시설 검색 실패:', error);
      console.error('에러 상세:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
      });
      
      // 네트워크 에러 처리
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || error.code === 'ERR_CONNECTION_REFUSED') {
        throw new Error('백엔드 서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요. (포트 8080)');
      }
      
      if (error.response?.status === 403) {
        throw new Error('접근 권한이 없습니다. 로그인 상태를 확인해주세요.');
      }
      
      throw new Error(error.response?.data?.message || error.message || '주변 문화시설 검색에 실패했습니다.');
    }
  },

  /**
   * 위치 기반 키워드 검색
   * @param query 검색 키워드
   * @param lat 위도
   * @param lng 경도
   * @param radius 반경 (미터, 기본 2000m)
   */
  searchKeywordNearby: async (
    query: string,
    lat: number,
    lng: number,
    radius: number = 2000
  ): Promise<KakaoPlace[]> => {
    try {
      // 백엔드 프록시 API 호출
      const response = await api.get('/places/kakao/keyword', {
        params: {
          query,
          lat,
          lng,
          radius,
        },
      });

      // 백엔드가 Kakao API 응답을 JSON 문자열로 반환하므로 파싱
      const data: KakaoLocalResponse = typeof response.data === 'string' 
        ? JSON.parse(response.data) 
        : response.data;
      
      console.log('키워드 검색 결과:', data.documents.length);
      return data.documents;
    } catch (error: any) {
      console.error('키워드 검색 실패:', error);
      console.error('에러 상세:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
      });
      
      // 네트워크 에러 처리
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || error.code === 'ERR_CONNECTION_REFUSED') {
        throw new Error('백엔드 서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요. (포트 8080)');
      }
      
      if (error.response?.status === 403) {
        throw new Error('접근 권한이 없습니다. 로그인 상태를 확인해주세요.');
      }
      
      throw new Error(error.response?.data?.message || error.message || '키워드 검색에 실패했습니다.');
    }
  },
};

