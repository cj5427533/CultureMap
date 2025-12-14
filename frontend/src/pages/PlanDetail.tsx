import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { planService } from '../services/planService';
import type { Plan, Place } from '../types/index';
import { KakaoMap } from '../components/KakaoMap';
import { directionService, type DirectionsLatLng } from '../services/directionService';
import { Button } from '../components/ui/Button';

export const PlanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [routePath, setRoutePath] = useState<DirectionsLatLng[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeSummary, setRouteSummary] = useState<{ distanceMeters: number; durationSeconds: number } | null>(null);
  // 각 구간별 경로 정보 저장 (key: "placeId1-placeId2")
  const [segmentRoutes, setSegmentRoutes] = useState<Map<string, { distanceMeters: number; durationSeconds: number }>>(new Map());
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('VIEWER');
  const [submittingInvite, setSubmittingInvite] = useState(false);

  useEffect(() => {
    if (id) {
      loadPlan(parseInt(id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPlan = async (planId: number) => {
    try {
      setLoading(true);
      const data = await planService.getPlan(planId);
      if (!data) {
        throw new Error('플랜 데이터가 없습니다.');
      }
      // visitTime 기준으로 정렬
      const sortedPlaces = [...(data.places || [])].sort((a, b) => {
        if (!a.visitTime && !b.visitTime) return (a.visitOrder || 0) - (b.visitOrder || 0);
        if (!a.visitTime) return 1;
        if (!b.visitTime) return -1;
        return a.visitTime.localeCompare(b.visitTime);
      });
      setPlan({ ...data, places: sortedPlaces });
    } catch (err) {
      console.error('플랜 로드 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '플랜을 불러오는데 실패했습니다.';
      alert(errorMessage);
      navigate('/plans');
    } finally {
      setLoading(false);
    }
  };

  const validPlacesWithCoords = useMemo(
    () => plan?.places.filter(p => p.latitude && p.longitude) ?? [],
    [plan]
  );

  useEffect(() => {
    setRoutePath([]);
    setRouteSummary(null);
    setRouteError(null);
    setRouteLoading(false);
    setSegmentRoutes(new Map());
  }, [plan?.id]);

  const handleRouteRequest = async () => {
    if (!plan) {
      setRouteError('플랜 정보가 없습니다.');
      return;
    }
    if (validPlacesWithCoords.length < 2) {
      setRouteError('경로를 계산하려면 2개 이상의 장소가 필요합니다.');
      return;
    }

    setRouteLoading(true);
    setRouteError(null);
    setRouteSummary(null);
    setRoutePath([]);
    setSegmentRoutes(new Map());

    try {
      // 전체 경로 조회 (지도 표시용)
      const origin = validPlacesWithCoords[0];
      const destination = validPlacesWithCoords[validPlacesWithCoords.length - 1];
      const waypoints =
        validPlacesWithCoords.length > 2
          ? validPlacesWithCoords.slice(1, validPlacesWithCoords.length - 1).map(p => ({
              lat: Number(p.latitude),
              lng: Number(p.longitude),
            }))
          : undefined;

      const fullRouteResult = await directionService.getDirections({
        originLat: Number(origin.latitude),
        originLng: Number(origin.longitude),
        destLat: Number(destination.latitude),
        destLng: Number(destination.longitude),
        waypoints,
      });

      setRoutePath(fullRouteResult.path || []);
      setRouteSummary({
        distanceMeters: fullRouteResult.distanceMeters,
        durationSeconds: fullRouteResult.durationSeconds,
      });

      // 각 구간별 경로 조회 (타임라인 표시용)
      const newSegmentRoutes = new Map<string, { distanceMeters: number; durationSeconds: number }>();
      
      for (let i = 0; i < validPlacesWithCoords.length - 1; i++) {
        const currentPlace = validPlacesWithCoords[i];
        const nextPlace = validPlacesWithCoords[i + 1];
        
        try {
          const segmentResult = await directionService.getDirections({
            originLat: Number(currentPlace.latitude),
            originLng: Number(currentPlace.longitude),
            destLat: Number(nextPlace.latitude),
            destLng: Number(nextPlace.longitude),
          });
          
          const segmentKey = `${currentPlace.id}-${nextPlace.id}`;
          newSegmentRoutes.set(segmentKey, {
            distanceMeters: segmentResult.distanceMeters,
            durationSeconds: segmentResult.durationSeconds,
          });
        } catch (segmentErr) {
          console.warn(`구간 ${i + 1} 경로 조회 실패:`, segmentErr);
          // 개별 구간 실패는 무시하고 계속 진행
        }
      }
      
      setSegmentRoutes(newSegmentRoutes);
    } catch (err) {
      console.error('경로 조회 실패:', err);
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message ||
          (err as { response?: { data?: { message?: string; error?: string } } }).response?.data?.error ||
          (err instanceof Error ? err.message : '경로를 불러오지 못했습니다.')
        : '경로를 불러오지 못했습니다.';
      setRouteError(message);
    } finally {
      setRouteLoading(false);
    }
  };

  const formatDurationMinutes = (seconds?: number) => {
    if (!seconds) return '';
    const minutes = Math.round(seconds / 60);
    if (minutes < 1) return '1분 미만';
    if (minutes < 60) return `약 ${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const remain = minutes % 60;
    return remain === 0 ? `약 ${hours}시간` : `약 ${hours}시간 ${remain}분`;
  };

  // TODO: 삭제 기능이 필요하면 사용
  // const handleDelete = async () => {
  //   if (!plan) return;
  //   if (!confirm('정말 삭제하시겠습니까?')) return;

  //   try {
  //     await planService.deletePlan(plan.id);
  //     navigate('/plans');
  //   } catch (err) {
  //     alert('삭제에 실패했습니다.');
  //   }
  // };

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
    transportType: 'car';
    transportLabel: string;
  } | null => {
    // 좌표가 없으면 null 반환
    if (!currentPlace.latitude || !currentPlace.longitude || 
        !nextPlace.latitude || !nextPlace.longitude) {
      return null;
    }

    try {
      // Directions API 결과가 있으면 우선 사용
      const segmentKey = `${currentPlace.id}-${nextPlace.id}`;
      const apiRoute = segmentRoutes.get(segmentKey);
      
      if (apiRoute) {
        const distanceKm = apiRoute.distanceMeters / 1000;
        const distanceStr = distanceKm < 1 
          ? `${Math.round(apiRoute.distanceMeters)}m` 
          : `${distanceKm.toFixed(1)}km`;
        const timeStr = formatDurationMinutes(apiRoute.durationSeconds);
        
        return {
          distance: distanceStr,
          time: timeStr,
          transportType: 'car',
          transportLabel: '자동차 이동'
        };
      }

      // API 결과가 없으면 직선 거리 기반 추정 (자동차 기준)
      const distanceMeters = calculateDistance(
        currentPlace.latitude,
        currentPlace.longitude,
        nextPlace.latitude,
        nextPlace.longitude
      );
      
      const distanceKm = distanceMeters / 1000;
      const distanceStr = distanceKm < 1 
        ? `${Math.round(distanceMeters)}m` 
        : `${distanceKm.toFixed(1)}km`;
      
      // 자동차 기준: 시속 30km (도심 평균 속도, 신호등 및 교통 체증 고려)
      let timeMinutes = Math.round((distanceKm / 30) * 60);
      // 짧은 거리는 최소 시간 보장
      if (distanceKm <= 2) {
        timeMinutes = Math.max(timeMinutes, 5);
      } else if (distanceKm <= 5) {
        timeMinutes = Math.max(timeMinutes, 8);
      } else {
        timeMinutes = Math.max(timeMinutes, 10);
      }
      const timeStr = timeMinutes < 1 ? '1분 미만' : `약 ${timeMinutes}분`;
      
      return { 
        distance: distanceStr, 
        time: timeStr,
        transportType: 'car',
        transportLabel: '자동차 이동'
      };
    } catch (error) {
      console.error('거리 계산 실패:', error);
      return null;
    }
  };

  const getTransportIcon = () => {
    return '🚗';
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
      </div>

      {/* 여백과 정렬: 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* 시각적 위계: Day 헤더 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 gap-4 md:gap-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">{dDay}</h1>
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <Button
                  variant="success"
                  onClick={() => setShowInviteModal(true)}
                  className="shadow-md hover:shadow-lg w-full sm:w-auto"
                >
                  👥 멤버 초대
                </Button>
                <Link
                  to={`/plans/${plan.id}/edit`}
                  className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 border-2 border-gray-600 rounded-lg md:rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm md:text-base"
                >
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
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
            </div>

            {/* 타이포그래피와 여백: 타임라인 */}
            <div className="relative">
              {plan.places.length === 0 ? (
                <div className="text-center py-12 md:py-16 text-gray-600 text-lg md:text-xl font-medium">
                  등록된 장소가 없습니다.
                </div>
              ) : (
                <div className="relative">
                  {plan.places.map((place, index) => {
                    const nextPlace = plan.places[index + 1];
                    const hasNext = !!nextPlace;
                    const travelInfo = hasNext ? calculateTravelTime(place, nextPlace) : null;
                    
                    return (
                      <div key={place.id} className="relative mb-6 md:mb-8">
                        {/* 장소 항목 */}
                        <div className="flex gap-3 md:gap-4">
                          {/* 대비: 번호 원형 아이콘 */}
                          <div className="flex items-center">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center font-bold text-base md:text-lg flex-shrink-0 shadow-lg">
                              {index + 1}
                            </div>
                          </div>

                          {/* 가독성: 장소 정보 */}
                          <div className="flex-1">
                            <div className="flex items-start gap-3 md:gap-4 mb-2 md:mb-3">
                              <span className="text-2xl md:text-3xl">{getCategoryIcon(place.category)}</span>
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                  <span className="text-sm md:text-base text-gray-600 font-medium">
                                    {place.category || '관광지'}
                                  </span>
                                  {place.visitTime && (
                                    <span className="text-lg md:text-xl font-bold text-gray-900 bg-green-50 px-2 md:px-3 py-1 rounded-md">
                                      {formatTime(place.visitTime)}
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 text-gray-900 leading-tight">{place.name}</h3>
                                {place.address && (
                                  <p className="text-sm md:text-base text-gray-700 leading-relaxed">{place.address}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 리듬: 이동 정보 */}
                        {hasNext && (
                          <div className="flex gap-3 md:gap-4 ml-4 md:ml-6 mt-3 md:mt-4 mb-4 md:mb-6">
                            <div className="w-10 md:w-12 flex justify-center">
                              {/* 공백 유지 */}
                            </div>
                            <div className="flex-1 bg-gradient-to-br from-gray-50 to-green-50 rounded-lg md:rounded-xl p-3 md:p-4 border-2 border-green-400 shadow-sm">
                              {travelInfo ? (
                                <>
                                  <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                    <span className="text-xl md:text-2xl">{getTransportIcon()}</span>
                                    <span className="text-sm md:text-base text-gray-800 font-bold">{travelInfo.transportLabel}</span>
                                  </div>
                                  <div className="flex items-center gap-2 md:gap-3 flex-wrap mb-2 md:mb-3">
                                    <span className="bg-green-100 text-green-700 px-2 md:px-3 py-1 md:py-1.5 rounded-md text-sm md:text-base font-bold">
                                      약 {travelInfo.distance}
                                    </span>
                                    <span className="bg-green-100 text-green-700 px-2 md:px-3 py-1 md:py-1.5 rounded-md text-sm md:text-base font-bold">
                                      {travelInfo.time}
                                    </span>
                                  </div>
                                  <p className="text-sm md:text-base text-gray-700 font-medium leading-relaxed">
                                    {place.name}에서 {nextPlace.name}으로 이동
                                  </p>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                    <span className="text-xl md:text-2xl">{getTransportIcon()}</span>
                                    <span className="text-sm md:text-base text-gray-700 font-medium">자동차 이동</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs md:text-sm text-gray-500">거리 정보 없음</span>
                                  </div>
                                  <p className="text-sm md:text-base text-gray-700 mt-2 leading-relaxed">
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

            {/* 지도 & 경로 */}
            {plan.places.length > 0 && plan.places.some(p => p.latitude && p.longitude) && (
              <div className="mt-8 bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                <div className="mb-4">
                  <h2 className="text-lg md:text-xl font-bold">지도</h2>
                </div>
                <KakaoMap places={plan.places} height="400px" routePath={routePath} />
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-semibold">자동차</span>
                    {routeSummary ? (
                      <>
                        <span className="text-gray-800 font-medium">
                          {(routeSummary.distanceMeters / 1000).toFixed(1)} km
                        </span>
                        <span className="text-gray-600">{formatDurationMinutes(routeSummary.durationSeconds)}</span>
                        {routePath.length > 0 && <span className="text-gray-500">실제 도로 경로</span>}
                      </>
                    ) : (
                      <span className="text-gray-500">경로 보기 버튼을 눌러주세요.</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {routeError && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                        {routeError}
                      </div>
                    )}
                    <button
                      onClick={handleRouteRequest}
                      disabled={routeLoading || validPlacesWithCoords.length < 2}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        routeLoading || validPlacesWithCoords.length < 2
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {routeLoading ? '경로 불러오는 중...' : '자동차 경로 보기'}
                    </button>
                  </div>
                </div>
              </div>
            )}
      </div>

      {/* 멤버 초대 모달 */}
      {showInviteModal && plan && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowInviteModal(false)}
        >
          <div 
            className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 max-w-md w-full mx-2 md:mx-4 max-h-[90vh] md:max-h-[80vh] overflow-y-auto shadow-2xl border-2 border-green-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-green-200">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-green-500">👥</span>
                멤버 초대
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-green-600 text-3xl transition-colors"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!plan || !inviteEmail.trim()) {
                  alert('이메일을 입력해주세요.');
                  return;
                }

                setSubmittingInvite(true);
                try {
                  await planService.inviteMember({
                    planId: plan.id,
                    email: inviteEmail.trim(),
                    role: inviteRole,
                  });
                  alert('멤버가 초대되었습니다!');
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteRole('VIEWER');
                } catch (err) {
                  console.error('멤버 초대 실패:', err);
                  const errorMessage = err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 
                      (err instanceof Error ? err.message : '멤버 초대에 실패했습니다.')
                    : '멤버 초대에 실패했습니다.';
                  alert(errorMessage);
                } finally {
                  setSubmittingInvite(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  placeholder="초대할 사용자의 이메일"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  권한 <span className="text-red-500">*</span>
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                >
                  <option value="VIEWER">조회만 가능 (VIEWER)</option>
                  <option value="EDITOR">수정 가능 (EDITOR)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1"
                  disabled={submittingInvite}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={submittingInvite}
                >
                  {submittingInvite ? '초대 중...' : '초대하기'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
