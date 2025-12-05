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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">내 플랜</h1>
        <div className="flex gap-2">
          <Link to="/plans/new">
            <Button variant="primary">새 플랜 만들기</Button>
          </Link>
          <Link to="/posts">
            <Button variant="success">공유 게시판</Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <Calendar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          markedDates={markedDates}
        />
        {selectedDate && (
          <div className="mt-4 flex items-center gap-4">
            <span className="text-gray-700">선택된 날짜: <strong>{selectedDate}</strong></span>
            <Button variant="secondary" onClick={handleClearFilter} className="text-sm">
              필터 초기화
            </Button>
          </div>
        )}
      </Card>

      {filteredPlans.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600 mb-4">아직 플랜이 없습니다.</p>
          <Link to="/plans/new">
            <Button variant="primary">첫 플랜 만들기</Button>
          </Link>
        </Card>
      ) : (
        <div>
          {selectedDate && (
            <p className="mb-4 text-gray-600">
              <strong>{selectedDate}</strong>의 플랜 {filteredPlans.length}개
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-2">{plan.title || plan.planDate}</h3>
                <p className="text-gray-600 mb-1">날짜: {plan.planDate}</p>
                <p className="text-gray-600 mb-4">장소 수: {plan.places.length}개</p>
                <div className="flex gap-2 flex-wrap">
                  <Link to={`/plans/${plan.id}`}>
                    <Button variant="primary" className="text-sm">보기</Button>
                  </Link>
                  <Link to={`/plans/${plan.id}/edit`}>
                    <Button variant="warning" className="text-sm">수정</Button>
                  </Link>
                  <Button variant="danger" onClick={() => handleDelete(plan.id)} className="text-sm">
                    삭제
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

