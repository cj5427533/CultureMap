import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { planService } from '../services/planService';
import { historyService } from '../services/historyService';
import type { Plan, History } from '../types/index';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const Plans = () => {
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  
  // 디바운스된 검색 키워드 (500ms 지연)
  const debouncedSearchKeyword = useDebounce(searchKeyword, 500);

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    let filtered = [...allPlans];
    
    // 검색 키워드 필터
    if (debouncedSearchKeyword.trim()) {
      const keyword = debouncedSearchKeyword.toLowerCase();
      filtered = filtered.filter(plan => 
        (plan.title && plan.title.toLowerCase().includes(keyword)) ||
        plan.planDate.includes(keyword) ||
        plan.memberNickname.toLowerCase().includes(keyword) ||
        plan.places.some(place => 
          place.name.toLowerCase().includes(keyword) ||
          (place.address && place.address.toLowerCase().includes(keyword))
        )
      );
    }
    
    setFilteredPlans(filtered);
  }, [allPlans, debouncedSearchKeyword]);

  const loadPlans = async () => {
    try {
      const data = await planService.getMyPlans();
      setAllPlans(data);
      setFilteredPlans(data);
    } catch (err) {
      console.error('플랜 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await planService.deletePlan(id);
      loadPlans();
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  if (loading) return <div className="text-center py-12">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* 시각적 위계와 정렬: 헤더 영역 - 모바일 최적화 */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 lg:mb-12 gap-4 md:gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 md:mb-3">내 플랜</h1>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">나만의 문화생활 플랜을 관리하고 공유해보세요.</p>
          </div>
          {/* 여백과 리듬: 버튼 그룹 */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <Link to="/plans/new" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                새 플랜 만들기
              </Button>
            </Link>
            <Link to="/posts" className="w-full sm:w-auto">
              <Button variant="success" className="w-full sm:w-auto shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                공유 게시판
              </Button>
            </Link>
          </div>
        </div>

        {/* 가독성과 정렬: 플랜 검색 입력창 (디바운스 적용) */}
        <div className="mb-6 md:mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="플랜 제목, 날짜, 장소로 검색..."
              className="w-full px-4 md:px-5 py-3 md:py-3.5 pl-10 md:pl-12 border-2 border-green-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm text-base md:text-lg"
            />
            <svg
              className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 touch-target"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {debouncedSearchKeyword && (
            <p className="mt-3 text-sm md:text-base text-gray-700 font-medium">
              "{debouncedSearchKeyword}" 검색 결과: <span className="text-green-600 font-bold">{filteredPlans.length}개</span>
            </p>
          )}
        </div>

        {/* 리듬과 균형: 내 플랜 목록 */}
        {filteredPlans.length === 0 ? (
          <Card className="text-center py-12 md:py-16 lg:py-20 border-2 border-green-200 bg-gradient-to-br from-white to-green-50">
            <div className="text-5xl md:text-6xl lg:text-7xl mb-4 md:mb-6">🗺️</div>
            <p className="text-xl md:text-2xl text-gray-800 mb-2 md:mb-3 font-bold">아직 플랜이 없습니다.</p>
            <p className="text-base md:text-lg text-gray-700 mb-6 md:mb-8">새로운 여행 플랜을 만들어보세요!</p>
            <Link to="/plans/new" className="inline-block">
              <Button variant="primary" className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                ✨ 첫 플랜 만들기
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-8 md:mb-12">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-xl transition-all transform hover:scale-105 border-2 border-green-200 bg-gradient-to-br from-white to-green-50/30">
                {/* 타이포그래피: 플랜 제목 */}
                <div className="flex items-start justify-between mb-4 md:mb-5">
                  <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 flex-1 pr-2 line-clamp-2 leading-tight">{plan.title || plan.planDate}</h3>
                </div>
                {/* 여백과 정렬: 플랜 정보 */}
                <div className="space-y-2 md:space-y-3 mb-5 md:mb-6">
                  <div className="flex items-center gap-2 md:gap-3 text-sm md:text-base">
                    <span className="font-bold text-green-600">📅 날짜:</span>
                    <span className="text-gray-800 font-semibold">{plan.planDate}</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 text-sm md:text-base">
                    <span className="font-bold text-green-600">📍 장소:</span>
                    <span className="bg-green-100 text-green-700 px-2 md:px-3 py-1 md:py-1.5 rounded-full font-bold">{plan.places.length}개</span>
                  </div>
                </div>
                {/* 일관성: 액션 버튼 - 가로 텍스트로 컴팩트하게 */}
                <div className="flex gap-2 md:gap-1.5 flex-wrap pt-4 md:pt-5 border-t-2 border-green-200">
                  <Link to={`/plans/${plan.id}`} className="flex-1 sm:flex-none">
                    <Button variant="primary" className="w-full sm:w-auto px-3 md:px-2.5 py-2 md:py-1 text-xs md:text-xs shadow-md hover:shadow-lg transform hover:scale-105 transition-all whitespace-nowrap touch-target">
                      👁️ 보기
                    </Button>
                  </Link>
                  <Link to={`/plans/${plan.id}/edit`} className="flex-1 sm:flex-none">
                    <Button variant="warning" className="w-full sm:w-auto px-3 md:px-2.5 py-2 md:py-1 text-xs md:text-xs shadow-md hover:shadow-lg transform hover:scale-105 transition-all whitespace-nowrap touch-target">
                      ✏️ 수정
                    </Button>
                  </Link>
                  <Button variant="danger" onClick={() => handleDelete(plan.id)} className="flex-1 sm:flex-none w-full sm:w-auto px-3 md:px-2.5 py-2 md:py-1 text-xs md:text-xs shadow-md hover:shadow-lg transform hover:scale-105 transition-all whitespace-nowrap touch-target">
                    🗑️ 삭제
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 여백: My History 섹션 - 플랜과 관계없이 항상 표시 */}
        <div className="mt-8 md:mt-12 lg:mt-16 mb-6 md:mb-8">
          <MyHistorySection />
        </div>
      </div>
    </div>
  );
};

// My History 섹션 컴포넌트
const MyHistorySection = () => {
  const [histories, setHistories] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    loadHistories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHistories = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('히스토리 로드 시작...');
      const data = await historyService.getMyHistories();
      console.log('로드된 히스토리 데이터:', data);
      console.log('히스토리 개수:', data?.length || 0);
      setHistories(data || []);
      
      // 히스토리가 없고 특정 이메일인 경우 자동 초기화 시도
      if ((!data || data.length === 0) && !initializing) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user.email === 'cj5427533@o365.jeiu.ac.kr') {
              console.log('히스토리 자동 초기화 시도...');
              setInitializing(true);
              await historyService.initializeHistory();
              console.log('히스토리 초기화 완료, 다시 로드...');
              // 초기화 후 다시 로드
              const newData = await historyService.getMyHistories();
              setHistories(newData || []);
            }
          } catch (e) {
            console.error('히스토리 자동 초기화 실패:', e);
          } finally {
            setInitializing(false);
          }
        }
      }
    } catch (err) {
      console.error('히스토리 로드 실패:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || '히스토리를 불러오는데 실패했습니다.'
        : '히스토리를 불러오는데 실패했습니다.';
      setError(errorMessage);
      setHistories([]);
    } finally {
      setLoading(false);
    }
  };

  // 디버깅 로그
  console.log('MyHistorySection 렌더링:', { loading, error, historiesCount: histories.length });
  
  // 항상 섹션 표시 (플랜과 관계없이) - 더 눈에 띄게
  return (
    <div id="history-section" className="pt-6 md:pt-8 lg:pt-10 border-t-4 border-green-400 bg-gradient-to-br from-white to-green-50 rounded-xl md:rounded-2xl p-6 md:p-8 lg:p-10 shadow-xl">
      {/* 시각적 위계: 섹션 제목 */}
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 md:mb-6 lg:mb-8 flex items-center gap-2 md:gap-3">
        <span className="text-green-500 text-3xl md:text-4xl lg:text-5xl">🎬</span>
        <span>My History</span>
      </h2>
      
      {/* 로딩 중 */}
      {loading && (
        <div className="text-center py-12 text-gray-600">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium">로딩 중...</p>
        </div>
      )}

      {/* 에러 발생 시 */}
      {!loading && error && (
        <div className="text-center py-12 bg-red-50 rounded-lg border-2 border-red-200">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-600 mb-6 font-semibold text-lg">{error}</p>
          <Button variant="secondary" onClick={loadHistories} className="shadow-lg">
            다시 시도
          </Button>
        </div>
      )}

      {/* 히스토리가 없을 때 */}
      {!loading && !error && histories.length === 0 && (
        <div className="text-center py-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
          <p className="text-gray-700 text-xl font-bold">
            아직 등록된 문화생활 히스토리가 없습니다.
          </p>
        </div>
      )}

      {/* 히스토리가 있을 때 */}
      {!loading && !error && histories.length > 0 && (() => {
        const showMoreButton = histories.length > 10;
        const displayHistories = showMoreButton ? histories.slice(0, 10) : histories;

        // 날짜 포맷팅 함수
        const formatDate = (dateString?: string) => {
          if (!dateString) return '';
          try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            return `${year}년 ${month}월 ${day}일`;
          } catch {
            return dateString;
          }
        };

        return (
          <div className="relative">
          {/* PC용 - 포스터를 더 크게 표시하여 공간 활용 */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto pb-4 history-scroll">
              <div className="flex gap-6" style={{ width: 'max-content' }}>
                {/* PC 기준으로 포스터를 더 크게 (약 280px) */}
                {displayHistories.map((history) => (
                  <div
                    key={history.id}
                    className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all transform hover:scale-105 flex-shrink-0"
                    style={{ 
                      width: '280px',
                      minWidth: '280px'
                    }}
                  >
                    <img
                      src={history.imageUrl.startsWith('http') 
                        ? history.imageUrl 
                        : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://culturemap-api.fly.dev'}${history.imageUrl}`}
                      alt={`History ${history.displayOrder}`}
                      className="w-full h-80 object-contain bg-gray-100"
                      onError={(e) => {
                        // placeholder 대신 빈 이미지 또는 기본 이미지 사용
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        // 또는 기본 이미지로 대체
                        // img.src = '/default-history-image.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <div className="text-white opacity-0 group-hover:opacity-100 text-center px-4">
                        {history.eventDate && (
                          <div className="font-bold text-lg mb-1">
                            {formatDate(history.eventDate)}
                          </div>
                        )}
                        {history.location && (
                          <div className="text-base">
                            {history.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* 10개 넘으면 + 버튼 표시 */}
                {showMoreButton && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex-shrink-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg shadow-md hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center group"
                    style={{ 
                      width: '280px',
                      minWidth: '280px',
                      height: '320px'
                    }}
                  >
                    <div className="text-center">
                      <div className="text-6xl text-white font-bold mb-2 group-hover:scale-110 transition-transform">
                        +
                      </div>
                      <div className="text-white text-lg font-semibold">
                        {histories.length - 10}개 더보기
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* 모바일/태블릿용 - 반응형 그리드 */}
          <div className="lg:hidden">
            <div className="overflow-x-auto pb-4 history-scroll">
              <div className="flex gap-4" style={{ width: 'max-content' }}>
                {displayHistories.map((history) => (
                  <div
                    key={history.id}
                    className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all transform hover:scale-105 flex-shrink-0"
                    style={{ 
                      width: '200px',
                      minWidth: '200px'
                    }}
                  >
                    <img
                      src={history.imageUrl.startsWith('http') 
                        ? history.imageUrl 
                        : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://culturemap-api.fly.dev'}${history.imageUrl}`}
                      alt={`History ${history.displayOrder}`}
                      className="w-full h-64 object-contain bg-gray-100"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <div className="text-white opacity-0 group-hover:opacity-100 text-center px-4">
                        {history.eventDate && (
                          <div className="font-bold text-lg mb-1">
                            {formatDate(history.eventDate)}
                          </div>
                        )}
                        {history.location && (
                          <div className="text-base">
                            {history.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {showMoreButton && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex-shrink-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg shadow-md hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center group"
                    style={{ 
                      width: '200px',
                      minWidth: '200px',
                      height: '256px'
                    }}
                  >
                    <div className="text-center">
                      <div className="text-6xl text-white font-bold mb-2 group-hover:scale-110 transition-transform">
                        +
                      </div>
                      <div className="text-white text-lg font-semibold">
                        {histories.length - 10}개 더보기
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        );
      })()}
      
      {/* 전체 보기 모달 */}
      {showModal && (
        <HistoryModal
          histories={histories}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

// History 전체 보기 모달 컴포넌트
const HistoryModal = ({ histories, onClose }: { histories: History[]; onClose: () => void }) => {
  // 날짜 포맷팅 함수
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}년 ${month}월 ${day}일`;
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="sticky top-0 bg-white border-b-2 border-green-300 p-6 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-green-500">🎬</span>
            My History 전체 보기
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all"
          >
            ×
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {histories.map((history) => (
              <div
                key={history.id}
                className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all transform hover:scale-105"
              >
                <img
                  src={history.imageUrl.startsWith('http') 
                    ? history.imageUrl 
                    : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://culturemap-api.fly.dev'}${history.imageUrl}`}
                  alt={`History ${history.displayOrder}`}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <div className="text-white opacity-0 group-hover:opacity-100 text-center px-4">
                    {history.eventDate && (
                      <div className="font-bold text-lg mb-1">
                        {formatDate(history.eventDate)}
                      </div>
                    )}
                    {history.location && (
                      <div className="text-base">
                        {history.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

