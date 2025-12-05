import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { postService } from '../services/postService';
import type { PlanPost } from '../types/index';
import { authService } from '../services/authService';
import { KakaoMap } from '../components/KakaoMap';

export const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PlanPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPost(parseInt(id));
    }
  }, [id]);

  const loadPost = async (postId: number) => {
    try {
      const data = await postService.getPost(postId);
      setPost(data);
    } catch (err) {
      alert('게시글을 불러오는데 실패했습니다.');
      navigate('/posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await postService.deletePost(post.id);
      navigate('/posts');
    } catch (err) {
      alert('삭제에 실패했습니다.');
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (!post) return <div>게시글을 찾을 수 없습니다.</div>;

  const user = authService.getCurrentUser();
  const isAuthor = user && user.email === post.authorNickname;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/posts" style={{ color: '#007bff', textDecoration: 'none' }}>← 게시판으로</Link>
      </div>
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '30px', marginBottom: '20px' }}>
        <h1>{post.title}</h1>
        <div style={{ color: '#666', marginBottom: '20px' }}>
          <p>작성자: {post.authorNickname}</p>
          <p>작성일: {new Date(post.createdAt).toLocaleString('ko-KR')}</p>
          <p>플랜 날짜: {post.plan.planDate}</p>
        </div>
        {post.description && (
          <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
            <p style={{ whiteSpace: 'pre-wrap' }}>{post.description}</p>
          </div>
        )}
        {isAuthor && (
          <div style={{ marginTop: '20px' }}>
            <button onClick={handleDelete} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              삭제
            </button>
          </div>
        )}
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '30px', marginBottom: '20px' }}>
        <h2>플랜 상세</h2>
        <p><strong>날짜:</strong> {post.plan.planDate}</p>
        {post.plan.title && <p><strong>제목:</strong> {post.plan.title}</p>}
        <h3 style={{ marginTop: '20px' }}>방문 장소 ({post.plan.places.length}개)</h3>
        <div style={{ marginTop: '15px' }}>
          {post.plan.places.map((place, index) => (
            <div key={place.id} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '5px', marginBottom: '10px' }}>
              <h4>{index + 1}. {place.name}</h4>
              {place.address && <p style={{ color: '#666', margin: '5px 0' }}>주소: {place.address}</p>}
              {place.category && <p style={{ color: '#666', margin: '5px 0' }}>카테고리: {place.category}</p>}
              {place.description && <p style={{ marginTop: '10px' }}>{place.description}</p>}
              {place.latitude && place.longitude && (
                <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                  위치: {place.latitude}, {place.longitude}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {post.plan.places.length > 0 && post.plan.places.some(p => p.latitude && p.longitude) && (
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '30px' }}>
          <h2>지도</h2>
          <div style={{ marginTop: '15px' }}>
            <KakaoMap places={post.plan.places} height="500px" />
          </div>
        </div>
      )}
    </div>
  );
};

