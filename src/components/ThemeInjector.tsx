import React, { useEffect } from 'react';
import { SettingsData } from '../types';
import { hexToRgb, adjustBrightness, getLuminance } from '../utils/themePresets';

interface ThemeInjectorProps {
  settings?: SettingsData | null;
}

export const ThemeInjector: React.FC<ThemeInjectorProps> = ({ settings }) => {
  const canvas = settings?.theme_canvas_color || '#F8F1E7';
  const surface = settings?.theme_surface_color || '#FFF9F2';
  const text = settings?.theme_text_color || '#2B170F';
  const muted = settings?.theme_muted_color || '#756A62';
  const primary = settings?.theme_primary_color || '#C65D45';
  const arch = settings?.hero_arch_color || '#FF5023';

  const isDark = getLuminance(canvas) < 0.35;
  const borderSubtle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(43, 23, 15, 0.1)';
  const elevatedSurface = isDark ? surface : '#2B170F';
  const tactilePillBg = isDark ? adjustBrightness(canvas, 10) : '#180E09';

  const primaryRgb = hexToRgb(primary);
  const primaryLight = adjustBrightness(primary, 18);
  const primaryGlow = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.45)`;
  const primaryGlowStrong = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.7)`;
  const buttonTextColor = getLuminance(primary) > 0.48 ? '#0B0B0E' : '#FFFFFF';

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
        --theme-primary-light: ${primaryLight};
        --theme-arch: ${arch};
        --theme-text: ${text};
        --theme-muted: ${muted};
      }

      body, #root {
        background-color: ${canvas} !important;
        color: ${muted} !important;
      }

      ::selection {
        background: ${primary} !important;
        color: ${buttonTextColor} !important;
      }

      /* 1. Base Background Overrides */
      [class~="bg-[#F8F1E7]"],
      [class~="bg-[#0E0907]"] {
        background-color: ${canvas} !important;
      }
      [class~="bg-[#FFF9F2]"] {
        background-color: ${surface} !important;
      }
      [class~="bg-[#C65D45]"] {
        background-color: ${primary} !important;
      }

      /* 2. Typography Overrides */
      [class~="text-[#2B170F]"] {
        color: ${text} !important;
      }
      [class~="text-[#756A62]"],
      [class~="text-[#5C4A3D]"] {
        color: ${muted} !important;
      }
      [class~="text-[#C65D45]"] {
        color: ${primary} !important;
      }
      [class~="decoration-[#C65D45]"] {
        text-decoration-color: ${primary} !important;
      }

      /* 3. Border Color Overrides */
      [class~="border-[#C65D45]"] {
        border-color: ${primary} !important;
      }
      [class~="border-[#2B170F]/5"],
      [class~="border-[#2B170F]/8"],
      [class~="border-[#2B170F]/10"],
      [class~="border-[#2B170F]/12"],
      [class~="border-[#2B170F]/15"],
      [class~="border-[#2B170F]/20"],
      [class~="border-[#2B170F]/30"],
      [class~="border-[#2B170F]/40"],
      [class~="border-[#2B170F]/50"] {
        border-color: ${borderSubtle} !important;
      }

      /* 4. Primary Gradient CTA Buttons (Navbar, Hero, Selected Projects, Testimonials) */
      .group\\/navbtn,
      .group\\/mobilebtn,
      .group\\/explore,
      .group\\/play,
      .group\\/story,
      .group\\/filter[class*="from-[#C65D45]"],
      [class*="from-[#C65D45]"][class*="to-[#E2725B]"],
      [class*="from-[#C65D45]"][class*="to-[#D8684F]"] {
        background-image: linear-gradient(135deg, ${primary} 0%, ${primaryLight} 100%) !important;
        color: ${buttonTextColor} !important;
        border-color: ${primary} !important;
        box-shadow: 0 4px 20px ${primaryGlow} !important;
      }
      .group\\/navbtn:hover,
      .group\\/mobilebtn:hover,
      .group\\/explore:hover,
      .group\\/play:hover,
      .group\\/story:hover {
        box-shadow: 0 6px 30px ${primaryGlowStrong} !important;
        filter: brightness(1.08) !important;
      }
      .group\\/navbtn span,
      .group\\/mobilebtn span,
      .group\\/explore span,
      .group\\/play span,
      .group\\/story span {
        color: ${buttonTextColor} !important;
      }
      .group\\/play svg,
      .group\\/story svg {
        color: ${buttonTextColor} !important;
        fill: ${buttonTextColor} !important;
      }

      /* 5. Navbar Capsule, Bold Nav Links & Mobile Menu */
      header [class~="bg-[#2B170F]"],
      .navbar-capsule {
        background-color: ${elevatedSurface} !important;
        border-color: ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.1)'} !important;
      }
      header [class*="text-[#FFF9F2]"] {
        color: ${isDark ? '#FFFFFF' : '#FFF9F2'} !important;
      }
      header nav a,
      header nav span,
      header .sm\\:hidden a,
      [data-font="nav"] {
        font-weight: 700 !important;
      }
      header .sm\\:hidden[class*="bg-[#2B170F]"] {
        background-color: ${elevatedSurface} !important;
        border-color: ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.15)'} !important;
      }

      /* Strictly enforce minimum 500 Medium — no 300 Light or 400 Regular */
      .font-light,
      .font-extralight,
      .font-thin,
      .font-normal {
        font-weight: 500 !important;
      }

      /* 6. Hero Tactile Switch & Secondary Pill Buttons */
      [class~="bg-[#180E09]"] {
        background-color: ${tactilePillBg} !important;
        border-color: ${borderSubtle} !important;
        box-shadow: inset 0 3px 8px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.3) !important;
      }
      [class*="from-[#341C13]"] {
        background-image: linear-gradient(180deg, ${isDark ? '#232634' : '#341C13'} 0%, ${isDark ? '#141620' : '#160B06'} 100%) !important;
        border-color: ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.2)'} !important;
      }
      .group\\/hire,
      [class*="from-[#28150D]"] {
        background-image: linear-gradient(180deg, ${isDark ? 'rgba(255,255,255,0.08)' : '#28150D'} 0%, ${isDark ? 'rgba(255,255,255,0.02)' : '#140A06'} 100%) !important;
        border-color: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(43,23,15,0.5)'} !important;
        color: #FFFFFF !important;
      }
      .group\\/hire:hover {
        border-color: ${primary} !important;
        box-shadow: 0 4px 22px ${primaryGlow} !important;
      }

      /* 7. Hero Circular Rotating "Hire Me" Badge & Floating Tags */
      a[href="#contact"].rounded-full[class*="bg-[#2B170F]"],
      a[href="#contact"][class*="w-20"][class*="rounded-full"],
      a[href="#contact"][class*="w-24"][class*="rounded-full"] {
        background-color: ${elevatedSurface} !important;
        border-color: ${isDark ? 'rgba(255, 255, 255, 0.25)' : '#FFF9F2'} !important;
      }
      #hireCirclePath ~ text,
      text[class*="fill-[#C65D45]"] {
        fill: ${primary} !important;
      }
      a[href="#contact"] div[class*="bg-[#C65D45]"] {
        background-color: ${primary} !important;
        color: ${buttonTextColor} !important;
      }
      div[class*="bg-[#2B170F] text-[#FFF9F2]"] {
        background-color: ${elevatedSurface} !important;
        border-color: ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.2)'} !important;
        color: #FFFFFF !important;
      }
      div[class*="bg-[#C65D45] text-[#2B170F]"] {
        background-color: ${primary} !important;
        color: ${buttonTextColor} !important;
      }

      /* 8. Reels Category Filter Buttons */
      .group\\/filter {
        font-weight: 700 !important;
      }
      button[class*="bg-[#2B170F]/8"],
      button[class*="bg-[#2B170F]/10"] {
        background-color: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(43, 23, 15, 0.08)'} !important;
        color: ${isDark ? '#CBD5E1' : '#5C4A3D'} !important;
        font-weight: 700 !important;
      }
      button[class*="bg-[#2B170F]/8"]:hover,
      button[class*="bg-[#2B170F]/10"]:hover {
        background-color: ${isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(43, 23, 15, 0.14)'} !important;
        color: ${text} !important;
      }

      /* 9. WhatsApp Feature Card & Direct Contact Cards */
      [class*="from-[#2B170F]"][class*="via-[#331C13]"] {
        background-image: linear-gradient(135deg, ${elevatedSurface} 0%, ${isDark ? adjustBrightness(canvas, 8) : '#20110B'} 100%) !important;
        border-color: ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.1)'} !important;
      }
      #contact a[class*="bg-[#F8F1E7]"] {
        background-color: ${surface} !important;
        border-color: ${borderSubtle} !important;
        color: ${text} !important;
      }
      #contact a[class*="bg-[#F8F1E7]"]:hover {
        background-color: ${isDark ? adjustBrightness(surface, 8) : '#ece4da'} !important;
      }

      /* 10. Services & Process Cards */
      .service-card {
        background-color: ${surface} !important;
      }
      .service-card [class*="from-[#2B170F]"] {
        background-image: linear-gradient(180deg, ${elevatedSurface} 0%, ${isDark ? canvas : '#180D07'} 100%) !important;
      }
      .service-card:hover .service-icon-box,
      .service-card:active .service-icon-box {
        background-color: ${primary} !important;
        border-color: ${primary} !important;
      }
      .service-card:hover .service-icon-box svg,
      .service-card:active .service-icon-box svg,
      .service-card:hover svg.service-icon,
      .service-card:active svg.service-icon {
        color: #FFFFFF !important;
        stroke: #FFFFFF !important;
      }
      .service-card:hover h3,
      .service-card:active h3 {
        color: #FFFFFF !important;
      }
      .service-card:hover p,
      .service-card:active p {
        color: rgba(255, 255, 255, 0.85) !important;
      }
      .process-step {
        background-color: ${surface} !important;
      }

      /* 11. Footer */
      footer[class*="bg-[#2B170F]"],
      footer {
        background-color: ${elevatedSurface} !important;
        border-top-color: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 249, 242, 0.1)'} !important;
      }

      /* 12. Hero Bottom Edge Fade */
      .from-\\[\\#0E0907\\],
      .from-\\[\\#F8F1E7\\] {
        --tw-gradient-from: ${canvas} var(--tw-gradient-from-position, 0%) !important;
        --tw-gradient-to: rgba(0, 0, 0, 0) var(--tw-gradient-to-position, 100%) !important;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
      }

      /* 13. Hover & Group-Hover States (activates ONLY on hover) */
      [class~="hover:bg-[#C65D45]"]:hover {
        background-color: ${primary} !important;
        color: ${buttonTextColor} !important;
      }
      [class~="hover:text-[#C65D45]"]:hover {
        color: ${primary} !important;
      }
      [class~="hover:border-[#C65D45]"]:hover {
        border-color: ${primary} !important;
      }

      .group:hover [class~="group-hover:bg-[#C65D45]"],
      .group:active [class~="group-active:bg-[#C65D45]"] {
        background-color: ${primary} !important;
        color: ${buttonTextColor} !important;
      }
      .group:hover [class~="group-hover:text-[#C65D45]"],
      .group:active [class~="group-active:text-[#C65D45]"] {
        color: ${primary} !important;
      }
      .group:hover [class~="group-hover:border-[#C65D45]"],
      .group:active [class~="group-active:border-[#C65D45]"] {
        border-color: ${primary} !important;
      }

      /* 14. Custom Scrollbar */
      ::-webkit-scrollbar-track {
        background: ${canvas} !important;
      }
      ::-webkit-scrollbar-thumb {
        background: ${isDark ? 'rgba(255, 255, 255, 0.22)' : '#e2d7c9'} !important;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: ${primary} !important;
      }
    `;

    return () => {};
  }, [canvas, surface, text, muted, primary, arch, isDark, borderSubtle, elevatedSurface, tactilePillBg, primaryLight, primaryGlow, primaryGlowStrong, buttonTextColor]);

  return null;
};

