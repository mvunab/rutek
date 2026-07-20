import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  findNavTourTarget,
  getNavTourSteps,
  isNavTourCompleted,
  markNavTourCompleted,
  type NavTourStep,
} from '../../lib/navTour';
import type { Tenant, UserRole } from '../../types';
import { useNavTourStore } from '../../store/useNavTourStore';

interface NavbarTourProps {
  userId: string;
  role: UserRole;
  isSuperAdmin: boolean;
  tenant?: Tenant | null;
  onPrepareSidebar: () => void;
  onTourEnd?: () => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface BubblePlacement {
  top: number;
  left: number;
  placement: 'right' | 'bottom' | 'center';
}

const START_DELAY_MS = 700;
const MANUAL_START_DELAY_MS = 150;
const PADDING = 8;
const BUBBLE_GAP = 14;

function computeSpotlight(el: HTMLElement): SpotlightRect {
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  };
}

function computeBubble(
  spotlight: SpotlightRect | null,
  bubbleSize: { width: number; height: number },
): BubblePlacement {
  if (!spotlight) {
    return {
      top: Math.max(16, (window.innerHeight - bubbleSize.height) / 2),
      left: Math.max(16, (window.innerWidth - bubbleSize.width) / 2),
      placement: 'center',
    };
  }

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const preferRight = spotlight.left + spotlight.width + BUBBLE_GAP + bubbleSize.width < viewportW - 16;

  if (preferRight) {
    const top = Math.min(
      Math.max(16, spotlight.top + spotlight.height / 2 - bubbleSize.height / 2),
      viewportH - bubbleSize.height - 16,
    );
    return {
      top,
      left: spotlight.left + spotlight.width + BUBBLE_GAP,
      placement: 'right',
    };
  }

  const top = Math.min(spotlight.top + spotlight.height + BUBBLE_GAP, viewportH - bubbleSize.height - 16);
  const left = Math.min(
    Math.max(16, spotlight.left + spotlight.width / 2 - bubbleSize.width / 2),
    viewportW - bubbleSize.width - 16,
  );
  return { top, left, placement: 'bottom' };
}

export function NavbarTour({
  userId,
  role,
  isSuperAdmin,
  tenant = null,
  onPrepareSidebar,
  onTourEnd,
}: NavbarTourProps) {
  const titleId = useId();
  const bodyId = useId();
  const bubbleRef = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState<NavTourStep[]>([]);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [bubblePos, setBubblePos] = useState<BubblePlacement>({
    top: 0,
    left: 0,
    placement: 'center',
  });

  const finish = useCallback(() => {
    markNavTourCompleted(userId);
    setActive(false);
    onTourEnd?.();
  }, [userId, onTourEnd]);

  const syncLayout = useCallback(() => {
    const step = steps[stepIndex];
    if (!step) return;

    if (!step.target) {
      setSpotlight(null);
      const bubbleEl = bubbleRef.current;
      const width = bubbleEl?.offsetWidth ?? 320;
      const height = bubbleEl?.offsetHeight ?? 180;
      setBubblePos(computeBubble(null, { width, height }));
      return;
    }

    const el = findNavTourTarget(step.target);
    if (!el) {
      setSpotlight(null);
      return;
    }

    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    const nextSpotlight = computeSpotlight(el);
    setSpotlight(nextSpotlight);

    const bubbleEl = bubbleRef.current;
    const width = bubbleEl?.offsetWidth ?? 320;
    const height = bubbleEl?.offsetHeight ?? 180;
    setBubblePos(computeBubble(nextSpotlight, { width, height }));
  }, [stepIndex, steps]);

  const startNonce = useNavTourStore((s) => s.startNonce);

  const beginTour = useCallback(() => {
    const tourSteps = getNavTourSteps(role, isSuperAdmin, tenant);
    if (tourSteps.length <= 1) return;
    onPrepareSidebar();
    setSteps(tourSteps);
    setStepIndex(0);
    setActive(true);
  }, [role, isSuperAdmin, tenant, onPrepareSidebar]);

  useEffect(() => {
    if (isNavTourCompleted(userId)) return;

    const tourSteps = getNavTourSteps(role, isSuperAdmin, tenant);
    if (tourSteps.length <= 1) return;

    const timer = window.setTimeout(beginTour, START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [userId, role, isSuperAdmin, tenant, beginTour]);

  useEffect(() => {
    if (startNonce === 0) return;
    const timer = window.setTimeout(beginTour, MANUAL_START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [startNonce, beginTour]);

  useLayoutEffect(() => {
    if (!active) return;
    syncLayout();
  }, [active, stepIndex, steps, syncLayout]);

  useEffect(() => {
    if (!active) return;

    const onReflow = () => syncLayout();
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);

    return () => {
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [active, syncLayout]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, finish]);

  useEffect(() => {
    if (!active) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [active]);

  if (!active || steps.length === 0) return null;

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  const goNext = () => {
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    if (!isFirst) setStepIndex((i) => i - 1);
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] motion-reduce:transition-none" aria-hidden={false}>
      {/* Backdrop con recorte visual vía box-shadow */}
      {spotlight ? (
        <div
          className="pointer-events-none fixed rounded-xl ring-2 ring-primary-500 ring-offset-2 ring-offset-transparent motion-reduce:transition-none transition-[top,left,width,height] duration-200 ease-out"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.62)',
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-[1px] motion-reduce:backdrop-blur-none" />
      )}

      <div
        ref={bubbleRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className={clsx(
          'fixed z-[201] w-[min(100vw-2rem,22rem)] rounded-2xl border border-stone-200/80 dark:border-stone-700',
          'bg-white dark:bg-stone-900 shadow-2xl p-5 motion-reduce:transition-none transition-[top,left] duration-200 ease-out',
        )}
        style={{ top: bubblePos.top, left: bubblePos.left }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 tabular-nums">
            Paso {stepIndex + 1} de {steps.length}
          </p>
          <button
            type="button"
            onClick={finish}
            aria-label="Cerrar tour"
            className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <h2 id={titleId} className="text-base font-semibold text-stone-900 dark:text-stone-100 text-pretty">
          {step.title}
        </h2>
        <p id={bodyId} className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400 text-pretty">
          {step.body}
        </p>

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={finish}
            className="text-xs font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded px-1"
          >
            Saltar tour
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button type="button" variant="secondary" size="sm" onClick={goBack}>
                Atrás
              </Button>
            )}
            <Button type="button" variant="primary" size="sm" onClick={goNext}>
              {isLast ? 'Finalizar' : 'Siguiente'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
