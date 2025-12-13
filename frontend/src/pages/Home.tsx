import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { HomeMap } from '../components/HomeMap';

export const Home = () => {
  const user = authService.getCurrentUser();

  return (
    <div className="max-w-7xl mx-auto">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="relative text-center py-5 px-6">
          <div className="flex flex-col items-center mb-3 animate-fade-in">
            <div className="mb-2 transform hover:scale-110 transition-transform duration-300">
              <img 
                src="/CultureMap_logo.png" 
                alt="CultureMap 로고" 
                className="h-12 w-auto drop-shadow-2xl"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2 drop-shadow-lg">
              컬처맵
            </h1>
            <p className="text-base md:text-lg text-green-50 font-medium mb-3 max-w-2xl mx-auto leading-relaxed">
              나의 문화 일정을 계획하고, 기록하고, 공유한다.
            </p>
          </div>
          
          {user ? (
            <div className="space-y-3 animate-fade-in-up">
              <p className="text-base text-white">
                안녕하세요, <span className="font-bold text-yellow-300">{user.nickname}</span>님!
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link to="/plans" className="transform hover:scale-105 transition-transform duration-200">
                  <Button variant="secondary" className="px-8 py-3 text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-2xl border-2 border-white/20">
                    📅 내 플랜 보기
                  </Button>
                </Link>
                <Link to="/posts" className="transform hover:scale-105 transition-transform duration-200">
                  <Button variant="success" className="px-8 py-3 text-base font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-800 hover:from-yellow-500 hover:to-amber-600 shadow-2xl border-2 border-white/20">
                    👥 공유 게시판
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center gap-3 animate-fade-in-up">
              <Link to="/login" className="transform hover:scale-105 transition-transform duration-200">
                <Button variant="secondary" className="px-8 py-3 text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-2xl border-2 border-white/20">
                  🔐 로그인
                </Button>
              </Link>
              <Link to="/signup" className="transform hover:scale-105 transition-transform duration-200">
                <Button variant="success" className="px-8 py-3 text-base font-bold bg-white text-green-700 hover:bg-green-50 shadow-2xl border-2 border-white/20">
                  ✨ 회원가입
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 기능 소개 카드 섹션 */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100">
          <div className="text-5xl mb-4">🗓️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">플랜 생성</h3>
          <p className="text-gray-600 leading-relaxed">
            전시, 공연 등 다양한 문화시설을 조합하여 나만의 문화 일정을 만들어보세요.
          </p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100">
          <div className="text-5xl mb-4">📍</div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">장소 검색</h3>
          <p className="text-gray-600 leading-relaxed">
            한국문화정보원 API를 통해 주변 문화시설을 쉽게 찾고 지도에서 확인하세요.
          </p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100">
          <div className="text-5xl mb-4">🤝</div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">플랜 공유</h3>
          <p className="text-gray-600 leading-relaxed">
            내가 만든 플랜을 커뮤니티에 공유하고 다른 사람들의 플랜도 구경해보세요.
          </p>
        </div>
      </div>

      {/* 주변 문화시설 지도 */}
      <div className="mb-8">
        <HomeMap />
      </div>
    </div>
  );
};

