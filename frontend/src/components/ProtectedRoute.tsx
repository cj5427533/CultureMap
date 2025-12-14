import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  if (!authService.isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-2 border-green-200 bg-white shadow-2xl">
          <div className="text-center py-8 md:py-10 px-6 md:px-8">
            <div className="text-6xl md:text-7xl mb-6">🔒</div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">
              로그인이 필요합니다
            </h2>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-4 md:p-5 mb-6 md:mb-8">
              <p className="text-base md:text-lg text-gray-800 font-semibold leading-relaxed">
                회원가입 및 로그인 후<br />
                플래너를 사용하실 수 있습니다.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Link to="/signup" className="flex-1">
                <Button variant="primary" className="w-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                  회원가입
                </Button>
              </Link>
              <Link to="/login" className="flex-1">
                <Button variant="secondary" className="w-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700">
                  로그인
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
};

