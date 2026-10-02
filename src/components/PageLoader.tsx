import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface PageLoaderProps {
  onComplete: () => void;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Safety: always complete within 2.5s even if GSAP fails
    const safetyTimer = setTimeout(() => {
      onComplete();
    }, 2500);

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      clearTimeout(safetyTimer);
      onComplete();
      return;
    }

    const tl = gsap.timeline();

    // Initial values
    gsap.set([leftRef.current, rightRef.current], { xPercent: 0 });
    gsap.set(textRef.current, { opacity: 0, y: 16 });
    gsap.set(subtitleRef.current, { opacity: 0, y: 8 });
    gsap.set(barRef.current, { width: '0%' });

    tl
      // Brand name & subtitle rise smoothly
      .to(textRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: 'power3.out',
      }, 0)
      .to(subtitleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: 'power2.out',
      }, 0.1)
      // Progress line expands
      .to(barRef.current, {
        width: '100%',
        duration: 0.45,
        ease: 'power2.inOut',
      }, 0.08)
      // Content softly fades
      .to([textRef.current, subtitleRef.current, barRef.current?.parentElement], {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: 'power2.in',
      }, 0.48)
      // Curtain panels part left & right
      .to(leftRef.current, {
        xPercent: -100,
        duration: 0.5,
        ease: 'power3.inOut',
      }, 0.55)
      .to(rightRef.current, {
        xPercent: 100,
        duration: 0.5,
        ease: 'power3.inOut',
      }, 0.55)
      // Complete callback right as curtains open
      .call(() => {
        clearTimeout(safetyTimer);
        onComplete();
      }, undefined, 0.7);

    return () => {
      tl.kill();
      clearTimeout(safetyTimer);
    };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        pointerEvents: 'none',
      }}
    >
      {/* Left curtain panel */}
      <div
        ref={leftRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          background: '#2B170F',
          boxShadow: '10px 0 30px rgba(0,0,0,0.3)',
        }}
      />
      {/* Right curtain panel */}
      <div
        ref={rightRef}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '100%',
          background: '#2B170F',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
        }}
      />

      {/* Center brand lockup */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          ref={textRef}
          style={{
            fontFamily: 'Pogonia, Montserrat, serif',
            fontSize: 'clamp(28px, 4.5vw, 52px)',
            fontWeight: 700,
            color: '#C65D45',
            letterSpacing: '-0.02em',
            display: 'block',
          }}
        >
          AFSAR AHMAD
        </span>

        <div
          ref={subtitleRef}
          style={{
            marginTop: '6px',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(255, 249, 242, 0.55)',
          }}
        >
          Video Editor & Colorist
        </div>

        <div
          style={{
            marginTop: '20px',
            width: '160px',
            height: '2px',
            background: 'rgba(255, 249, 242, 0.12)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            ref={barRef}
            style={{
              height: '100%',
              background: '#C65D45',
              borderRadius: '2px',
              width: '0%',
            }}
          />
        </div>
      </div>
    </div>
  );
};
