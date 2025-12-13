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
    <header className="bg-white shadow-lg border-b-2 border-green-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* 시각적 위계: 로고와 브랜드명 */}
          <Link to="/" className="flex items-center space-x-2 md:space-x-3 hover:opacity-80 transition-all duration-200 transform hover:scale-105 touch-target">
            <img 
              src="/CultureMap_logo.png" 
              alt="CultureMap 로고" 
              className="h-8 md:h-10 lg:h-12 w-auto"
            />
            <span className="text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              컬처맵
            </span>
          </Link>
          
          {/* 일관성: 네비게이션 메뉴 - 모바일 최적화 */}
          <nav className="flex items-center space-x-2 md:space-x-4 lg:space-x-6">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/plans" 
                  className="text-gray-700 hover:text-green-600 font-semibold text-sm md:text-base transition-colors duration-200 relative group px-2 md:px-3 py-1.5 md:py-2 rounded-md hover:bg-green-50 touch-target"
                >
                  내 플랜
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all duration-200 group-hover:w-full"></span>
                </Link>
                <Link 
                  to="/posts" 
                  className="text-gray-700 hover:text-green-600 font-semibold text-sm md:text-base transition-colors duration-200 relative group px-2 md:px-3 py-1.5 md:py-2 rounded-md hover:bg-green-50 touch-target"
                >
                  공유 게시판
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all duration-200 group-hover:w-full"></span>
                </Link>
                {user && user.role === 'ADMIN' && (
                  <Link 
                    to="/admin" 
                    className="text-gray-700 hover:text-red-600 font-semibold text-sm md:text-base transition-colors duration-200 relative group px-2 md:px-3 py-1.5 md:py-2 rounded-md hover:bg-red-50 touch-target"
                  >
                    관리자
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-200 group-hover:w-full"></span>
                  </Link>
                )}
                {/* 대비: 사용자 닉네임 표시 */}
                {user && (
                  <span className="text-gray-800 text-xs md:text-sm font-semibold px-2 md:px-3 py-1.5 md:py-2 bg-green-50 rounded-full border-2 border-green-200 hidden sm:inline-block">
                    {user.nickname}님
                  </span>
                )}
                {onLogout && (
                  <Button variant="secondary" onClick={onLogout} className="text-xs md:text-sm px-3 md:px-4">
                    로그아웃
                  </Button>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="primary" className="text-xs md:text-sm px-3 md:px-4">
                    로그인
                  </Button>
                </Link>
                <Link to="/signup" className="hidden sm:block">
                  <Button variant="success" className="text-xs md:text-sm px-3 md:px-4">
                    회원가입
                  </Button>
                </Link>
                {/* 모바일: 햄버거 메뉴 대신 아이콘 또는 간단한 버튼 */}
                <Link to="/login" className="sm:hidden">
                  <Button variant="primary" className="text-xs px-3">
                    로그인
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

