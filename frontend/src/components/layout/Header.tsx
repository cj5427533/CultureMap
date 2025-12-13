import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button } from '../ui/Button';

interface HeaderProps {
  onLogout?: () => void;
}

export const Header = ({ onLogout }: HeaderProps) => {
  const user = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();

  return (
    <header className="bg-white shadow-md border-b-2 border-green-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-all duration-200 transform hover:scale-105">
            <img 
              src="/CultureMap_logo.png" 
              alt="CultureMap 로고" 
              className="h-12 w-auto"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              컬처맵
            </span>
          </Link>
          
          <nav className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/plans" 
                  className="text-gray-700 hover:text-green-600 font-semibold transition-colors duration-200 relative group"
                >
                  내 플랜
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all duration-200 group-hover:w-full"></span>
                </Link>
                <Link 
                  to="/posts" 
                  className="text-gray-700 hover:text-green-600 font-semibold transition-colors duration-200 relative group"
                >
                  공유 게시판
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all duration-200 group-hover:w-full"></span>
                </Link>
                {user && user.role === 'ADMIN' && (
                  <Link 
                    to="/admin" 
                    className="text-gray-700 hover:text-red-600 font-semibold transition-colors duration-200 relative group"
                  >
                    관리자
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-200 group-hover:w-full"></span>
                  </Link>
                )}
                {user && (
                  <span className="text-gray-700 text-sm font-medium px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                    {user.nickname}님
                  </span>
                )}
                {onLogout && (
                  <Button variant="secondary" onClick={onLogout} className="text-sm">
                    로그아웃
                  </Button>
                )}
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="primary" className="text-sm">
                    로그인
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="success" className="text-sm">
                    회원가입
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

