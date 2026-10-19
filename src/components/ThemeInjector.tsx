import React, { useEffect } from 'react';
import { SettingsData } from '../types';

interface ThemeInjectorProps {
  settings?: SettingsData | null;
}

function getLuminance(hex: string): number {
  if (!hex || typeof hex !== 'string') return 0.5;
  const clean = hex.replace('#', '');
  if (clean.length < 6) return 0.5;
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const ThemeInjector: React.FC<ThemeInjectorProps> = ({ settings }) => {
  const canvas = settings?.theme_canvas_color || '#F8F1E7';
  const surface = settings?.theme_surface_color || '#FFF9F2';
  const text = settings?.theme_text_color || '#2B170F';
  const muted = settings?.theme_muted_color || '#756A62';
  const primary = settings?.theme_primary_color || '#C65D45';
  const arch = settings?.hero_arch_color || '#FF5023';

  const isDark = getLuminance(canvas) < 0.35;
  const isSurfaceDark = getLuminance(surface) < 0.35;
  const borderSubtle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(43, 23, 15, 0.1)';
  const borderCard = isSurfaceDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(43, 23, 15, 0.12)';

  useEffect(() => {
    let styleEl = document.getElementById('portfolio-dynamic-theme-styles') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'portfolio-dynamic-theme-styles';
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      :root {
        --color-canvas: ${canvas};
        --color-surface: ${surface};
        --color-dark: ${text};
        --color-cream: ${canvas};
        --color-chocolate: ${text};
        --color-golden: ${primary};
        --color-warm-gray: ${muted};
        --theme-primary: ${primary};
        --theme-arch: ${arch};
      }

      body {
        background-color: ${canvas} !important;
        color: ${muted} !important;
      }

      /* Background Canvas Overrides */
      [class*="bg-[#F8F1E7]"], .bg-\\[\\#F8F1E7\\] {
        background-color: ${canvas} !important;
      }

      /* Card Surface Overrides */
      [class*="bg-[#FFF9F2]"], .bg-\\[\\#FFF9F2\\] {
        background-color: ${surface} !important;
      }

      /* Heading & Dark Text Overrides */
      [class*="text-[#2B170F]"], .text-\\[\\#2B170F\\] {
        color: ${text} !important;
      }

      /* Body & Muted Text Overrides */
      [class*="text-[#756A62]"], .text-\\[\\#756A62\\] {
        color: ${muted} !important;
      }

      /* Accent Highlights & Text */
      [class*="text-[#C65D45]"], .text-\\[\\#C65D45\\] {
        color: ${primary} !important;
      }
      [class*="bg-[#C65D45]"], .bg-\\[\\#C65D45\\] {
        background-color: ${primary} !important;
      }
      [class*="border-[#C65D45]"], .border-\\[\\#C65D45\\] {
        border-color: ${primary} !important;
      }
      [class*="decoration-[#C65D45]"] {
        text-decoration-color: ${primary} !important;
      }

      /* Hover States */
      [class*="hover:border-[#C65D45]"]:hover {
        border-color: ${primary} !important;
      }
      [class*="hover:text-[#C65D45]"]:hover {
        color: ${primary} !important;
      }
      [class*="hover:bg-[#C65D45]"]:hover {
        background-color: ${primary} !important;
      }

      /* Subtle Dividers & Card Borders */
      [class*="border-[#2B170F]/"], .border-\\[\\#2B170F\\]\\/10, .border-\\[\\#2B170F\\]\\/15, .border-\\[\\#2B170F\\]\\/20 {
        border-color: ${borderSubtle} !important;
      }

      /* Hero Arch SVG Fill */
      [data-hero-arch] path, [data-hero-arch] {
        fill: ${arch} !important;
      }

      /* Custom Scrollbar */
      ::-webkit-scrollbar-track {
        background: ${canvas} !important;
      }
      ::-webkit-scrollbar-thumb {
        background: ${isDark ? 'rgba(255, 255, 255, 0.25)' : '#e2d7c9'} !important;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: ${primary} !important;
      }
    `;

    return () => {
      // Keep style on unmount so layout does not flicker
    };
  }, [canvas, surface, text, muted, primary, arch, isDark, isSurfaceDark, borderSubtle]);

  return null;
};
