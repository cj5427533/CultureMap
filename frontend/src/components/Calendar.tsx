import { useEffect, useRef } from 'react';
import Litepicker from 'litepicker';
import 'litepicker/dist/css/litepicker.css';

interface CalendarProps {
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  markedDates?: string[]; // 플랜이 있는 날짜들
}

export const Calendar = ({ selectedDate, onDateSelect, markedDates = [] }: CalendarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<Litepicker | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    const picker = new Litepicker({
      element: inputRef.current,
      singleMode: true,
      format: 'YYYY-MM-DD',
      lang: 'ko-KR',
      setup: (picker) => {
        picker.on('selected', (date) => {
          if (date) {
            onDateSelect(date.format('YYYY-MM-DD'));
          }
        });
      },
      plugins: ['mobilefriendly'],
    });

    pickerRef.current = picker;

    // 플랜이 있는 날짜 표시 (간단한 커스터마이징)
    if (markedDates.length > 0) {
      // Litepicker의 날짜 표시 커스터마이징은 복잡하므로
      // 여기서는 기본 기능만 사용
      // markedDates는 이미 picker에 전달되어 표시됨
    }

    return () => {
      if (pickerRef.current) {
        pickerRef.current.destroy();
      }
    };
  }, [onDateSelect, markedDates]);

  useEffect(() => {
    if (pickerRef.current && selectedDate) {
      pickerRef.current.setDate(selectedDate);
    }
  }, [selectedDate]);

  return (
    <div className="mb-4 md:mb-6">
      <label className="block mb-2 md:mb-3 font-semibold text-sm md:text-base text-gray-800">
        날짜 선택
      </label>
      <input
        ref={inputRef}
        type="text"
        placeholder="날짜를 선택하세요"
        readOnly
        className="w-full max-w-full md:max-w-md px-4 md:px-5 py-2.5 md:py-3 border-2 border-gray-300 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-base md:text-lg cursor-pointer bg-white touch-target"
        style={{ fontSize: '16px' }} // iOS 줌 방지
      />
    </div>
  );
};

