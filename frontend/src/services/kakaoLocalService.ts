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

// 백엔드가 문자열/객체/에러 HTML을 반환할 수 있으므로 안전하게 파싱
const parseKakaoResponse = (raw: unknown, context: string): KakaoLocalResponse => {
  if (typeof raw !== 'string') {
    return raw as KakaoLocalResponse;
  }

  // HTML이 오면 JSON 파싱 전에 바로 에러를 던져서 "Unexpected token <"를 방지
  if (raw.trim().startsWith('<')) {
    throw new Error(`${context}: JSON이 아닌 HTML 응답을 받았습니다. (아마 401/403/500 등 백엔드 에러)`);
  }

  try {
    return JSON.parse(raw) as KakaoLocalResponse;
  } catch (e) {
    throw new Error(`${context}: Kakao 응답 파싱 실패 - ${e instanceof Error ? e.message : String(e)}`);
  }
};

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

      const data: KakaoLocalResponse = parseKakaoResponse(response.data, '주변 문화시설 검색');
      
      console.log('검색된 문화시설 수:', data.documents.length);
      return data.documents;
    } catch (error) {
      const err = error as { 
        code?: string; 
        message?: string; 
        response?: { 
          status?: number; 
          statusText?: string; 
          data?: { message?: string } 
        }; 
        config?: { url?: string } 
      };
      console.error('주변 문화시설 검색 실패:', error);
      console.error('에러 상세:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        url: err.config?.url,
      });
      
      // 네트워크 / CORS 등으로 브라우저에서 요청이 차단된 경우
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.code === 'ERR_CONNECTION_REFUSED') {
        throw new Error('서버 통신 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 네트워크/브라우저(CORS) 설정을 확인해주세요.');
      }
      
      if (err.response?.status === 403) {
        throw new Error('접근 권한이 없습니다. 로그인 상태를 확인해주세요.');
      }
      
      throw new Error(err.response?.data?.message || err.message || '주변 문화시설 검색에 실패했습니다.');
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

      const data: KakaoLocalResponse = parseKakaoResponse(response.data, '키워드 검색');
      
      console.log('키워드 검색 결과:', data.documents.length);
      return data.documents;
    } catch (error) {
      const err = error as { 
        code?: string; 
        message?: string; 
        response?: { 
          status?: number; 
          statusText?: string; 
          data?: { message?: string } 
        }; 
        config?: { url?: string } 
      };
      console.error('키워드 검색 실패:', error);
      console.error('에러 상세:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        url: err.config?.url,
      });
      
      // 네트워크 / CORS 등으로 브라우저에서 요청이 차단된 경우
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.code === 'ERR_CONNECTION_REFUSED') {
        throw new Error('서버 통신 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 네트워크/브라우저(CORS) 설정을 확인해주세요.');
      }
      
      if (err.response?.status === 403) {
        throw new Error('접근 권한이 없습니다. 로그인 상태를 확인해주세요.');
      }
      
      throw new Error(err.response?.data?.message || err.message || '키워드 검색에 실패했습니다.');
    }
  },
};

