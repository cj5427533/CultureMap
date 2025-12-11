import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  children: ReactNode;
}

export const Button = ({ variant = 'primary', children, className = '', ...props }: ButtonProps) => {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    warning: 'btn-warning',
  };

  return (
    <button
      className={`btn ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

