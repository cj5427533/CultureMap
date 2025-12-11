import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API 요청 - 토큰 포함:', config.url, '토큰 존재:', !!token);
    } else {
      console.warn('API 요청 - 토큰 없음:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401, 403 에러 시 로그아웃
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      console.warn('인증 오류 발생:', status, error.config?.url);
      const token = localStorage.getItem('token');
      console.log('현재 저장된 토큰:', token ? '존재함' : '없음');
      
      // 토큰이 없거나 유효하지 않은 경우 로그아웃 처리
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 현재 페이지가 로그인 페이지가 아닌 경우에만 리다이렉트
      if (window.location.pathname !== '/login') {
        alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

