import { useEffect, useState } from 'react';
import { addLoadingListener } from '../utils/api';

export const GlobalLoading = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const removeListener = addLoadingListener(setLoading);
    return removeListener;
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-gray-200">
        <div 
          className="h-full bg-green-600 transition-all duration-300"
          style={{ 
            width: '100%',
            background: 'linear-gradient(90deg, #16a34a 0%, #22c55e 50%, #16a34a 100%)',
            backgroundSize: '200% 100%',
            animation: 'loading 1.5s ease-in-out infinite'
          }}
        ></div>
      </div>
      <style>{`
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};
