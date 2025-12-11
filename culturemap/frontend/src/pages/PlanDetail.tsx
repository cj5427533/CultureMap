import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { planService } from '../services/planService';
import { postService } from '../services/postService';
import type { Plan, PlanPostRequest, Place } from '../types/index';
import { KakaoMap } from '../components/KakaoMap';

export const PlanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareForm, setShowShareForm] = useState(false);
  const [shareForm, setShareForm] = useState<PlanPostRequest>({
    planId: 0,
    title: '',
    description: '',
  });
  const [activeTab, setActiveTab] = useState<'itinerary' | 'search'>('itinerary');

  useEffect(() => {
    if (id) {
      loadPlan(parseInt(id));
    }
  }, [id]);

  const loadPlan = async (planId: number) => {
    try {
      const data = await planService.getPlan(planId);
      // visitTime 기준으로 정렬
      const sortedPlaces = [...data.places].sort((a, b) => {
        if (!a.visitTime && !b.visitTime) return (a.visitOrder || 0) - (b.visitOrder || 0);
        if (!a.visitTime) return 1;
        if (!b.visitTime) return -1;
        return a.visitTime.localeCompare(b.visitTime);
      });
      setPlan({ ...data, places: sortedPlaces });
      setShareForm({ ...shareForm, planId: planId, title: data.title || `${data.planDate} 플랜` });
    } catch (err) {
      alert('플랜을 불러오는데 실패했습니다.');
      navigate('/plans');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!plan) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await planService.deletePlan(plan.id);
      navigate('/plans');
    } catch (err) {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;

    try {
      await postService.createPost(shareForm);
      alert('게시글이 등록되었습니다!');
      navigate('/posts');
    } catch (err: any) {
      alert(err.response?.data?.message || '공유에 실패했습니다.');
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    // HH:mm 또는 HH:mm:ss 형식 처리 (24시간 형식)
    const parts = time.split(':');
    if (parts.length < 2) return time;
    
    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1].padStart(2, '0');
    // 24시간 형식으로 표시 (예: 16:30)
    return `${hours}:${minutes}`;
  };

  const calculateDDay = (planDate: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(planDate);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'D-DAY';
    } else if (diffDays > 0) {
      return `D-${diffDays}`;
    } else {
      return `D+${Math.abs(diffDays)}`;
    }
  };

  const getCategoryIcon = (category?: string) => {
    if (!category) return '📍';
    if (category.includes('공항') || category.includes('항공')) return '✈️';
    if (category.includes('관광') || category.includes('명소')) return '📍';
    if (category.includes('음식') || category.includes('식당')) return '🍽️';
    if (category.includes('숙박') || category.includes('호텔')) return '🏨';
    return '📍';
  };

  // Haversine 공식을 사용한 거리 계산 (직선 거리)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // 지구 반지름 (미터)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // 미터 단위
  };

  const calculateTravelTime = (currentPlace: Place, nextPlace: Place): { 
    distance: string; 
    time: string; 
    transportType: 'car' | 'walk';
    transportLabel: string;
  } | null => {
    // 좌표가 없으면 null 반환
    if (!currentPlace.latitude || !currentPlace.longitude || 
        !nextPlace.latitude || !nextPlace.longitude) {
      return null;
    }

    try {
      // Haversine 공식으로 거리 계산 (미터 단위)
      const distanceMeters = calculateDistance(
        currentPlace.latitude,
        currentPlace.longitude,
        nextPlace.latitude,
        nextPlace.longitude
      );
      
      // 거리를 킬로미터로 변환
      const distanceKm = distanceMeters / 1000;
      const distanceStr = distanceKm < 1 
        ? `${Math.round(distanceMeters)}m` 
        : `${distanceKm.toFixed(1)}km`;
      
      // 거리 기준으로 이동 수단 결정 (1.5km 이하는 도보, 이상은 자동차)
      const isWalk = distanceKm <= 1.5;
      const transportType: 'car' | 'walk' = isWalk ? 'walk' : 'car';
      const transportLabel = isWalk ? '도보 이동 (추천)' : '자동차 이동 (추천)';
      
      // 이동 수단별 소요 시간 계산 (더 현실적인 기준)
      let timeMinutes: number;
      if (isWalk) {
        // 도보 기준: 시속 4km (평균 보행 속도, 약 15분/km)
        timeMinutes = Math.round((distanceKm / 4) * 60);
        // 최소 3분 보장
        timeMinutes = Math.max(timeMinutes, 3);
      } else {
        // 자동차 기준: 시속 30km (도심 평균 속도, 신호등 및 교통 체증 고려)
        timeMinutes = Math.round((distanceKm / 30) * 60);
        // 짧은 거리는 최소 시간 보장 (신호 대기, 출발/도착 시간 고려)
        if (distanceKm <= 2) {
          timeMinutes = Math.max(timeMinutes, 5); // 2km 이하는 최소 5분
        } else if (distanceKm <= 5) {
          timeMinutes = Math.max(timeMinutes, 8); // 5km 이하는 최소 8분
        } else {
          timeMinutes = Math.max(timeMinutes, 10); // 그 이상은 최소 10분
        }
      }
      const timeStr = timeMinutes < 1 ? '1분 미만' : `약 ${timeMinutes}분`;
      
      return { 
        distance: distanceStr, 
        time: timeStr,
        transportType,
        transportLabel
      };
    } catch (error) {
      console.error('거리 계산 실패:', error);
      return null;
    }
  };

  const getTransportIcon = (transportType?: 'car' | 'walk') => {
    return transportType === 'walk' ? '🚶' : '🚗';
  };

  if (loading) return <div className="text-center py-12">로딩 중...</div>;
  if (!plan) return <div className="text-center py-12">플랜을 찾을 수 없습니다.</div>;

  // D-DAY 계산
  const dDay = calculateDDay(plan.planDate);

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center">
              <img 
                src="/CultureMap_logo.png" 
                alt="HaeJo 로고" 
                className="h-8 w-auto"
              />
            </Link>
            <span className="text-lg font-medium text-gray-700">내 일정</span>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="max-w-7xl mx-auto mt-4">
          <div className="flex gap-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'itinerary'
                  ? 'text-green-500 border-b-2 border-green-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              일정
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'search'
                  ? 'text-green-500 border-b-2 border-green-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'itinerary' ? (
          <>
            {/* Day 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">{dDay}</h1>
              <Link
                to={`/plans/${plan.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 border border-black rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>수정</span>
              </Link>
            </div>

            {/* 타임라인 */}
            <div className="relative">
              {plan.places.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  등록된 장소가 없습니다.
                </div>
              ) : (
                <div className="relative">
                  {plan.places.map((place, index) => {
                    const nextPlace = plan.places[index + 1];
                    const hasNext = !!nextPlace;
                    const travelInfo = hasNext ? calculateTravelTime(place, nextPlace) : null;
                    
                    return (
                      <div key={place.id} className="relative mb-6">
                        {/* 장소 항목 */}
                        <div className="flex gap-4">
                          {/* 번호 원형 아이콘 */}
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0 shadow-md">
                              {index + 1}
                            </div>
                          </div>

                          {/* 장소 정보 */}
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-2">
                              <span className="text-xl">{getCategoryIcon(place.category)}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="text-sm text-gray-600">
                                    {place.category || '관광지'}
                                  </span>
                                  {place.visitTime && (
                                    <span className="text-lg font-semibold text-gray-900">
                                      {formatTime(place.visitTime)}
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-lg font-semibold mb-1 text-gray-900">{place.name}</h3>
                                {place.address && (
                                  <p className="text-sm text-gray-600">{place.address}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 이동 정보 */}
                        {hasNext && (
                          <div className="flex gap-4 ml-4 mt-2 mb-4">
                            <div className="w-8 flex justify-center">
                              {/* 공백 유지 */}
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-200">
                              {travelInfo ? (
                                <>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{getTransportIcon(travelInfo.transportType)}</span>
                                    <span className="text-sm text-gray-600">{travelInfo.transportLabel}</span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium">
                                      약 {travelInfo.distance}
                                    </span>
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium">
                                      {travelInfo.time}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {place.name}에서 {nextPlace.name}으로 이동
                                  </p>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{getTransportIcon()}</span>
                                    <span className="text-sm text-gray-600">이동</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">거리 정보 없음</span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {place.name}에서 {nextPlace.name}으로 이동
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 액션 버튼들 */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
              <button
                onClick={() => setShowShareForm(!showShareForm)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                공유하기
              </button>
            </div>

            {/* 공유 폼 */}
            {showShareForm && (
              <div className="mt-6 bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">플랜 공유하기</h2>
                <form onSubmit={handleShare}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shareForm.title}
                      onChange={(e) => setShareForm({ ...shareForm, title: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                    <textarea
                      value={shareForm.description}
                      onChange={(e) => setShareForm({ ...shareForm, description: e.target.value })}
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      공유하기
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowShareForm(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 지도 */}
            {plan.places.length > 0 && plan.places.some(p => p.latitude && p.longitude) && (
              <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-4">지도</h2>
                <KakaoMap places={plan.places} height="500px" />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            검색 기능은 준비 중입니다.
          </div>
        )}
      </div>
    </div>
  );
};
