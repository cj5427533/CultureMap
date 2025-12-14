import api from '../utils/api';
import type { AuthResponse, SignupRequest, LoginRequest } from '../types/index';

export const authService = {
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    try {
      // 입력 검증
      if (!data.email || !data.email.trim()) {
        throw new Error('이메일을 입력해주세요.');
      }
      if (!data.password || data.password.length < 6) {
        throw new Error('비밀번호는 6자 이상이어야 합니다.');
      }
      if (!data.nickname || data.nickname.trim().length < 2) {
        throw new Error('닉네임은 2자 이상이어야 합니다.');
      }

      const response = await api.post<AuthResponse>('/auth/signup', data);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        localStorage.setItem('user', JSON.stringify({
          email: response.data.email,
          nickname: response.data.nickname,
          role: response.data.role || 'USER',
        }));
      }
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err.response?.data?.message || err.message || '회원가입에 실패했습니다.';
      throw new Error(errorMessage);
    }
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      // 입력 검증
      if (!data.email || !data.email.trim()) {
        throw new Error('이메일을 입력해주세요.');
      }
      if (!data.password || !data.password.trim()) {
        throw new Error('비밀번호를 입력해주세요.');
      }

      const response = await api.post<AuthResponse>('/auth/login', data);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        localStorage.setItem('user', JSON.stringify({
          email: response.data.email,
          nickname: response.data.nickname,
          role: response.data.role || 'USER',
        }));
      }
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err.response?.data?.message || err.message || '로그인에 실패했습니다.';
      throw new Error(errorMessage);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  refreshToken: async (): Promise<AuthResponse | null> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return null;
    }
    try {
      const response = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        return response.data;
      }
      return null;
    } catch {
      // Refresh token도 만료된 경우
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return null;
    }
  },

  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('사용자 정보 파싱 실패:', error);
      // 손상된 데이터 정리
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};

