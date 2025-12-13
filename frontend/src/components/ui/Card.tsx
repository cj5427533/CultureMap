import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export const Card = ({ children, className = '', title }: CardProps) => {
  return (
    <div className={`card ${className}`}>
      {/* 시각적 위계: 제목 스타일 개선 */}
      {title && (
        <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-900 leading-tight">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

