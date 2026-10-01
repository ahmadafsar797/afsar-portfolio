import React, { useEffect, useRef, useState } from 'react';

type CursorMode = 'default' | 'play' | 'view' | 'open' | 'drag';

export const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -100, y: -100 });
  const targetRef = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number>(0);
  const [mode, setMode] = useState<CursorMode>('default');
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const lerp = (a: number, b: number, n: number) => a + (b - a) * n;

    const animate = () => {
      posRef.current.x = lerp(posRef.current.x, targetRef.current.x, 0.16);
      posRef.current.y = lerp(posRef.current.y, targetRef.current.y, 0.16);

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetRef.current.x}px, ${targetRef.current.y}px, 0)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    const onMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
    };

    const onEnter = () => setIsVisible(true);
    const onLeave = () => setIsVisible(false);
    const onDown = () => setIsPressed(true);
    const onUp = () => setIsPressed(false);

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseenter', onEnter);
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    // Detect cursor mode based on hovered element
    const updateMode = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const closest = el.closest('[data-cursor]') as HTMLElement | null;
      if (closest && closest.dataset.cursor) {
        setMode(closest.dataset.cursor as CursorMode);
      } else {
        setMode('default');
      }
    };
    window.addEventListener('mouseover', updateMode, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseover', updateMode);
    };
  }, [isVisible]);

  const isExpanded = mode !== 'default';
  const label =
    mode === 'play'
      ? 'PLAY'
      : mode === 'view'
      ? 'OPEN'
      : mode === 'open'
      ? 'OPEN'
      : mode === 'drag'
      ? 'DRAG'
      : '';

  return (
    <>
      {/* Outer magnetic follower ring */}
      <div
        ref={cursorRef}
        className="hidden md:block fixed top-0 left-0 pointer-events-none z-[99999]"
        style={{
          willChange: 'transform',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.25s ease-out',
        }}
      >
        <div
          style={{
            width: isExpanded ? '68px' : '32px',
            height: isExpanded ? '68px' : '32px',
            marginLeft: isExpanded ? '-34px' : '-16px',
            marginTop: isExpanded ? '-34px' : '-16px',
            borderRadius: '50%',
            border: isExpanded
              ? '2px solid #C65D45'
              : '1.5px solid rgba(43, 23, 15, 0.75)',
            backgroundColor: isExpanded
              ? 'rgba(198, 93, 69, 0.92)'
              : 'rgba(255, 249, 242, 0.15)',
            boxShadow: isExpanded
              ? '0 8px 24px rgba(198, 93, 69, 0.35)'
              : '0 2px 8px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition:
              'width 0.28s cubic-bezier(0.22, 1, 0.36, 1), height 0.28s cubic-bezier(0.22, 1, 0.36, 1), margin 0.28s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.25s ease, border-color 0.25s ease, transform 0.15s ease-out',
            transform: isPressed ? 'scale(0.88)' : 'scale(1)',
          }}
        >
          {isExpanded && (
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: '#FFF9F2',
                userSelect: 'none',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
              }}
            >
              {label}
            </span>
          )}
        </div>
      </div>

      {/* Center sharp dot */}
      <div
        ref={dotRef}
        className="hidden md:block fixed top-0 left-0 pointer-events-none z-[99999]"
        style={{
          width: '5px',
          height: '5px',
          marginLeft: '-2.5px',
          marginTop: '-2.5px',
          borderRadius: '50%',
          backgroundColor: isExpanded ? '#FFF9F2' : '#C65D45',
          boxShadow: '0 0 3px rgba(0,0,0,0.5)',
          willChange: 'transform',
          opacity: isVisible ? 1 : 0,
          transition: 'background-color 0.2s, opacity 0.25s',
        }}
      />
    </>
  );
};
