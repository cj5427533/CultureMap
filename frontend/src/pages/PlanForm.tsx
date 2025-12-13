import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { planService } from '../services/planService';
import { placeService } from '../services/placeService';
import type { PlanRequest, Place } from '../types/index';
import { Calendar } from '../components/Calendar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const PlanForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [formData, setFormData] = useState<PlanRequest>({
    planDate: new Date().toISOString().split('T')[0],
    title: '',
    placeIds: [],
    visitTimes: {},
  });
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'date' | 'title' | 'places'>(isEdit ? 'places' : 'date');

  useEffect(() => {
    if (isEdit && id) {
      loadPlan(parseInt(id));
    }
    loadPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const loadPlan = async (planId: number) => {
    try {
      const plan = await planService.getPlan(planId);
      const sortedPlaces = plan.places.sort((a, b) => {
        if (!a.visitTime && !b.visitTime) return (a.visitOrder || 0) - (b.visitOrder || 0);
        if (!a.visitTime) return 1;
        if (!b.visitTime) return -1;
        return a.visitTime.localeCompare(b.visitTime);
      });
      
      const visitTimes: { [key: string]: string } = {};
      sortedPlaces.forEach(p => {
        if (p.visitTime) {
          visitTimes[String(p.id)] = p.visitTime;
        }
      });
      
      setFormData({
        planDate: plan.planDate,
        title: plan.title || '',
        placeIds: sortedPlaces.map(p => p.id),
        visitTimes,
      });
      setSelectedPlaces(sortedPlaces);
    } catch {
      alert('플랜을 불러오는데 실패했습니다.');
      navigate('/plans');
    }
  };

  const loadPlaces = async () => {
    try {
      const data = await placeService.searchPlaces();
      setPlaces(data);
    } catch (err) {
      console.error('장소 로드 실패:', err);
    }
  };

  const handleSearch = async () => {
    try {
      const data = await placeService.searchPlaces(searchKeyword);
      setPlaces(data);
    } catch (err) {
      console.error('장소 검색 실패:', err);
    }
  };

  const handleAddPlace = (place: Place) => {
    if (!selectedPlaces.find(p => p.id === place.id)) {
      setSelectedPlaces([...selectedPlaces, place]);
      setFormData({ 
        ...formData, 
        placeIds: [...formData.placeIds, place.id],
        visitTimes: { ...formData.visitTimes }
      });
    }
  };

  const handleRemovePlace = (placeId: number) => {
    setSelectedPlaces(selectedPlaces.filter(p => p.id !== placeId));
    const newVisitTimes = { ...formData.visitTimes };
    delete newVisitTimes[String(placeId)]; // 문자열 키로 삭제
    setFormData({ 
      ...formData, 
      placeIds: formData.placeIds.filter(id => id !== placeId),
      visitTimes: newVisitTimes
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newPlaces = [...selectedPlaces];
    [newPlaces[index - 1], newPlaces[index]] = [newPlaces[index], newPlaces[index - 1]];
    setSelectedPlaces(newPlaces);
    setFormData({ ...formData, placeIds: newPlaces.map(p => p.id) });
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedPlaces.length - 1) return;
    const newPlaces = [...selectedPlaces];
    [newPlaces[index], newPlaces[index + 1]] = [newPlaces[index + 1], newPlaces[index]];
    setSelectedPlaces(newPlaces);
    setFormData({ ...formData, placeIds: newPlaces.map(p => p.id) });
  };

  const handleTimeChange = (placeId: number, time: string) => {
    const newVisitTimes = { ...formData.visitTimes };
    const placeIdStr = String(placeId);
    if (time) {
      newVisitTimes[placeIdStr] = time;
    } else {
      delete newVisitTimes[placeIdStr];
    }
    setFormData({ ...formData, visitTimes: newVisitTimes });
    
    // selectedPlaces도 업데이트
    setSelectedPlaces(selectedPlaces.map(p => 
      p.id === placeId ? { ...p, visitTime: time } : p
    ));
  };

  const handleDateNext = () => {
    if (!formData.planDate) {
      alert('날짜를 선택해주세요.');
      return;
    }
    setStep('title');
  };

  const handleTitleNext = () => {
    if (!formData.title || !formData.title.trim()) {
      alert('플랜 이름을 입력해주세요.');
      return;
    }
    if (isEdit) {
      // 수정 모드면 바로 저장
      handleSubmit();
    } else {
      // 새 플랜 생성 모드면 플랜 생성 후 장소 추가 단계로
      handleCreatePlan();
    }
  };

  const handleCreatePlan = async () => {
    if (!formData.title || !formData.title.trim()) {
      alert('플랜 이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const submitData: PlanRequest = {
        planDate: formData.planDate,
        title: formData.title.trim(),
        placeIds: [],
        visitTimes: undefined,
      };
      
      const createdPlan = await planService.createPlan(submitData);
      alert('플랜이 생성되었습니다! 이제 장소를 추가할 수 있습니다.');
      navigate(`/plans/${createdPlan.id}/edit`);
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || '플랜 생성에 실패했습니다.'
        : '플랜 생성에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!isEdit && formData.placeIds.length === 0) {
      // 새 플랜 생성 시 장소가 없어도 허용 (나중에 추가 가능)
    }

    setLoading(true);
    try {
      // visitTimes를 백엔드 형식으로 변환 (키는 이미 문자열)
      const visitTimes: { [key: string]: string } = {};
      if (formData.visitTimes) {
        Object.keys(formData.visitTimes).forEach(key => {
          const time = formData.visitTimes![key];
          if (time && time.trim() !== '') {
            visitTimes[key] = time;
          }
        });
      }
      
      const submitData: PlanRequest = {
        planDate: formData.planDate,
        title: formData.title,
        placeIds: formData.placeIds,
        visitTimes: Object.keys(visitTimes).length > 0 ? visitTimes : undefined
      };
      
      if (isEdit && id) {
        await planService.updatePlan(parseInt(id), submitData);
        alert('플랜이 수정되었습니다!');
        navigate('/plans');
      } else {
        await planService.createPlan(submitData);
        alert('플랜이 생성되었습니다!');
        navigate('/plans');
      }
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || '저장에 실패했습니다.'
        : '저장에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 수정 모드이거나 장소 추가 단계일 때만 장소 관리 UI 표시
  const showPlaceManagement = isEdit || step === 'places';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* 시각적 위계: 제목 */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 text-gray-900">{isEdit ? '플랜 수정' : '새 플랜 만들기'}</h1>
      
      {/* 일관성: Step 1: 날짜 선택 */}
      {step === 'date' && (
        <Card className="border-2 border-green-200">
          <div className="space-y-6 md:space-y-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-900">1단계: 날짜 선택</h2>
              <Calendar
                selectedDate={formData.planDate}
                onDateSelect={(date) => setFormData({ ...formData, planDate: date })}
              />
            </div>
            {/* 여백과 정렬: 버튼 */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Button variant="secondary" onClick={() => navigate('/plans')} className="flex-1 w-full sm:w-auto">
                취소
              </Button>
              <Button variant="primary" onClick={handleDateNext} className="flex-1 w-full sm:w-auto" disabled={!formData.planDate}>
                다음
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 일관성: Step 2: 플랜 이름 설정 */}
      {step === 'title' && (
        <Card className="border-2 border-green-200">
          <div className="space-y-6 md:space-y-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-900">2단계: 플랜 이름 설정</h2>
              {/* 가독성: 설명 텍스트 */}
              <p className="text-base md:text-lg text-gray-700 mb-4 md:mb-6 leading-relaxed">
                플랜의 이름을 입력해주세요. (예: 데이트, 가족여행, 친구모임 등)
              </p>
              {/* 가독성: 입력 필드 */}
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="예: 데이트, 가족여행, 친구모임"
                className="w-full px-4 md:px-5 py-3 md:py-3.5 border-2 border-gray-300 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-base md:text-lg"
                autoFocus
              />
              {/* 리듬: 추천 버튼 */}
              <div className="mt-4 md:mt-6 flex flex-wrap gap-2 md:gap-3">
                {['데이트', '가족여행', '친구모임', '혼자여행', '문화탐방'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setFormData({ ...formData, title: suggestion })}
                    className="px-3 md:px-4 py-1.5 md:py-2 text-sm md:text-base bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors font-semibold border border-green-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
            {/* 여백과 정렬: 버튼 */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Button variant="secondary" onClick={() => setStep('date')} className="flex-1 w-full sm:w-auto">
                이전
              </Button>
              <Button 
                variant="primary" 
                onClick={handleTitleNext} 
                className="flex-1 w-full sm:w-auto" 
                disabled={!formData.title || !formData.title.trim() || loading}
              >
                {loading ? '생성 중...' : '플랜 생성'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 일관성: Step 3: 장소 추가 (수정 모드 또는 플랜 생성 후) */}
      {showPlaceManagement && (
        <form onSubmit={handleSubmit}>
          <Card className="mb-6 md:mb-8 border-2 border-green-200">
            <div className="mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-gray-900">플랜 정보</h2>
              <div className="text-base md:text-lg text-gray-700 space-y-2">
                <p>날짜: <strong className="text-gray-900">{formData.planDate}</strong></p>
                <p>이름: <strong className="text-gray-900">{formData.title || '제목 없음'}</strong></p>
              </div>
            </div>
          </Card>

          <Card className="mb-6 md:mb-8 border-2 border-green-200">
            <div className="mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-4 md:mb-6 text-gray-900">장소 검색</h3>
              {/* 여백과 정렬: 검색 입력 */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-4 md:mb-6">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="장소 이름 또는 주소로 검색"
                  className="flex-1 px-4 md:px-5 py-2.5 md:py-3 border-2 border-gray-300 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base md:text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                />
                <Button type="button" variant="primary" onClick={handleSearch} className="w-full sm:w-auto">
                  검색
                </Button>
              </div>
              {/* 가독성: 검색 결과 목록 */}
              <div className="max-h-60 overflow-y-auto border-2 border-gray-200 rounded-lg md:rounded-xl p-4 md:p-5">
                {places.length === 0 ? (
                  <p className="text-gray-600 text-center py-6 md:py-8 text-base md:text-lg font-medium">검색 결과가 없습니다.</p>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    {places.map((place) => (
                      <div key={place.id} className="p-3 md:p-4 border-2 border-gray-200 rounded-lg md:rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <strong className="text-gray-900 text-base md:text-lg font-bold">{place.name}</strong>
                          {place.address && <div className="text-sm md:text-base text-gray-700 mt-1 md:mt-2">{place.address}</div>}
                        </div>
                        <Button
                          type="button"
                          variant={selectedPlaces.find(p => p.id === place.id) ? 'secondary' : 'primary'}
                          onClick={() => handleAddPlace(place)}
                          disabled={!!selectedPlaces.find(p => p.id === place.id)}
                          className="text-xs md:text-sm w-full sm:w-auto"
                        >
                          {selectedPlaces.find(p => p.id === place.id) ? '추가됨' : '추가'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* 리듬: 선택된 장소 섹션 */}
          <Card className="mb-6 md:mb-8 border-2 border-green-200">
            <div className="mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-4 md:mb-6 text-gray-900">선택된 장소 <span className="text-green-600">({selectedPlaces.length}개)</span></h3>
              {selectedPlaces.length === 0 ? (
                <p className="text-gray-600 text-center py-8 md:py-12 text-base md:text-lg font-medium leading-relaxed">장소를 추가해주세요. 플랜을 저장한 후에도 나중에 장소를 추가할 수 있습니다.</p>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {selectedPlaces.map((place, index) => (
                    <div key={place.id} className="p-4 md:p-5 lg:p-6 border-2 border-gray-200 rounded-lg md:rounded-xl hover:border-green-300 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 md:mb-4 gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 md:gap-3 mb-2">
                            {/* 대비: 번호 아이콘 */}
                            <span className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center text-sm md:text-base font-bold shadow-md">
                              {index + 1}
                            </span>
                            <strong className="text-gray-900 text-lg md:text-xl font-bold">{place.name}</strong>
                          </div>
                          {place.address && <div className="text-sm md:text-base text-gray-700 ml-10 md:ml-12 mt-1">{place.address}</div>}
                        </div>
                        {/* 정렬: 액션 버튼 */}
                        <div className="flex gap-2 md:gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="text-xs md:text-sm px-2 md:px-3"
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === selectedPlaces.length - 1}
                            className="text-xs md:text-sm px-2 md:px-3"
                          >
                            ↓
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => handleRemovePlace(place.id)}
                            className="text-xs md:text-sm"
                          >
                            삭제
                          </Button>
                        </div>
                      </div>
                      {/* 여백: 방문 시간 입력 */}
                      <div className="ml-10 md:ml-12">
                        <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2 md:mb-3">
                          방문 시간 (선택사항)
                        </label>
                        <input
                          type="time"
                          value={formData.visitTimes?.[String(place.id)] || ''}
                          onChange={(e) => handleTimeChange(place.id, e.target.value)}
                          className="px-3 md:px-4 py-2 md:py-2.5 border-2 border-gray-300 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base md:text-lg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* 여백과 정렬: 제출 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <Button type="button" variant="secondary" onClick={() => navigate('/plans')} className="flex-1 w-full sm:w-auto">
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={loading} className="flex-1 w-full sm:w-auto">
              {loading ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

