import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  children: ReactNode;
}

export const Button = ({ variant = 'primary', children, className = '', disabled, ...props }: ButtonProps) => {
  // 일관성과 대비: 버튼 변형 스타일 개선
  const variantClasses = {
    primary: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl border-2 border-green-600',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-md hover:shadow-lg border-2 border-gray-600',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl border-2 border-emerald-600',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg border-2 border-red-600',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold shadow-md hover:shadow-lg border-2 border-yellow-600',
  };

  // 타이포그래피와 여백: 기본 클래스 개선
  const baseClasses = 'px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 touch-target';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className} transform hover:scale-105 active:scale-95`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

