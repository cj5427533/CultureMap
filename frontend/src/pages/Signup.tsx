import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import type { SignupRequest } from '../types/index';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignupRequest>({
    email: '',
    password: '',
    nickname: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await authService.signup(formData);
      navigate('/', { replace: true });
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || '회원가입에 실패했습니다.'
        : '회원가입에 실패했습니다.';
      setError(errorMessage);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 md:py-12">
      {/* 균형과 색상 조화: 회원가입 카드 */}
      <Card className="border-2 border-green-200">
        {/* 타이포그래피: 제목 */}
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 md:mb-8 text-gray-900">회원가입</h1>
        <form onSubmit={handleSubmit}>
          <Input
            label="이메일"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="비밀번호"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={6}
          />
          <Input
            label="닉네임"
            type="text"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            required
            minLength={2}
            maxLength={20}
          />
          {/* 대비: 에러 메시지 */}
          {error && (
            <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg md:rounded-xl font-medium">
              {error}
            </div>
          )}
          {/* 여백: 버튼 */}
          <Button type="submit" variant="primary" className="w-full mb-4 md:mb-6">
            회원가입
          </Button>
          {/* 정렬: 로그인 링크 */}
          <div className="text-center">
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold text-base md:text-lg transition-colors">
              로그인
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};

