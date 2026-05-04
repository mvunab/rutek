import { useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

/**
 * Envuelve una vista completa y reproduce la animación de entrada al montar
 * (p. ej. al navegar a /login o a una ruta sin AppLayout).
 */
export function AnimatedPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pathname } = useLocation();
  return (
    <div
      key={pathname}
      className={clsx(
        'animate-page-enter motion-reduce:animate-none',
        className,
      )}
    >
      {children}
    </div>
  );
}
