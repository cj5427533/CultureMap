import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useGeolocation } from '../hooks/useGeolocation';
import { useDebounce } from '../hooks/useDebounce';
import { kakaoLocalService, type KakaoPlace } from '../services/kakaoLocalService';
import { placeService } from '../services/placeService';
import { planService } from '../services/planService';
import { authService } from '../services/authService';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import type { Place, Plan } from '../types/index';

// Kakao Maps 타입은 types/kakao.d.ts에서 정의됨

export const HomeMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<InstanceType<Window['kakao']['maps']['Map']> | null>(null);
  const markersRef = useRef<InstanceType<Window['kakao']['maps']['Marker']>[]>([]);
  const infoWindowsRef = useRef<InstanceType<Window['kakao']['maps']['InfoWindow']>[]>([]);
  const { latitude, longitude, error: geoError, loading: geoLoading } = useGeolocation();
  const [nearbyPlaces, setNearbyPlaces] = useState<KakaoPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlace | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [planTitle, setPlanTitle] = useState<string>('');
  const [addingToPlan, setAddingToPlan] = useState(false);
  const [modalStep, setModalStep] = useState<'date' | 'plan-select' | 'plan-create' | 'time'>('date');
  const [existingPlans, setExistingPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [distanceFilter, setDistanceFilter] = useState<number>(3000); // 기본 반경 3km
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [filteredPlaces, setFilteredPlaces] = useState<KakaoPlace[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  
  // 디바운스된 검색 키워드 (500ms 지연)
  const debouncedSearchKeyword = useDebounce(searchKeyword, 500);

  // 필터 적용 함수
  const applyFilters = useCallback((places: KakaoPlace[]) => {
    let filtered = [...places];

    // 카테고리 필터
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(place => 
        place.category_name.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    // 거리 필터는 이미 API 호출 시 반경으로 제한되므로 여기서는 정렬만 수행
    setFilteredPlaces(filtered);
  }, [categoryFilter]);


  const loadNearbyPlaces = useCallback(async (lat: number, lng: number, radius: number = 3000) => {
    setLoading(true);
    setError(null);

    try {
      const places = await kakaoLocalService.searchNearbyCulturePlaces(lat, lng, radius);
      setNearbyPlaces(places);
      applyFilters(places);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '주변 문화시설을 불러오는데 실패했습니다.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [applyFilters]);

  // 필터 변경 시 필터 적용
  useEffect(() => {
    if (nearbyPlaces.length > 0) {
      applyFilters(nearbyPlaces);
    } else {
      setFilteredPlaces([]);
    }
  }, [categoryFilter, nearbyPlaces, applyFilters]);

  // 디바운스된 검색 키워드로 장소 검색 (현재 위치 기반)
  useEffect(() => {
    const searchPlaces = async () => {
      if (!debouncedSearchKeyword.trim()) {
        setSearchResults([]);
        return;
      }

      const keyword = debouncedSearchKeyword.trim().toLowerCase();

      // 먼저 이미 로드된 주변 문화시설 목록에서 검색
      const placesToSearch = filteredPlaces.length > 0 ? filteredPlaces : nearbyPlaces;
      if (placesToSearch.length > 0) {
        const localResults = placesToSearch
          .filter(place => {
            const name = place.place_name.toLowerCase();
            const address = (place.address_name || '').toLowerCase();
            const roadAddress = (place.road_address_name || '').toLowerCase();
            const category = (place.category_name || '').toLowerCase();
            
            return name.includes(keyword) || 
                   address.includes(keyword) || 
                   roadAddress.includes(keyword) ||
                   category.includes(keyword);
          })
          .map((kakaoPlace): Place => ({
            id: parseInt(kakaoPlace.id) || 0,
            name: kakaoPlace.place_name,
            address: kakaoPlace.road_address_name || kakaoPlace.address_name,
            category: kakaoPlace.category_name,
            latitude: parseFloat(kakaoPlace.y),
            longitude: parseFloat(kakaoPlace.x),
          }));

        // 로컬 검색 결과가 있으면 그것을 사용
        if (localResults.length > 0) {
          setSearchResults(localResults);
          setSearching(false);
          return;
        }
      }

      // 로컬 목록에 결과가 없거나 주변 문화시설을 아직 로드하지 않은 경우 API 검색
      if (!latitude || !longitude) {
        console.warn('현재 위치 정보가 없어 검색할 수 없습니다.');
        setSearchResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      try {
        // 카카오 로컬 API를 통한 위치 기반 키워드 검색
        const kakaoResults = await kakaoLocalService.searchKeywordNearby(
          debouncedSearchKeyword,
          latitude,
          longitude,
          distanceFilter
        );
        
        // KakaoPlace를 Place 타입으로 변환
        const convertedResults: Place[] = kakaoResults.map((kakaoPlace) => ({
          id: parseInt(kakaoPlace.id) || 0,
          name: kakaoPlace.place_name,
          address: kakaoPlace.road_address_name || kakaoPlace.address_name,
          category: kakaoPlace.category_name,
          latitude: parseFloat(kakaoPlace.y),
          longitude: parseFloat(kakaoPlace.x),
        }));
        
        setSearchResults(convertedResults);
      } catch (err) {
        console.error('장소 검색 실패:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    searchPlaces();
  }, [debouncedSearchKeyword, latitude, longitude, distanceFilter, filteredPlaces, nearbyPlaces]);

  const handleSearchCulturePlaces = useCallback(() => {
    if (!mapInstanceRef.current || !window.kakao || !window.kakao.maps) {
      setError('지도가 아직 로드되지 않았습니다.');
      return;
    }

    // 현재 지도 중심 좌표 가져오기
    const center = mapInstanceRef.current.getCenter();
    const lat = center.getLat();
    const lng = center.getLng();

    loadNearbyPlaces(lat, lng, distanceFilter);
  }, [loadNearbyPlaces, distanceFilter]);

  const handleAddToPlanClick = useCallback((place: KakaoPlace) => {
    if (!authService.isAuthenticated()) {
      setShowLoginModal(true);
      return;
    }
    setSelectedPlace(place);
    // 오늘 날짜를 기본값으로 설정
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setSelectedTime('');
    setPlanTitle('');
    setModalStep('date');
    setExistingPlans([]);
    setSelectedPlanId(null);
    setShowCreateConfirm(false);
    setShowPlanModal(true);
  }, []);

  // 마커 업데이트 함수 (필터링된 장소만 표시)
  const updateMarkers = useCallback((placesToShow: KakaoPlace[], userLat?: number, userLng?: number) => {
    if (!mapInstanceRef.current || !window.kakao || !window.kakao.maps) {
      console.warn('지도 인스턴스가 없습니다.');
      return;
    }

    // 기존 마커 및 인포윈도우 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    infoWindowsRef.current.forEach(infoWindow => infoWindow.close());
    markersRef.current = [];
    infoWindowsRef.current = [];

    if (placesToShow.length === 0) {
      return;
    }

    // 주변 문화시설 마커 추가 (필터링된 장소만)
    const bounds = new window.kakao.maps.LatLngBounds();
    if (userLat && userLng) {
      bounds.extend(new window.kakao.maps.LatLng(userLat, userLng)); // 사용자 위치 포함
    }

    placesToShow.forEach((place, filteredIndex) => {
      // nearbyPlaces에서의 원본 인덱스 찾기
      const originalIndex = nearbyPlaces.findIndex(p => p.id === place.id);
      const placeIndex = originalIndex >= 0 ? originalIndex : filteredIndex;
      
      const position = new window.kakao.maps.LatLng(Number(place.y), Number(place.x));

      // 문화시설 마커 생성
      if (!mapInstanceRef.current) return;
      const marker = new window.kakao.maps.Marker({
        position: position,
        map: mapInstanceRef.current,
      });

      // 인포윈도우 내용 생성 (더 상세한 정보 포함)
      const infoContent = `
        <div style="padding:12px;min-width:200px;max-width:280px;">
          <div style="font-weight:bold;font-size:14px;margin-bottom:6px;color:#333;">${place.place_name}</div>
          <div style="font-size:11px;color:#666;margin-bottom:4px;padding-bottom:4px;border-bottom:1px solid #eee;">
            ${place.category_name}
          </div>
          ${place.road_address_name ? `
            <div style="font-size:11px;color:#555;margin-bottom:2px;">
              <span style="color:#999;">도로명:</span> ${place.road_address_name}
            </div>
          ` : ''}
          <div style="font-size:11px;color:#555;margin-bottom:4px;">
            <span style="color:#999;">지번:</span> ${place.address_name}
          </div>
          ${place.phone ? `
            <div style="font-size:11px;color:#555;margin-bottom:4px;">
              <span style="color:#999;">전화:</span> ${place.phone}
            </div>
          ` : ''}
          ${place.place_url ? `
            <div style="margin-top:6px;padding-top:6px;border-top:1px solid #eee;margin-bottom:6px;">
              <a href="${place.place_url}" target="_blank" 
                 style="font-size:11px;color:#16a34a;text-decoration:none;font-weight:500;">
                카카오맵에서 보기 →
              </a>
            </div>
          ` : ''}
          <div style="margin-top:6px;padding-top:6px;border-top:1px solid #eee;">
            <button id="add-to-plan-btn-${placeIndex}" 
                    style="width:100%;padding:6px;background:linear-gradient(to right, #22c55e, #16a34a);color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;font-weight:500;box-shadow:0 2px 4px rgba(34,197,94,0.3);transition:all 0.2s;">
              플랜에 추가
            </button>
          </div>
        </div>
      `;

      // 인포윈도우 생성
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: infoContent,
      });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        if (!mapInstanceRef.current) return;
        // 다른 인포윈도우 모두 닫기
        infoWindowsRef.current.forEach(iw => iw.close());
        infoWindow.open(mapInstanceRef.current, marker);
        
        // 리스트에서 해당 장소 하이라이트
        setSelectedPlaceIndex(placeIndex);
        
        // 리스트로 스크롤 (해당 장소가 보이도록)
        setTimeout(() => {
          const listItem = document.getElementById(`place-item-${placeIndex}`);
          if (listItem) {
            listItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        
        // 플랜에 추가 버튼 이벤트 리스너 추가
        setTimeout(() => {
          const btn = document.getElementById(`add-to-plan-btn-${placeIndex}`);
          if (btn) {
            btn.onclick = (e) => {
              e.stopPropagation();
              handleAddToPlanClick(place);
            };
          }
        }, 100);
      });

      markersRef.current.push(marker);
      infoWindowsRef.current.push(infoWindow);
      bounds.extend(position);
    });

    // 모든 마커가 보이도록 지도 범위 조정
    if (placesToShow.length > 0) {
      mapInstanceRef.current.setBounds(bounds);
    }
  }, [nearbyPlaces, handleAddToPlanClick]);

  // 필터링된 장소가 변경될 때마다 마커 업데이트
  useEffect(() => {
    if (filteredPlaces.length > 0 && mapInstanceRef.current && latitude && longitude) {
      updateMarkers(filteredPlaces, latitude, longitude);
    } else if (filteredPlaces.length === 0 && mapInstanceRef.current) {
      // 필터링된 장소가 없으면 모든 마커 제거
      markersRef.current.forEach(marker => marker.setMap(null));
      infoWindowsRef.current.forEach(infoWindow => infoWindow.close());
      markersRef.current = [];
      infoWindowsRef.current = [];
    }
  }, [filteredPlaces, latitude, longitude, updateMarkers]);

  const handleDateSelect = useCallback(async () => {
    if (!selectedDate) {
      alert('날짜를 선택해주세요.');
      return;
    }

    setLoadingPlans(true);
    try {
      // 해당 날짜의 플랜 조회
      const plans = await planService.getMyPlans(selectedDate);
      setExistingPlans(plans);

      if (plans.length === 0) {
        // 플랜이 없으면 새로 만들지 물어보기
        setShowCreateConfirm(true);
        setModalStep('plan-create');
      } else if (plans.length === 1) {
        // 플랜이 1개면 자동 선택
        setSelectedPlanId(plans[0].id);
        setModalStep('time');
      } else {
        // 플랜이 여러 개면 선택 화면
        setModalStep('plan-select');
      }
    } catch (err) {
      console.error('플랜 조회 실패:', err);
      alert('플랜을 조회하는데 실패했습니다.');
    } finally {
      setLoadingPlans(false);
    }
  }, [selectedDate]);

  const handlePlanSelect = useCallback((planId: number) => {
    setSelectedPlanId(planId);
    setModalStep('time');
  }, []);

  const handleCreateNewPlan = useCallback(() => {
    setShowCreateConfirm(false);
    setModalStep('plan-create');
  }, []);

  const handleCancelCreate = useCallback(() => {
    setShowPlanModal(false);
    setSelectedPlace(null);
    setSelectedDate('');
    setSelectedTime('');
    setPlanTitle('');
    setModalStep('date');
    setExistingPlans([]);
    setSelectedPlanId(null);
    setShowCreateConfirm(false);
  }, []);

  const handleCreatePlanAndAdd = useCallback(async () => {
    if (!selectedPlace || !selectedDate || !planTitle.trim()) {
      alert('플랜 이름을 입력해주세요.');
      return;
    }

    // 인증 확인
    if (!authService.isAuthenticated()) {
      alert('로그인이 필요합니다. 다시 로그인해주세요.');
      window.location.href = '/login';
      return;
    }

    setAddingToPlan(true);
    try {
      // 1. 카카오 장소를 DB에 저장
      const savedPlace = await placeService.createPlace({
        name: selectedPlace.place_name,
        address: selectedPlace.road_address_name || selectedPlace.address_name,
        category: selectedPlace.category_name,
        latitude: Number(selectedPlace.y),
        longitude: Number(selectedPlace.x),
        externalId: selectedPlace.id,
      });

      // 2. 새 플랜 생성 (장소 포함)
      await planService.createPlan({
        planDate: selectedDate,
        title: planTitle.trim(),
        placeIds: [savedPlace.id],
        visitTimes: selectedTime ? { [String(savedPlace.id)]: selectedTime } : undefined,
      });

      alert('플랜이 생성되고 장소가 추가되었습니다!');
      setShowPlanModal(false);
      setSelectedPlace(null);
      setSelectedDate('');
      setSelectedTime('');
      setPlanTitle('');
      setModalStep('date');
      setExistingPlans([]);
      setSelectedPlanId(null);
      setShowCreateConfirm(false);
    } catch (err) {
      console.error('플랜 생성 실패:', err);
      const errObj = err && typeof err === 'object' && 'response' in err 
        ? err as { response?: { status?: number; data?: { message?: string } }; code?: string; message?: string }
        : { message: String(err) };
      const statusCode = errObj.response?.status;
      const errorCode = errObj.code;
      const errorMessage = errObj.response?.data?.message || errObj.message || '플랜 생성에 실패했습니다.';
      
      if (errorCode === 'ERR_NETWORK' || errorCode === 'ERR_CONNECTION_REFUSED' || errObj.message === 'Network Error') {
        alert('백엔드 서버에 연결할 수 없습니다.\n백엔드 서버가 실행 중인지 확인해주세요. (포트 8080)');
      } else if (statusCode === 403) {
        alert('권한이 없습니다. 로그인 상태를 확인해주세요.');
      } else if (statusCode === 401) {
        alert('로그인이 필요합니다. 다시 로그인해주세요.');
        authService.logout();
        window.location.href = '/login';
      } else {
        alert(`오류: ${errorMessage}`);
      }
    } finally {
      setAddingToPlan(false);
    }
  }, [selectedPlace, selectedDate, selectedTime, planTitle]);

  const handleAddToPlan = useCallback(async () => {
    if (!selectedPlace || !selectedDate) {
      alert('날짜를 선택해주세요.');
      return;
    }

    if (!selectedPlanId) {
      alert('플랜을 선택해주세요.');
      return;
    }

    // 인증 확인
    if (!authService.isAuthenticated()) {
      alert('로그인이 필요합니다. 다시 로그인해주세요.');
      window.location.href = '/login';
      return;
    }

    setAddingToPlan(true);
    try {
      // 1. 카카오 장소를 DB에 저장
      const savedPlace = await placeService.createPlace({
        name: selectedPlace.place_name,
        address: selectedPlace.road_address_name || selectedPlace.address_name,
        category: selectedPlace.category_name,
        latitude: Number(selectedPlace.y),
        longitude: Number(selectedPlace.x),
        externalId: selectedPlace.id,
      });

      // 2. 기존 플랜에 장소 추가
      const plan = await planService.getPlan(selectedPlanId);
      const updatedPlaceIds = [...plan.places.map(p => p.id), savedPlace.id];
      const visitTimes: { [key: string]: string } = {};
      plan.places.forEach(p => {
        if (p.visitTime) {
          visitTimes[String(p.id)] = p.visitTime;
        }
      });
      if (selectedTime) {
        visitTimes[String(savedPlace.id)] = selectedTime;
      }

      await planService.updatePlan(selectedPlanId, {
        planDate: plan.planDate,
        title: plan.title,
        placeIds: updatedPlaceIds,
        visitTimes: Object.keys(visitTimes).length > 0 ? visitTimes : undefined,
      });

      alert('플랜에 장소가 추가되었습니다!');
      setShowPlanModal(false);
      setSelectedPlace(null);
      setSelectedDate('');
      setSelectedTime('');
      setPlanTitle('');
      setModalStep('date');
      setExistingPlans([]);
      setSelectedPlanId(null);
      setShowCreateConfirm(false);
    } catch (err) {
      console.error('플랜에 추가 실패:', err);
      const errObj = err && typeof err === 'object' && 'response' in err 
        ? err as { response?: { status?: number; data?: { message?: string } }; code?: string; message?: string }
        : { message: String(err) };
      const statusCode = errObj.response?.status;
      const errorCode = errObj.code;
      const errorMessage = errObj.response?.data?.message || errObj.message || '플랜에 추가하는데 실패했습니다.';
      
      if (errorCode === 'ERR_NETWORK' || errorCode === 'ERR_CONNECTION_REFUSED' || errObj.message === 'Network Error') {
        alert('백엔드 서버에 연결할 수 없습니다.\n백엔드 서버가 실행 중인지 확인해주세요. (포트 8080)');
      } else if (statusCode === 403) {
        alert('권한이 없습니다. 로그인 상태를 확인해주세요.');
      } else if (statusCode === 401) {
        alert('로그인이 필요합니다. 다시 로그인해주세요.');
        authService.logout();
        window.location.href = '/login';
      } else {
        alert(`오류: ${errorMessage}`);
      }
    } finally {
      setAddingToPlan(false);
    }
  }, [selectedPlace, selectedDate, selectedTime, selectedPlanId]);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !latitude || !longitude) {
      console.warn('지도 초기화 실패: mapRef 또는 위치 정보 없음');
      return;
    }

    try {
      console.log('지도 초기화 시작:', { latitude, longitude });
      
      // 사용자 위치를 중심으로 지도 생성
      const userPosition = new window.kakao.maps.LatLng(latitude, longitude);

      const mapOption = {
        center: userPosition,
        level: 5,
      };

      const map = new window.kakao.maps.Map(mapRef.current, mapOption);
      mapInstanceRef.current = map;
      setIsMapReady(true);
      console.log('지도 생성 완료');

      // 사용자 위치 마커 추가
      const userMarker = new window.kakao.maps.Marker({
        position: userPosition,
        map: map,
      });

      // 사용자 위치 커스텀 마커 이미지 (빨간색)
      const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';
      const imageSize = new window.kakao.maps.Size(24, 35);
      const imageOption = { offset: new window.kakao.maps.Point(12, 35) };
      const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
      userMarker.setImage(markerImage);

      // 사용자 위치 인포윈도우
      const userInfoWindow = new window.kakao.maps.InfoWindow({
        content: '<div style="padding:5px;font-size:12px;font-weight:bold;">내 위치</div>',
      });
      userInfoWindow.open(map, userMarker);

      // 자동 검색 제거 - 버튼 클릭 시에만 검색
    } catch (err) {
      console.error('지도 초기화 실패:', err);
      setError('지도를 초기화하는데 실패했습니다: ' + (err as Error).message);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (geoLoading || !latitude || !longitude) {
      console.log('위치 정보 대기 중:', { geoLoading, latitude, longitude });
      return;
    }

    const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY;
    console.log('API 키 확인:', apiKey ? '설정됨' : '없음');
    console.log('API 키 값:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
    console.log('API 키 타입:', typeof apiKey);
    console.log('API 키 길이:', apiKey?.length);
    console.log('모든 환경변수:', import.meta.env);
    
    if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
      const errorMsg = 'Kakao API 키가 설정되지 않았습니다.\n' +
        '배포 환경에서는 빌드 시 VITE_KAKAO_MAP_API_KEY 환경변수가 필요합니다.\n' +
        'Fly.io 배포 시: fly deploy --build-arg VITE_KAKAO_MAP_API_KEY=your_key\n' +
        '또는 .env.production 파일을 생성하세요.';
      setError(errorMsg);
      console.error('VITE_KAKAO_MAP_API_KEY가 설정되지 않았습니다.');
      console.error('현재 환경변수:', {
        VITE_KAKAO_MAP_API_KEY: apiKey,
        VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL
      });
      return;
    }

    // 이미 스크립트가 로드되어 있는지 확인
    if (window.kakao && window.kakao.maps) {
      console.log('Kakao Maps SDK 이미 로드됨');
      initializeMap();
      return;
    }

    // 이미 스크립트 태그가 있는지 확인하고 모두 제거
    const existingScripts = document.querySelectorAll('script[src*="dapi.kakao.com/v2/maps/sdk.js"]');
    existingScripts.forEach(script => {
      console.log('기존 스크립트 제거:', script.getAttribute('src'));
      script.remove();
    });
    
    // window.kakao는 전역 객체이므로 삭제하지 않음
    // 다른 컴포넌트에서도 사용할 수 있음

    // Kakao Maps SDK 로드 (제공된 예시 코드 반영)
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`;
    script.async = true;

    // script.onload: SDK 로드 완료 후 명시적으로 load 호출
    script.onload = () => {
      // SDK 로드 완료 후 명시적으로 load 호출
      window.kakao.maps.load(() => {
        // 지도 초기화 코드 실행
        initializeMap();
      });
    };

    script.onerror = (e) => {
      const errorMsg = 'Kakao Maps SDK 스크립트 로드에 실패했습니다. API 키와 네트워크를 확인해주세요.';
      setError(errorMsg);
      console.error('Kakao Maps SDK 스크립트 로드 실패:', e);
      console.error('스크립트 URL:', script.src);
      console.error('API 키 길이:', apiKey.length);
      console.error('API 키 (처음 10자):', apiKey.substring(0, 10));
      
      // API 키가 올바른 형식인지 확인
      if (apiKey && apiKey.length < 30) {
        console.error('⚠️ API 키 길이가 너무 짧습니다. 올바른 키인지 확인해주세요.');
        console.error('현재 API 키 길이:', apiKey.length);
        console.error('API 키 (처음 20자):', apiKey.substring(0, 20));
        setError(`API 키가 올바르지 않습니다.\n` +
          `현재 키 길이: ${apiKey.length}자 (최소 30자 필요)\n` +
          `JavaScript 키를 사용하고 있는지 확인하세요.\n` +
          `Kakao Developers 콘솔 > 앱 키 > JavaScript 키를 확인하세요.`);
      } else if (!apiKey || apiKey === 'undefined') {
        setError('API 키가 빌드에 포함되지 않았습니다.\n' +
          '배포 시 --build-arg VITE_KAKAO_MAP_API_KEY=your_key를 사용하거나\n' +
          '.env.production 파일을 생성하세요.');
      }
    };

    document.head.appendChild(script);

    return () => {
      // cleanup은 하지 않음 (다른 컴포넌트에서도 사용할 수 있으므로)
    };
  }, [latitude, longitude, geoLoading, initializeMap]);

  if (geoLoading) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-gray-600">위치 정보를 가져오는 중...</p>
        </div>
      </Card>
    );
  }

  if (geoError) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">{geoError}</p>
          <p className="text-sm text-gray-600">위치 권한을 허용해주세요.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold">주변 문화시설</h2>
          <Button
            variant="primary"
            onClick={handleSearchCulturePlaces}
            disabled={loading || !isMapReady}
            className="ml-4"
          >
            {loading ? '검색 중...' : '문화정보 찾기'}
          </Button>
        </div>

        {/* 장소 검색 입력창 (디바운스 적용) */}
        <div className="mb-3">
          <div className="relative rounded-xl p-0.5 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600">
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="장소 이름 또는 주소로 검색..."
                className="w-full px-4 py-2.5 pl-10 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10"
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
            {searching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
              </div>
            )}
            </div>
          </div>
          {debouncedSearchKeyword && !searching && searchResults.length > 0 && (
            <div className="mt-2 p-3 bg-white border border-green-200 rounded-lg shadow-sm max-h-60 overflow-y-auto">
              <p className="text-xs text-gray-500 mb-2">
                "{debouncedSearchKeyword}" 검색 결과 ({searchResults.length}개)
              </p>
              <div className="space-y-2">
                {searchResults.slice(0, 5).map((place) => (
                  <div
                    key={place.id}
                    className="p-2 hover:bg-green-50 rounded cursor-pointer transition-colors"
                    onClick={() => {
                      // 지도에 마커 표시
                      if (mapInstanceRef.current && place.latitude && place.longitude && window.kakao && window.kakao.maps) {
                        const position = new window.kakao.maps.LatLng(
                          Number(place.latitude),
                          Number(place.longitude)
                        );
                        
                        // 지도 중심 이동
                        mapInstanceRef.current.setCenter(position);
                        mapInstanceRef.current.setLevel(3);
                        
                        // 마커 생성
                        const marker = new window.kakao.maps.Marker({
                          position: position,
                          map: mapInstanceRef.current,
                        });
                        
                        // 인포윈도우 생성
                        const infoWindow = new window.kakao.maps.InfoWindow({
                          content: `
                            <div style="padding:12px;min-width:200px;">
                              <div style="font-weight:bold;font-size:14px;margin-bottom:6px;">${place.name}</div>
                              ${place.address ? `<div style="font-size:11px;color:#666;margin-bottom:4px;">${place.address}</div>` : ''}
                              ${place.category ? `<div style="font-size:11px;color:#666;margin-bottom:4px;">${place.category}</div>` : ''}
                            </div>
                          `,
                        });
                        
                        infoWindow.open(mapInstanceRef.current, marker);
                        
                        // 기존 검색 결과 마커 제거 (선택사항)
                        setTimeout(() => {
                          marker.setMap(null);
                          infoWindow.close();
                        }, 5000);
                      }
                      
                      // 검색창 초기화
                      setSearchKeyword('');
                    }}
                  >
                    <p className="font-semibold text-sm text-gray-800">{place.name}</p>
                    {place.address && (
                      <p className="text-xs text-gray-600">{place.address}</p>
                    )}
                    {place.category && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                        {place.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {debouncedSearchKeyword && !searching && searchResults.length === 0 && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                "{debouncedSearchKeyword}"에 대한 검색 결과가 없습니다.
              </p>
            </div>
          )}
        </div>
        
        {/* 필터 UI - 처음부터 표시하여 검색 전에도 카테고리와 반경 설정 가능 */}
        <div className="flex flex-wrap gap-3 mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">카테고리:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="all">전체</option>
              <option value="박물관">박물관</option>
              <option value="미술관">미술관</option>
              <option value="도서관">도서관</option>
              <option value="공연장">공연장</option>
              <option value="문화원">문화원</option>
              <option value="전시">전시</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">반경:</span>
            <select
              value={distanceFilter}
              onChange={(e) => {
                const newRadius = Number(e.target.value);
                setDistanceFilter(newRadius);
                // 이미 검색 결과가 있으면 재검색
                if (nearbyPlaces.length > 0 && mapInstanceRef.current && latitude && longitude) {
                  loadNearbyPlaces(latitude, longitude, newRadius);
                }
              }}
              className="px-3 py-1.5 text-sm border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="1000">1km</option>
              <option value="2000">2km</option>
              <option value="3000">3km</option>
              <option value="5000">5km</option>
            </select>
          </div>
          {nearbyPlaces.length > 0 && filteredPlaces.length !== nearbyPlaces.length && (
            <span className="text-sm text-gray-600 flex items-center">
              ({filteredPlaces.length}개 표시 중)
            </span>
          )}
        </div>
        
        {loading && <p className="text-sm text-gray-600">검색 중...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && nearbyPlaces.length > 0 && (
          <p className="text-sm text-gray-600">
            주변 {nearbyPlaces.length}개의 문화시설을 찾았습니다.
            {filteredPlaces.length !== nearbyPlaces.length && ` (${filteredPlaces.length}개 필터링됨)`}
          </p>
        )}
      </div>
      <div className="w-full rounded-xl p-1 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 shadow-lg">
        <div
          ref={mapRef}
          className="w-full rounded-lg overflow-hidden bg-gray-100"
          style={{ height: '500px', minHeight: '500px' }}
        >
        {error && !mapInstanceRef.current && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-4">
              <p className="text-red-600 font-semibold mb-2">{error}</p>
              <p className="text-sm text-gray-600">
                브라우저 콘솔(F12)을 확인하여 자세한 에러를 확인하세요.
              </p>
            </div>
          </div>
        )}
        </div>
      </div>
      {(filteredPlaces.length > 0 || nearbyPlaces.length > 0) && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">
            주변 문화시설 목록 
            {filteredPlaces.length > 0 && (
              <span className="text-sm font-normal text-gray-600">
                ({filteredPlaces.length}개)
              </span>
            )}
          </h3>
          <div className="max-h-80 md:max-h-96 overflow-y-auto space-y-2">
            {(filteredPlaces.length > 0 ? filteredPlaces : nearbyPlaces).map((place) => {
              const originalIndex = nearbyPlaces.findIndex(p => p.id === place.id);
              const isSelected = selectedPlaceIndex === originalIndex;
              
              return (
                <div
                  key={place.id}
                  id={`place-item-${originalIndex}`}
                  className={`p-3 border-2 rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (mapInstanceRef.current && markersRef.current[originalIndex]) {
                      const position = new window.kakao.maps.LatLng(Number(place.y), Number(place.x));
                      mapInstanceRef.current.setCenter(position);
                      mapInstanceRef.current.setLevel(3);
                      
                      // 해당 마커의 인포윈도우 열기
                      if (infoWindowsRef.current[originalIndex]) {
                        // 다른 인포윈도우 모두 닫기
                        infoWindowsRef.current.forEach(iw => iw.close());
                        infoWindowsRef.current[originalIndex].open(mapInstanceRef.current, markersRef.current[originalIndex]);
                      }
                      
                      // 리스트에서 하이라이트
                      setSelectedPlaceIndex(originalIndex);
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isSelected
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {originalIndex + 1}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium text-sm ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                        {place.place_name}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{place.category_name}</div>
                      <div className="text-xs text-gray-500 mt-1">{place.address_name}</div>
                      {place.phone && (
                        <div className="text-xs text-gray-500 mt-1">📞 {place.phone}</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <Button
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToPlanClick(place);
                      }}
                      className="w-full text-xs py-1"
                    >
                      플랜에 추가
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 플랜에 추가 모달 - 단계별 플로우 */}
      {showPlanModal && selectedPlace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCancelCreate}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* 장소 정보 */}
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="font-semibold text-base text-gray-900">{selectedPlace.place_name}</div>
              <div className="text-sm text-gray-600 mt-1">{selectedPlace.category_name}</div>
              <div className="text-xs text-gray-500 mt-1">{selectedPlace.address_name}</div>
            </div>

            {/* Step 1: 날짜 선택 */}
            {modalStep === 'date' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold mb-2 text-gray-900">날짜 선택</h3>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    방문 날짜 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="secondary"
                    onClick={handleCancelCreate}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleDateSelect}
                    className="flex-1"
                    disabled={!selectedDate || loadingPlans}
                  >
                    {loadingPlans ? '확인 중...' : '다음'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: 플랜 선택 (여러 개일 경우) */}
            {modalStep === 'plan-select' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold mb-2 text-gray-900">플랜 선택</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>{selectedDate}</strong>에 {existingPlans.length}개의 플랜이 있습니다.
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {existingPlans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => handlePlanSelect(plan.id)}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          selectedPlanId === plan.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">{plan.title || plan.planDate}</div>
                        <div className="text-sm text-gray-600 mt-1">장소 {plan.places.length}개</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => setModalStep('date')}
                    className="flex-1"
                  >
                    이전
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setModalStep('time')}
                    className="flex-1"
                    disabled={!selectedPlanId}
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: 플랜 생성 (플랜이 없을 경우) */}
            {modalStep === 'plan-create' && (
              <div className="space-y-4">
                {showCreateConfirm ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <div className="text-4xl mb-3">📅</div>
                      <h3 className="text-lg font-bold mb-2 text-gray-900">플랜이 없습니다</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>{selectedDate}</strong>에 등록된 플랜이 없습니다.<br />
                        새 플랜을 만드시겠습니까?
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        onClick={handleCancelCreate}
                        className="flex-1"
                      >
                        아니오
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleCreateNewPlan}
                        className="flex-1"
                      >
                        네, 만들겠습니다
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-lg font-bold mb-2 text-gray-900">플랜 이름 설정</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        플랜의 이름을 입력해주세요. (예: 데이트, 가족여행, 친구모임 등)
                      </p>
                      <input
                        type="text"
                        value={planTitle}
                        onChange={(e) => setPlanTitle(e.target.value)}
                        placeholder="예: 데이트, 가족여행, 친구모임"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        autoFocus
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        {['데이트', '가족여행', '친구모임', '혼자여행', '문화탐방'].map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => setPlanTitle(suggestion)}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button
                        variant="secondary"
                        onClick={() => setShowCreateConfirm(true)}
                        className="flex-1"
                      >
                        이전
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => setModalStep('time')}
                        className="flex-1"
                        disabled={!planTitle.trim()}
                      >
                        다음
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 4: 시간 선택 및 최종 확인 */}
            {modalStep === 'time' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold mb-2 text-gray-900">방문 시간 설정</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {modalStep === 'time' && selectedPlanId ? (
                      <>선택한 플랜에 장소를 추가합니다.</>
                    ) : (
                      <>새 플랜 <strong>"{planTitle}"</strong>을 생성하고 장소를 추가합니다.</>
                    )}
                  </p>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    방문 시간 (선택사항)
                  </label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (modalStep === 'time' && selectedPlanId) {
                        setModalStep('plan-select');
                      } else {
                        setModalStep('plan-create');
                      }
                    }}
                    className="flex-1"
                    disabled={addingToPlan}
                  >
                    이전
                  </Button>
                  <Button
                    variant="primary"
                    onClick={selectedPlanId ? handleAddToPlan : handleCreatePlanAndAdd}
                    className="flex-1"
                    disabled={addingToPlan}
                  >
                    {addingToPlan ? '처리 중...' : (selectedPlanId ? '장소 추가' : '플랜 생성 및 추가')}
                  </Button>
                </div>
                {addingToPlan && (
                  <div className="mt-4 text-center text-sm text-gray-600">
                    {selectedPlanId ? '플랜에 장소를 추가하는 중...' : '플랜을 생성하고 장소를 추가하는 중...'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 로그인 필요 안내 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowLoginModal(false)}>
          <div className="max-w-md w-full mx-4 border-2 border-green-200 bg-white shadow-2xl rounded-xl" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="text-center py-8 md:py-10 px-6 md:px-8">
              <div className="text-6xl md:text-7xl mb-6">🔒</div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">
                로그인이 필요합니다
              </h2>
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-4 md:p-5 mb-6 md:mb-8">
                <p className="text-base md:text-lg text-gray-800 font-semibold leading-relaxed">
                  회원가입 및 로그인 후<br />
                  플래너를 사용하실 수 있습니다.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Link to="/signup" className="flex-1" onClick={() => setShowLoginModal(false)}>
                  <Button variant="primary" className="w-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                    회원가입
                  </Button>
                </Link>
                <Link to="/login" className="flex-1" onClick={() => setShowLoginModal(false)}>
                  <Button variant="secondary" className="w-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700">
                    로그인
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

