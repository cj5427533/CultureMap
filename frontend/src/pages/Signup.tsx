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
      navigate('/plans');
    } catch (err: any) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <h1 className="text-3xl font-bold text-center mb-6">회원가입</h1>
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
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          <Button type="submit" variant="primary" className="w-full mb-4">
            회원가입
          </Button>
          <div className="text-center">
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              로그인
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};

