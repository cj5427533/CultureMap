import axios from 'axios';

// 환경 변수에서 API URL 가져오기 (Vite는 import.meta.env 사용)
// 프록시 사용 시 상대 경로 사용
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// 로딩 상태 관리 (간단한 카운터 방식)
let loadingCount = 0;
let loadingListeners: Array<(loading: boolean) => void> = [];

const setLoading = (loading: boolean) => {
  if (loading) {
    loadingCount++;
  } else {
    loadingCount = Math.max(0, loadingCount - 1);
  }
  const isLoading = loadingCount > 0;
  loadingListeners.forEach(listener => listener(isLoading));
};

export const addLoadingListener = (listener: (loading: boolean) => void) => {
  loadingListeners.push(listener);
  return () => {
    loadingListeners = loadingListeners.filter(l => l !== listener);
  };
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰 추가 및 로딩 시작
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API 요청 - 토큰 포함:', config.url, '토큰 존재:', !!token);
    } else {
      console.warn('API 요청 - 토큰 없음:', config.url);
    }
    setLoading(true);
    return config;
  },
  (error) => {
    setLoading(false);
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 에러 시 refresh token으로 자동 재발급
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    setLoading(false);
    return response;
  },
  async (error) => {
    setLoading(false);
    const originalRequest = error.config;
    const status = error.response?.status;

    // 401 에러이고 refresh token이 있는 경우 자동 재발급 시도
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 refresh 중이면 대기
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        processQueue(error);
        // Refresh token도 없으면 로그아웃
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          alert('세션이 만료되었습니다. 다시 로그인해주세요.');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        // Refresh token으로 새 access token 발급
        const response = await api.post('/auth/refresh', { refreshToken });
        const { token } = response.data;
        
        localStorage.setItem('token', token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${token}`;
        isRefreshing = false;
        processQueue(null, token);
        
        // 원래 요청 재시도
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);
        // Refresh 실패 시 로그아웃
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          alert('세션이 만료되었습니다. 다시 로그인해주세요.');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // 403 에러 처리
    if (status === 403) {
      console.warn('권한 오류 발생:', status, error.config?.url);
      if (window.location.pathname !== '/login') {
        const errorMessage = error.response?.data?.message || '접근 권한이 없습니다.';
        alert(errorMessage);
      }
    }

    // 404 에러 처리
    if (status === 404) {
      console.warn('리소스를 찾을 수 없음:', status, error.config?.url);
      const errorMessage = error.response?.data?.message || '요청한 리소스를 찾을 수 없습니다.';
      // 404는 alert를 표시하지 않고 상위에서 처리하도록 함
    }

    // 500 에러 처리
    if (status === 500) {
      console.error('서버 오류 발생:', status, error.config?.url);
      const errorMessage = error.response?.data?.message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      // 500은 상위에서 처리하도록 함
    }

    // 네트워크 에러 처리
    if (!error.response) {
      console.error('네트워크 오류:', error.message);
      // 네트워크 에러는 상위에서 처리하도록 함
    }

    return Promise.reject(error);
  }
);

export default api;

