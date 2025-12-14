import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { postService } from '../services/postService';
import { commentService } from '../services/commentService';
import type { PlanPost, PlanPostRequest, Comment } from '../types/index';
import { authService } from '../services/authService';
import { KakaoMap } from '../components/KakaoMap';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PlanPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<PlanPostRequest>({
    planId: 0,
    title: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentRating, setCommentRating] = useState<number | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (id) {
      loadPost(parseInt(id));
      loadComments(parseInt(id));
      setShareUrl(`${window.location.origin}/posts/${id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // OG 태그 동적 추가
  useEffect(() => {
    if (!post) return;

    // 기존 OG 태그 제거
    const existingOgTags = document.querySelectorAll('meta[property^="og:"]');
    existingOgTags.forEach(tag => tag.remove());

    // OG 태그 추가
    const addMetaTag = (property: string, content: string) => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', property);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    };

    addMetaTag('og:title', post.title);
    addMetaTag('og:description', post.description || `${post.plan.planDate} 플랜 - ${post.plan.places.length}개 장소`);
    addMetaTag('og:url', shareUrl);
    addMetaTag('og:type', 'article');
    addMetaTag('og:site_name', '컬처맵');
    // 이미지는 로고 또는 기본 이미지 사용 (카카오 지도 API는 API 키 필요)
    addMetaTag('og:image', `${window.location.origin}/CultureMap_logo.png`);
    addMetaTag('og:image:width', '1200');
    addMetaTag('og:image:height', '630');

    return () => {
      // cleanup: 컴포넌트 언마운트 시 OG 태그 제거
      const ogTags = document.querySelectorAll('meta[property^="og:"]');
      ogTags.forEach(tag => tag.remove());
    };
  }, [post, shareUrl]);

  const loadPost = async (postId: number) => {
    try {
      setLoading(true);
      const data = await postService.getPost(postId);
      if (!data) {
        throw new Error('게시글 데이터가 없습니다.');
      }
      setPost(data);
    } catch (err) {
      console.error('게시글 로드 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '게시글을 불러오는데 실패했습니다.';
      alert(errorMessage);
      navigate('/posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!post) {
      alert('게시글 정보가 없습니다.');
      return;
    }
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await postService.deletePost(post.id);
      navigate('/posts');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '삭제에 실패했습니다.';
      alert(errorMessage);
    }
  };

  const handleOpenEditModal = () => {
    if (!post) return;
    setEditForm({
      planId: post.planId,
      title: post.title,
      description: post.description || '',
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditForm({ planId: 0, title: '', description: '' });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    if (!editForm.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const updatedPost = await postService.updatePost(post.id, editForm);
      setPost(updatedPost);
      setShowEditModal(false);
      alert('게시글이 수정되었습니다!');
    } catch (err) {
      console.error('게시글 수정 실패:', err);
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 
          (err instanceof Error ? err.message : '게시글 수정에 실패했습니다.')
        : '게시글 수정에 실패했습니다.';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const loadComments = async (postId: number) => {
    setLoadingComments(true);
    try {
      const data = await commentService.getComments(postId);
      setComments(data || []);
    } catch (err) {
      console.error('댓글 로드 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '댓글을 불러오는데 실패했습니다.';
      // 댓글 로드 실패는 사용자에게 알리지 않고 빈 배열로 처리
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };


  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await commentService.createComment({ 
        postId: post.id, 
        content: newComment.trim(),
        rating: commentRating || undefined
      });
      setNewComment('');
      setCommentRating(null);
      loadComments(post.id);
      // 게시글 정보도 새로고침하여 평균 별점 업데이트
      const updatedPost = await postService.getPost(post.id);
      setPost(updatedPost);
    } catch (err) {
      console.error('댓글 작성 실패:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || '댓글 작성에 실패했습니다.'
        : '댓글 작성에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    if (!post) return;

    try {
      await commentService.deleteComment(commentId);
      loadComments(post.id);
    } catch (err) {
      console.error('댓글 삭제 실패:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || '댓글 삭제에 실패했습니다.'
        : '댓글 삭제에 실패했습니다.';
      alert(errorMessage);
    }
  };


  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('링크가 클립보드에 복사되었습니다!');
    }).catch(() => {
      alert('링크 복사에 실패했습니다.');
    });
  };

  const getCategoryIcon = (category?: string) => {
    if (!category) return '📍';
    if (category.includes('공항') || category.includes('항공')) return '✈️';
    if (category.includes('관광') || category.includes('명소')) return '📍';
    if (category.includes('음식') || category.includes('식당')) return '🍽️';
    if (category.includes('숙박') || category.includes('호텔')) return '🏨';
    return '📍';
  };

  if (loading) return <div className="text-center py-12">로딩 중...</div>;
  if (!post) return <div className="text-center py-12">게시글을 찾을 수 없습니다.</div>;

  const user = authService.getCurrentUser();
  const isAuthor = user && user.nickname === post.authorNickname;
  const isAdmin = user && user.role === 'ADMIN';
  const canEdit = isAuthor || isAdmin;

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
            <Link to="/posts" className="text-lg font-semibold text-white hover:text-green-100 transition-colors flex items-center gap-2">
              <span>←</span> 공유 게시판
            </Link>
          </div>
        </div>
      </div>

      {/* 여백과 정렬: 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* 타이포그래피: 게시글 정보 */}
        <Card className="mb-6 md:mb-8 border-2 border-green-200 bg-gradient-to-br from-white to-green-50/30">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 md:mb-8 gap-4 md:gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-900 leading-tight">{post.title}</h1>
              <div className="flex flex-wrap gap-3 md:gap-4 text-sm md:text-base mb-4 md:mb-6">
                <div className="flex items-center gap-2 bg-green-100 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-green-200">
                  <span className="text-green-700 font-bold">👤 작성자:</span>
                  <span className="text-gray-900 font-bold">{post.authorNickname}</span>
                </div>
                <div className="flex items-center gap-2 bg-green-100 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-green-200">
                  <span className="text-green-700 font-bold">📅 작성일:</span>
                  <span className="text-gray-800 font-semibold">{new Date(post.createdAt).toLocaleString('ko-KR')}</span>
                </div>
                <div className="flex items-center gap-2 bg-green-100 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-green-200">
                  <span className="text-green-700 font-bold">🗓️ 플랜 날짜:</span>
                  <span className="text-gray-900 font-bold">{post.plan.planDate}</span>
                </div>
              </div>
            </div>
            {/* 정렬: 액션 버튼 - 모바일 최적화 */}
            <div className="flex flex-wrap gap-2 md:gap-3">
              <Button variant="success" onClick={handleCopyShareLink} className="shadow-md hover:shadow-lg transform hover:scale-105 transition-all text-xs md:text-sm touch-target min-h-[44px] md:min-h-0">
                🔗 공유하기
              </Button>
              {canEdit && (
                <>
                  <Button variant="warning" onClick={handleOpenEditModal} className="shadow-md hover:shadow-lg transform hover:scale-105 transition-all text-xs md:text-sm touch-target min-h-[44px] md:min-h-0">
                    ✏️ 수정
                  </Button>
                  <Button variant="danger" onClick={handleDelete} className="shadow-md hover:shadow-lg transform hover:scale-105 transition-all text-xs md:text-sm touch-target min-h-[44px] md:min-h-0">
                    🗑️ 삭제
                  </Button>
                </>
              )}
            </div>
          </div>
          {/* 가독성: 게시글 설명 */}
          {post.description && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl md:rounded-2xl p-4 md:p-5 lg:p-6 border-2 border-green-200 mb-4 md:mb-6">
              <p className="text-base md:text-lg text-gray-800 whitespace-pre-wrap leading-relaxed">{post.description}</p>
            </div>
          )}
          {/* 대비: 평균 별점 표시 */}
          {post.averageRating && (
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t-2 border-green-200">
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <span className="text-sm md:text-base font-bold text-gray-800">평균 별점:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-2xl md:text-3xl ${
                        star <= Math.round(post.averageRating!)
                          ? 'text-yellow-400'
                          : 'text-gray-200'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm md:text-base text-gray-700 font-bold">
                  {post.averageRating.toFixed(1)}점 ({post.ratingCount || 0}명 평가)
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* 리듬: 플랜 상세 */}
        <Card className="mb-6 md:mb-8 border-2 border-green-200 bg-gradient-to-br from-white to-green-50/30">
          <div className="mb-6 md:mb-8 pb-4 md:pb-6 border-b-2 border-green-200">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
              <span className="text-green-500 text-3xl md:text-4xl">🗺️</span>
              <span>플랜 상세</span>
            </h2>
          </div>
          {/* 여백과 정렬: 플랜 정보 */}
          <div className="mb-6 md:mb-8 flex flex-wrap gap-3 md:gap-4">
            <div className="bg-green-100 px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl border border-green-200">
              <p className="text-gray-800 text-sm md:text-base">
                <span className="font-bold text-green-700">날짜:</span> <span className="font-bold text-gray-900">{post.plan.planDate}</span>
              </p>
            </div>
            {post.plan.title && (
              <div className="bg-green-100 px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl border border-green-200">
                <p className="text-gray-800 text-sm md:text-base">
                  <span className="font-bold text-green-700">제목:</span> <span className="font-bold text-gray-900">{post.plan.title}</span>
                </p>
              </div>
            )}
          </div>
          <div className="mb-4 md:mb-6 pb-3 md:pb-4 border-b-2 border-green-200">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
              <span className="text-green-500 text-2xl md:text-3xl">📍</span>
              <span>방문 장소</span> <span className="bg-green-500 text-white px-3 md:px-4 py-1 md:py-1.5 rounded-full text-base md:text-lg font-bold">{post.plan.places.length}개</span>
            </h3>
          </div>
          {/* 리듬: 장소 목록 */}
          <div className="space-y-4 md:space-y-6">
            {post.plan.places.map((place, index) => (
              <div key={place.id} className="border-2 border-green-200 rounded-xl md:rounded-2xl p-4 md:p-5 lg:p-6 hover:border-green-400 hover:shadow-lg bg-gradient-to-r from-white to-green-50/50 transition-all transform hover:scale-[1.01]">
                <div className="flex items-start gap-3 md:gap-4">
                  {/* 대비: 번호 아이콘 */}
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center font-bold text-lg md:text-xl flex-shrink-0 shadow-lg">
                    {index + 1}
                  </div>
                  {/* 가독성: 장소 정보 */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-3">
                      <span className="text-2xl md:text-3xl">{getCategoryIcon(place.category)}</span>
                      <h4 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{place.name}</h4>
                    </div>
                    {place.address && (
                      <div className="flex items-start gap-2 mb-2 md:mb-3">
                        <span className="text-green-600 font-bold text-sm md:text-base mt-0.5">📍</span>
                        <p className="text-sm md:text-base text-gray-700 leading-relaxed">{place.address}</p>
                      </div>
                    )}
                    {place.category && (
                      <div className="flex items-center gap-2 mb-2 md:mb-3">
                        <span className="bg-green-200 text-green-800 px-2 md:px-3 py-1 rounded-md text-xs md:text-sm font-bold">{place.category}</span>
                      </div>
                    )}
                    {place.description && (
                      <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-green-200">
                        <p className="text-sm md:text-base text-gray-700 leading-relaxed">{place.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 지도 */}
        {post.plan.places.length > 0 && post.plan.places.some(p => p.latitude && p.longitude) && (
          <Card className="border-2 border-green-200 bg-gradient-to-br from-white to-green-50/30">
            <div className="mb-4 pb-4 border-b-2 border-green-200">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-green-500">🗺️</span>
                지도
              </h2>
            </div>
            <div className="rounded-xl overflow-hidden border-2 border-green-200 shadow-lg">
              <KakaoMap places={post.plan.places} height="400px" />
            </div>
          </Card>
        )}

        {/* 댓글 섹션 */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-white to-green-50/30">
          <div className="mb-6 pb-4 border-b-2 border-green-200">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-green-500">💬</span>
              댓글 {comments.length > 0 && <span className="text-lg text-gray-600">({comments.length})</span>}
            </h2>
          </div>

          {/* 댓글 작성 폼 */}
          {authService.isAuthenticated() ? (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <div className="space-y-3">
                {/* 별점 선택 */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">별점:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCommentRating(star)}
                        className={`text-2xl transition-transform hover:scale-125 ${
                          commentRating && star <= commentRating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        } cursor-pointer`}
                        title={`${star}점`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {commentRating && (
                    <span className="text-sm text-gray-600">({commentRating}점 선택됨)</span>
                  )}
                  <span className="text-xs text-gray-500">(선택사항)</span>
                </div>
                {/* 댓글 입력 */}
                <div className="flex gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    rows={3}
                    className="flex-1 px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white resize-none"
                    required
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submittingComment || !newComment.trim()}
                    className="self-start shadow-md hover:shadow-lg"
                  >
                    {submittingComment ? '작성 중...' : '작성'}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
              <p className="text-gray-600 mb-2">댓글을 작성하려면 로그인이 필요합니다.</p>
              <Link to="/login">
                <Button variant="primary" className="text-sm">로그인하기</Button>
              </Link>
            </div>
          )}

          {/* 댓글 목록 */}
          {loadingComments ? (
            <div className="text-center py-8">
              <p className="text-gray-600">댓글을 불러오는 중...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="border-2 border-green-200 rounded-xl p-4 bg-white hover:border-green-400 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{comment.authorNickname}</span>
                      {comment.rating && (
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${
                                star <= comment.rating!
                                  ? 'text-yellow-400'
                                  : 'text-gray-200'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString('ko-KR')}
                      </span>
                      {comment.createdAt !== comment.updatedAt && (
                        <span className="text-xs text-gray-400">(수정됨)</span>
                      )}
                    </div>
                    {comment.isAuthor && (
                      <Button
                        variant="danger"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs py-2 px-3 touch-target min-h-[44px]"
                      >
                        삭제
                      </Button>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 게시글 수정 모달 */}
      {showEditModal && post && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={handleCloseEditModal}
        >
          <div 
            className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 max-w-2xl w-full mx-2 md:mx-4 max-h-[90vh] md:max-h-[80vh] overflow-y-auto shadow-2xl border-2 border-green-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-green-200">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-green-500">✏️</span>
                게시글 수정
              </h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-green-600 text-3xl transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              {/* 제목 입력 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-green-600">✏️</span>
                  게시글 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all"
                  placeholder="게시글 제목을 입력하세요"
                />
              </div>

              {/* 설명 입력 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-green-600">📝</span>
                  게시글 설명 (선택사항)
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all resize-none"
                  placeholder="게시글 설명을 입력하세요..."
                />
              </div>

              {/* 플랜 정보 (읽기 전용) */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-300">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-green-600">ℹ️</span>
                  연결된 플랜 정보
                </h3>
                <div className="space-y-2 mb-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-green-700">날짜:</span> {post.plan.planDate}
                  </p>
                  {post.plan.title && (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-green-700">제목:</span> {post.plan.title}
                    </p>
                  )}
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-green-700">장소:</span> <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full font-bold">{post.plan.places.length}개</span>
                  </p>
                </div>
                <p className="text-xs text-gray-600 italic bg-white px-3 py-2 rounded-lg">※ 플랜 정보는 변경할 수 없습니다.</p>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4 border-t-2 border-green-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseEditModal}
                  className="flex-1 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  disabled={submitting}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  disabled={submitting}
                >
                  {submitting ? '수정 중...' : '✅ 수정 완료'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

