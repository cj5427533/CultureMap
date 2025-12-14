import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      // setState를 비동기로 처리
      setTimeout(() => {
        setState({
          latitude: null,
          longitude: null,
          error: 'Geolocation이 지원되지 않는 브라우저입니다.',
          loading: false,
        });
      }, 0);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorMessage = '위치 정보를 가져올 수 없습니다.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다. GPS 또는 네트워크 연결을 확인해주세요.';
            break;
          case error.TIMEOUT:
            errorMessage = '위치 정보 요청 시간이 초과되었습니다. 다시 시도해주세요.';
            break;
          default:
            errorMessage = `위치 정보를 가져올 수 없습니다. (오류 코드: ${error.code})`;
            break;
        }
        
        console.error('Geolocation 오류:', error);
        setState({
          latitude: null,
          longitude: null,
          error: errorMessage,
          loading: false,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, []);

  return state;
};

