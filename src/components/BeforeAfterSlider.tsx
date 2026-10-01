import React, { useRef, useCallback, useEffect } from 'react';
import { Sliders } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  title?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Raw LOG Profile',
  afterLabel = 'Final Color Grade & Film Master',
  title = 'Interactive Color Grade Comparison',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const beforeRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const positionRef = useRef(50);
  const rafRef = useRef<number>(0);

  const applyPosition = useCallback((pct: number) => {
    const clamped = Math.max(2, Math.min(98, pct));
    positionRef.current = clamped;
    if (lineRef.current) lineRef.current.style.left = `${clamped}%`;
    if (handleRef.current) handleRef.current.style.left = `${clamped}%`;
    if (beforeRef.current) beforeRef.current.style.width = `${clamped}%`;
  }, []);

  const getPercent = useCallback((clientX: number) => {
    if (!containerRef.current) return 50;
    const rect = containerRef.current.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }, []);

  // Smooth drag using rAF
  const targetPct = useRef(50);

  const smoothUpdate = useCallback(() => {
    if (!isDraggingRef.current) return;
    const current = positionRef.current;
    const target = targetPct.current;
    const next = current + (target - current) * 0.25; // lerp for buttery smoothness
    applyPosition(next);
    rafRef.current = requestAnimationFrame(smoothUpdate);
  }, [applyPosition]);

  const startDrag = useCallback(() => {
    isDraggingRef.current = true;
    rafRef.current = requestAnimationFrame(smoothUpdate);
    if (handleRef.current) handleRef.current.style.transform = 'translate(-50%, -50%) scale(1.2)';
  }, [smoothUpdate]);

  const endDrag = useCallback(() => {
    isDraggingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (handleRef.current) handleRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    targetPct.current = getPercent(e.clientX);
  }, [getPercent]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    targetPct.current = getPercent(e.touches[0].clientX);
  }, [getPercent]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', endDrag);
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', endDrag);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', endDrag);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', endDrag);
    };
  }, [onMouseMove, onTouchMove, endDrag]);

  return (
    <div className="w-full">
      {title && (
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-montserrat uppercase tracking-wider text-[#756A62] font-semibold flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#C65D45]" />
            <span>{title}</span>
          </span>
          <span className="text-[11px] font-montserrat font-bold text-[#C65D45]">Drag slider to compare</span>
        </div>
      )}

      <div
        ref={containerRef}
        data-cursor="drag"
        className="relative w-full aspect-16-9 rounded-2xl overflow-hidden select-none border border-[#2B170F]/15 shadow-xl bg-black"
        onMouseDown={(e) => {
          targetPct.current = getPercent(e.clientX);
          startDrag();
        }}
        onTouchStart={(e) => {
          targetPct.current = getPercent(e.touches[0].clientX);
          startDrag();
        }}
        style={{ cursor: 'ew-resize' }}
      >
        {/* AFTER Image */}
        <img
          src={afterImage}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* BEFORE Image - clipped */}
        <div
          ref={beforeRef}
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: '50%' }}
        >
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="absolute inset-0 h-full object-cover pointer-events-none"
            style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
          />
        </div>

        {/* Labels */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 px-2.5 sm:px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[9px] sm:text-[10px] font-montserrat uppercase tracking-wider text-white/80 pointer-events-none max-w-[46%] truncate">
          {beforeLabel}
        </div>
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 px-2.5 sm:px-3 py-1 rounded-full bg-[#C65D45] text-[#2B170F] text-[9px] sm:text-[10px] font-montserrat uppercase font-bold tracking-wider pointer-events-none shadow-md max-w-[48%] truncate">
          {afterLabel}
        </div>

        {/* Divider Line */}
        <div
          ref={lineRef}
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)] z-20 pointer-events-none"
          style={{ left: '50%' }}
        />

        {/* Handle */}
        <div
          ref={handleRef}
          className="absolute top-1/2 z-30 pointer-events-none"
          style={{
            left: '50%',
            transform: 'translate(-50%, -50%)',
            transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <div className="w-9 h-9 rounded-full bg-[#C65D45] text-[#2B170F] flex items-center justify-center shadow-xl border-2 border-white">
            <Sliders className="w-4 h-4 text-[#2B170F] transform rotate-90" />
          </div>
        </div>
      </div>
    </div>
  );
};
