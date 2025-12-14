import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { HomeMap } from '../components/HomeMap';

export const Home = () => {
  const user = authService.getCurrentUser();

  return (
    <div className="max-w-7xl mx-auto">
      {/* 시각적 위계와 균형: 히어로 섹션 개선 */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 shadow-2xl mb-6 md:mb-8">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="relative text-center py-5 md:py-6 lg:py-8 px-4 md:px-6 lg:px-8">
          <div className="flex flex-col items-center mb-3 md:mb-4 animate-fade-in">
            <div className="mb-2 md:mb-3 transform hover:scale-110 transition-transform duration-300">
              <img 
                src="/CultureMap_logo_nuggi.png" 
                alt="CultureMap 로고" 
                className="h-24 md:h-[120px] lg:h-36 w-auto drop-shadow-2xl"
              />
            </div>
            {/* 타이포그래피: 제목 개선 */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-2 md:mb-3 drop-shadow-lg">
              컬처맵
            </h1>
            {/* 가독성: 부제목 개선 */}
            <p className="text-sm md:text-base lg:text-lg text-green-50 font-medium mb-3 md:mb-4 max-w-2xl mx-auto leading-relaxed">
              나의 문화 일정을 계획하고, 기록하고, 공유한다.
            </p>
          </div>
          
          {/* 여백과 정렬: 버튼 영역 */}
          {user ? (
            <div className="space-y-3 md:space-y-4 animate-fade-in-up">
              <p className="text-sm md:text-base text-white font-medium">
                안녕하세요, <span className="font-bold text-yellow-300">{user.nickname}</span>님!
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-2 md:gap-3">
                <Link to="/plans" className="transform hover:scale-105 transition-transform duration-200">
                  <Button variant="secondary" className="w-full sm:w-auto px-5 md:px-6 py-2 md:py-2.5 text-sm md:text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-2xl border-2 border-white/30">
                    📅 내 플랜 보기
                  </Button>
                </Link>
                <Link to="/posts" className="transform hover:scale-105 transition-transform duration-200">
                  <button className="w-full sm:w-auto px-5 md:px-6 py-2 md:py-2.5 text-sm md:text-base font-bold !bg-gradient-to-r !from-yellow-400 !to-amber-500 text-gray-900 hover:!from-yellow-500 hover:!to-amber-600 shadow-2xl !border-2 !border-white/30 rounded-lg md:rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95">
                    👥 공유 게시판
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex justify-center animate-fade-in-up">
              <Link to="/login" className="transform hover:scale-105 transition-transform duration-200 w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto px-5 md:px-6 py-2 md:py-2.5 text-sm md:text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-2xl border-2 border-white/30">
                  🔐 로그인 하고 이용하기
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 여백: 주변 문화시설 지도 - 히어로 섹션 바로 아래 */}
      <div className="mb-8 md:mb-12 lg:mb-16">
        <HomeMap />
      </div>

      {/* 리듬과 균형: 기능 소개 카드 섹션 - 하단으로 이동 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-8 md:mb-12 lg:mb-16">
        <div className="bg-white rounded-xl md:rounded-2xl p-6 md:p-8 lg:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-green-100">
          <div className="text-4xl md:text-5xl lg:text-6xl mb-4 md:mb-6">🗓️</div>
          <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-3 md:mb-4">플랜 생성</h3>
          <p className="text-sm md:text-base text-gray-700 leading-relaxed">
            전시, 공연 등 다양한 문화시설을 조합하여 나만의 문화 일정을 만들어보세요.
          </p>
        </div>
        <div className="bg-white rounded-xl md:rounded-2xl p-6 md:p-8 lg:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-green-100">
          <div className="text-4xl md:text-5xl lg:text-6xl mb-4 md:mb-6">📍</div>
          <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-3 md:mb-4">장소 검색</h3>
          <p className="text-sm md:text-base text-gray-700 leading-relaxed">
            한국문화정보원 API를 통해 주변 문화시설을 쉽게 찾고 지도에서 확인하세요.
          </p>
        </div>
        <div className="bg-white rounded-xl md:rounded-2xl p-6 md:p-8 lg:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-green-100">
          <div className="text-4xl md:text-5xl lg:text-6xl mb-4 md:mb-6">🤝</div>
          <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-3 md:mb-4">플랜 공유</h3>
          <p className="text-sm md:text-base text-gray-700 leading-relaxed">
            내가 만든 플랜을 커뮤니티에 공유하고 다른 사람들의 플랜도 구경해보세요.
          </p>
        </div>
      </div>
    </div>
  );
};

