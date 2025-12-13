import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="mb-4 md:mb-6">
        {/* 시각적 위계: 라벨 스타일 */}
        {label && (
          <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2 md:mb-3">
            {label}
          </label>
        )}
        {/* 가독성과 모바일 최적화: 입력 필드 */}
        <input
          ref={ref}
          className={`input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
          {...props}
        />
        {/* 대비: 에러 메시지 스타일 */}
        {error && (
          <p className="mt-2 text-sm md:text-base text-red-600 font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

