import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-8xl font-bold text-stone-200 mb-4">404</p>
        <h1 className="text-2xl font-bold text-stone-700 mb-2">Página no encontrada</h1>
        <p className="text-stone-400 mb-8">La ruta que buscas no existe</p>
        <Button onClick={() => navigate('/dashboard')} icon={<Home size={16} />}>
          Volver al dashboard
        </Button>
      </div>
    </div>
  );
}
