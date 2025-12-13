import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { planService } from '../services/planService';
import type { Plan } from '../types/index';
import { authService } from '../services/authService';
import { Calendar } from '../components/Calendar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const Plans = () => {
  const navigate = useNavigate();
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const filtered = allPlans.filter(plan => plan.planDate === selectedDate);
      setFilteredPlans(filtered);
    } else {
      setFilteredPlans(allPlans);
    }
  }, [selectedDate, allPlans]);

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

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleClearFilter = () => {
    setSelectedDate(undefined);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await planService.deletePlan(id);
      loadPlans();
    } catch (err) {
      alert('삭제에 실패했습니다.');
    }
  };

  if (loading) return <div className="text-center py-12">로딩 중...</div>;

  const markedDates = allPlans.map(plan => plan.planDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">내 플랜</h1>
            <p className="text-gray-600">나만의 여행 플랜을 관리하고 공유해보세요</p>
          </div>
          <div className="flex gap-3">
            <Link to="/plans/new">
              <Button variant="primary" className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                ✨ 새 플랜 만들기
              </Button>
            </Link>
            <Link to="/posts">
              <Button variant="success" className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                공유 게시판
              </Button>
            </Link>
          </div>
        </div>

        <Card className="mb-8 border-2 border-green-200 bg-gradient-to-br from-white to-green-50/30">
          <div className="mb-4 pb-4 border-b-2 border-green-200">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-green-500">📅</span>
              날짜 선택
            </h2>
          </div>
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            markedDates={markedDates}
          />
          {selectedDate && (
            <div className="mt-6 pt-4 border-t-2 border-green-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gray-700 font-semibold">선택된 날짜:</span>
                <span className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-lg">{selectedDate}</span>
              </div>
              <Button variant="secondary" onClick={handleClearFilter} className="shadow-md hover:shadow-lg transform hover:scale-105 transition-all">
                🔄 필터 초기화
              </Button>
            </div>
          )}
        </Card>

        {filteredPlans.length === 0 ? (
          <Card className="text-center py-16 border-2 border-green-200 bg-gradient-to-br from-white to-green-50">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-xl text-gray-700 mb-2 font-semibold">아직 플랜이 없습니다.</p>
            <p className="text-gray-600 mb-6">새로운 여행 플랜을 만들어보세요!</p>
            <Link to="/plans/new">
              <Button variant="primary" className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                ✨ 첫 플랜 만들기
              </Button>
            </Link>
          </Card>
        ) : (
          <div>
            {selectedDate && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border-2 border-green-300">
                <p className="text-gray-800 text-lg font-semibold">
                  <span className="text-green-700">📅 {selectedDate}</span>의 플랜 <span className="bg-green-500 text-white px-3 py-1 rounded-full">{filteredPlans.length}개</span>
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <Card key={plan.id} className="hover:shadow-xl transition-all transform hover:scale-105 border-2 border-green-200 bg-gradient-to-br from-white to-green-50/30">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex-1 pr-2 line-clamp-2">{plan.title || plan.planDate}</h3>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                      📍
                    </div>
                  </div>
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-green-600">📅 날짜:</span>
                      <span className="text-gray-700 font-medium">{plan.planDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-green-600">📍 장소:</span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">{plan.places.length}개</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap pt-4 border-t-2 border-green-200">
                    <Link to={`/plans/${plan.id}`} className="flex-1">
                      <Button variant="primary" className="w-full text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all">
                        👁️ 보기
                      </Button>
                    </Link>
                    <Link to={`/plans/${plan.id}/edit`} className="flex-1">
                      <Button variant="warning" className="w-full text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all">
                        ✏️ 수정
                      </Button>
                    </Link>
                    <Button variant="danger" onClick={() => handleDelete(plan.id)} className="flex-1 text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all">
                      🗑️ 삭제
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

