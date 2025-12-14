import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { postService } from '../services/postService';
import { planService } from '../services/planService';
import { authService } from '../services/authService';
import type { PlanPost, PlanPostRequest, Plan } from '../types/index';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const Posts = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PlanPost[]>([]);
  const [allPosts, setAllPosts] = useState<PlanPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [myPlans, setMyPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [shareForm, setShareForm] = useState<PlanPostRequest>({
    planId: 0,
    title: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  
  // 디바운스된 검색 키워드 (500ms 지연)
  const debouncedSearchKeyword = useDebounce(searchKeyword, 500);

  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await postService.getAllPosts();
      setAllPosts(data);
      setPosts(data);
    } catch (err) {
      console.error('게시글 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 디바운스된 검색 키워드로 게시글 필터링
  useEffect(() => {
    if (!debouncedSearchKeyword.trim()) {
      setPosts(allPosts);
      return;
    }

    const filtered = allPosts.filter(post => {
      const keyword = debouncedSearchKeyword.toLowerCase();
      return (
        post.title.toLowerCase().includes(keyword) ||
        (post.description && post.description.toLowerCase().includes(keyword)) ||
        post.authorNickname.toLowerCase().includes(keyword) ||
        post.plan.title?.toLowerCase().includes(keyword)
      );
    });
    setPosts(filtered);
  }, [debouncedSearchKeyword, allPosts]);

  const handleOpenShareModal = async () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    setShowShareModal(true);
    setLoadingPlans(true);
    try {
      const plans = await planService.getMyPlans();
      setMyPlans(plans);
    } catch (err) {
      console.error('플랜 로드 실패:', err);
      alert('내 플랜을 불러오는데 실패했습니다.');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlanId(plan.id);
    setShareForm({
      planId: plan.id,
      title: plan.title || `${plan.planDate} 플랜`,
      description: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) {
      alert('플랜을 선택해주세요.');
      return;
    }
    if (!shareForm.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const createdPost = await postService.createPost(shareForm);
      alert('게시글이 등록되었습니다!');
      setShowShareModal(false);
      setSelectedPlanId(null);
      setShareForm({ planId: 0, title: '', description: '' });
      loadPosts();
      navigate(`/posts/${createdPost.id}`);
    } catch (err) {
      console.error('게시글 작성 실패:', err);
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 
          (err instanceof Error ? err.message : '게시글 작성에 실패했습니다.')
        : '게시글 작성에 실패했습니다.';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowShareModal(false);
    setSelectedPlanId(null);
    setShareForm({ planId: 0, title: '', description: '' });
  };

  if (loading) return <div className="text-center py-12">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 shadow-md">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center">
              <img 
                src="/CultureMap_logo.png" 
                alt="컬처맵 로고" 
                className="h-8 w-auto"
              />
            </Link>
            <span className="text-lg font-semibold text-white">공유 게시판</span>
          </div>
        </div>
      </div>

      {/* 여백과 정렬: 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* 시각적 위계: 헤더 영역 */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 lg:mb-12 gap-4 md:gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 md:mb-3">공유 게시판</h1>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">다른 사용자들이 공유한 여행 플랜을 확인해보세요</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            {isAuthenticated && (
              <Button variant="primary" onClick={handleOpenShareModal} className="w-full sm:w-auto shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                ✨ 게시글 작성하기
              </Button>
            )}
            <Link to="/plans" className="w-full sm:w-auto">
              <Button variant="success" className="w-full sm:w-auto shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                내 플랜
              </Button>
            </Link>
          </div>
        </div>

        {/* 가독성과 정렬: 게시글 검색 입력창 (디바운스 적용) */}
        <div className="mb-6 md:mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="제목, 내용, 작성자로 검색..."
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
              "{debouncedSearchKeyword}" 검색 결과: <span className="text-green-600 font-bold">{posts.length}개</span>
            </p>
          )}
        </div>

        {/* 리듬과 균형: 게시글 목록 */}
        {posts.length === 0 ? (
          <Card className="text-center py-12 md:py-16 lg:py-20 border-2 border-green-200 bg-gradient-to-br from-white to-green-50">
            <div className="text-5xl md:text-6xl lg:text-7xl mb-4 md:mb-6">🌱</div>
            <p className="text-xl md:text-2xl text-gray-800 mb-2 md:mb-3 font-bold">아직 공유된 플랜이 없습니다.</p>
            <p className="text-base md:text-lg text-gray-700 mb-6 md:mb-8">첫 번째 게시글을 작성해보세요!</p>
            {isAuthenticated && (
              <Button variant="primary" onClick={handleOpenShareModal} className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                첫 게시글 작성하기
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {posts.map((post) => (
              <Link key={post.id} to={`/posts/${post.id}`} className="block transform hover:scale-105 transition-all duration-300">
                <Card className="h-full border-2 border-green-200 hover:border-green-400 bg-gradient-to-br from-white to-green-50/30">
                  {/* 타이포그래피: 게시글 제목 */}
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 flex-1 pr-2 line-clamp-2 leading-tight">{post.title}</h3>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm md:text-base flex-shrink-0 shadow-md">
                      📍
                    </div>
                  </div>
                  {/* 여백과 정렬: 게시글 정보 */}
                  <div className="space-y-2 md:space-y-3 mb-4 md:mb-5">
                    <div className="flex items-center gap-2 md:gap-3 text-sm md:text-base text-gray-700">
                      <span className="font-bold text-green-600">작성자:</span>
                      <span className="font-semibold">{post.authorNickname}</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 text-sm md:text-base text-gray-700">
                      <span className="font-bold text-green-600">날짜:</span>
                      <span className="font-semibold">{post.plan.planDate}</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 text-sm md:text-base text-gray-700">
                      <span className="font-bold text-green-600">장소:</span>
                      <span className="bg-green-100 text-green-700 px-2 md:px-3 py-1 md:py-1.5 rounded-full font-bold">{post.plan.places.length}개</span>
                    </div>
                  </div>
                  {/* 가독성: 게시글 설명 */}
                  {post.description && (
                    <div className="bg-white/60 rounded-lg md:rounded-xl p-3 md:p-4 border border-green-100 mb-4 md:mb-5">
                      <p className="text-gray-700 text-sm md:text-base line-clamp-3 leading-relaxed">{post.description}</p>
                    </div>
                  )}
                  {/* 대비: 링크 표시 */}
                  <div className="mt-4 md:mt-5 pt-4 md:pt-5 border-t-2 border-green-200">
                    <span className="text-green-600 text-sm md:text-base font-bold">자세히 보기 →</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 플랜 공유 모달 */}
      {showShareModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 max-w-2xl w-full mx-2 md:mx-4 max-h-[90vh] md:max-h-[80vh] overflow-y-auto shadow-2xl border-2 border-green-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-green-200">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-green-500">✨</span>
                내 플래너 공유하기
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-green-600 text-3xl transition-colors"
              >
                ×
              </button>
            </div>

            {loadingPlans ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mb-4"></div>
                <p className="text-gray-600 text-lg">플랜을 불러오는 중...</p>
              </div>
            ) : myPlans.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-700 text-lg mb-2 font-semibold">공유할 플랜이 없습니다.</p>
                <p className="text-gray-600 mb-6">새로운 플랜을 만들어보세요!</p>
                <Link to="/plans/new">
                  <Button variant="primary" className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                    새 플랜 만들기
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 플랜 선택 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-green-600">📍</span>
                    공유할 플랜 선택 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3 max-h-60 overflow-y-auto border-2 border-green-200 rounded-xl p-3 bg-green-50/30">
                    {myPlans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => handlePlanSelect(plan)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all transform hover:scale-[1.02] ${
                          selectedPlanId === plan.id
                            ? 'border-green-500 bg-gradient-to-r from-green-100 to-emerald-100 shadow-lg'
                            : 'border-green-200 hover:border-green-400 hover:bg-green-50 bg-white'
                        }`}
                      >
                        <div className="font-bold text-gray-900 text-lg mb-1">
                          {plan.title || `${plan.planDate} 플랜`}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-3 mt-2">
                          <span className="bg-white px-2 py-1 rounded-md">📅 {plan.planDate}</span>
                          <span className="bg-white px-2 py-1 rounded-md">📍 장소 {plan.places.length}개</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 제목 입력 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-green-600">✏️</span>
                    게시글 제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shareForm.title}
                    onChange={(e) => setShareForm({ ...shareForm, title: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all"
                    placeholder="예: 인천 데이트 코스 추천"
                  />
                </div>

                {/* 설명 입력 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-green-600">📝</span>
                    게시글 설명 (선택사항)
                  </label>
                  <textarea
                    value={shareForm.description}
                    onChange={(e) => setShareForm({ ...shareForm, description: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all resize-none"
                    placeholder="이 플랜에 대한 설명을 작성해주세요..."
                  />
                </div>

                {/* 선택된 플랜 미리보기 */}
                {selectedPlanId && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-300 shadow-md">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-green-600">✅</span>
                      선택된 플랜 정보
                    </h3>
                    {myPlans.find(p => p.id === selectedPlanId) && (
                      <>
                        <div className="space-y-2 mb-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold text-green-700">날짜:</span> {myPlans.find(p => p.id === selectedPlanId)!.planDate}
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold text-green-700">장소:</span> <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full font-bold">{myPlans.find(p => p.id === selectedPlanId)!.places.length}개</span>
                          </p>
                        </div>
                        {myPlans.find(p => p.id === selectedPlanId)!.places.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-green-300">
                            <p className="text-sm font-semibold text-gray-700 mb-2">방문 장소:</p>
                            <ul className="text-sm text-gray-600 space-y-1 bg-white rounded-lg p-3">
                              {myPlans.find(p => p.id === selectedPlanId)!.places.slice(0, 3).map((place, idx) => (
                                <li key={place.id} className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                  {place.name}
                                </li>
                              ))}
                              {myPlans.find(p => p.id === selectedPlanId)!.places.length > 3 && (
                                <li className="text-gray-500 italic">... 외 {myPlans.find(p => p.id === selectedPlanId)!.places.length - 3}개</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* 버튼 */}
                <div className="flex gap-3 pt-4 border-t-2 border-green-200">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCloseModal}
                    className="flex-1 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                    disabled={submitting}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                    disabled={submitting || !selectedPlanId}
                  >
                    {submitting ? '작성 중...' : '✨ 게시글 작성'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

