import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { postService } from '../services/postService';
import type { PlanPost } from '../types/index';

export const Posts = () => {
  const [posts, setPosts] = useState<PlanPost[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div>로딩 중...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>공유 게시판</h1>
        <Link to="/plans" style={{ padding: '10px 20px', background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          내 플랜
        </Link>
      </div>
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>아직 공유된 플랜이 없습니다.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {posts.map((post) => (
            <Link key={post.id} to={`/posts/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', cursor: 'pointer', transition: 'box-shadow 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
                <h3>{post.title}</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>작성자: {post.authorNickname}</p>
                <p style={{ color: '#666', fontSize: '14px' }}>날짜: {post.plan.planDate}</p>
                <p style={{ color: '#666', fontSize: '14px' }}>장소 수: {post.plan.places.length}개</p>
                {post.description && <p style={{ marginTop: '10px', fontSize: '14px' }}>{post.description.substring(0, 100)}...</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

