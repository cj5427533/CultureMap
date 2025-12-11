import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { authService } from '../../services/authService';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <Header onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

