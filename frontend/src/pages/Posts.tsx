import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postService } from '../services/postService';
import { planService } from '../services/planService';
import { authService } from '../services/authService';
import type { PlanPost, PlanPostRequest, Plan } from '../types/index';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const Posts = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PlanPost[]>([]);
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

  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await postService.getAllPosts();
      setPosts(data);
    } catch (err) {
      console.error('게시글 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err: any) {
      console.error('게시글 작성 실패:', err);
      const message = err.response?.data?.message || err.message || '게시글 작성에 실패했습니다.';
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

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">공유 게시판</h1>
            <p className="text-gray-600">다른 사용자들이 공유한 여행 플랜을 확인해보세요</p>
          </div>
          <div className="flex gap-3">
            {isAuthenticated && (
              <Button variant="primary" onClick={handleOpenShareModal} className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                ✨ 게시글 작성하기
              </Button>
            )}
            <Link to="/plans">
              <Button variant="success" className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                내 플랜
              </Button>
            </Link>
          </div>
        </div>

        {posts.length === 0 ? (
          <Card className="text-center py-16 border-2 border-green-200 bg-gradient-to-br from-white to-green-50">
            <div className="text-6xl mb-4">🌱</div>
            <p className="text-xl text-gray-700 mb-2 font-semibold">아직 공유된 플랜이 없습니다.</p>
            <p className="text-gray-600 mb-6">첫 번째 게시글을 작성해보세요!</p>
            {isAuthenticated && (
              <Button variant="primary" onClick={handleOpenShareModal} className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                첫 게시글 작성하기
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} to={`/posts/${post.id}`} className="block transform hover:scale-105 transition-all duration-300">
                <Card className="h-full border-2 border-green-200 hover:border-green-400 bg-gradient-to-br from-white to-green-50/30">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-800 flex-1 pr-2 line-clamp-2">{post.title}</h3>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      📍
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-semibold text-green-600">작성자:</span>
                      <span>{post.authorNickname}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-semibold text-green-600">날짜:</span>
                      <span>{post.plan.planDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-semibold text-green-600">장소:</span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">{post.plan.places.length}개</span>
                    </div>
                  </div>
                  {post.description && (
                    <div className="bg-white/60 rounded-lg p-3 border border-green-100">
                      <p className="text-gray-700 text-sm line-clamp-3">{post.description}</p>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <span className="text-green-600 text-sm font-semibold">자세히 보기 →</span>
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
            className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl border-2 border-green-200"
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

