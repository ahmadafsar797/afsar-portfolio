/**
 * Font loader utility: dynamically loads Google Fonts and applies them across the entire website
 */

export interface FontOption {
  name: string;
  category: string;
  preview: string;
}

export const POPULAR_FONTS: FontOption[] = [
  { name: 'Pogonia', category: 'Luxury Editorial (Default Heading)', preview: 'Pogonia • Cinematic Master' },
  { name: 'Montserrat', category: 'Modern Geometric (Default Body)', preview: 'Montserrat • Clean & Crisp' },
  { name: 'Inter', category: 'Clean Modern Tech', preview: 'Inter • Precision & Flow' },
  { name: 'Poppins', category: 'Bold Geometric Sans', preview: 'Poppins • Striking & Modern' },
  { name: 'Outfit', category: 'Futuristic Minimalist', preview: 'Outfit • Sleek & Polished' },
  { name: 'Plus Jakarta Sans', category: 'Contemporary Neo-Grotesk', preview: 'Plus Jakarta • High-End Tech' },
  { name: 'Syne', category: 'Artistic High-Impact Display', preview: 'Syne • Bold Artistic Cut' },
  { name: 'Space Grotesk', category: 'Brutalist / Cyber', preview: 'Space Grotesk • Raw Motion' },
  { name: 'Cinzel', category: 'Cinematic & Classical', preview: 'Cinzel • Roman Prestige' },
  { name: 'Playfair Display', category: 'Luxury Editorial Serif', preview: 'Playfair • Editorial Vogue' },
  { name: 'Oswald', category: 'Punchy Condensed Title', preview: 'Oswald • Loud & Focused' },
  { name: 'Bebas Neue', category: 'All-Caps Poster Display', preview: 'Bebas Neue • Bold Impact' },
  { name: 'DM Sans', category: 'Geometric Balanced Sans', preview: 'DM Sans • Smooth Typography' },
  { name: 'Raleway', category: 'Elegant & Sophisticated', preview: 'Raleway • Refined Angles' },
  { name: 'Urbanist', category: 'Architectural Geometric', preview: 'Urbanist • Balanced Pacing' },
  { name: 'Sora', category: 'Modern Digital Display', preview: 'Sora • High Readability' },
  { name: 'Manrope', category: 'Semi-condensed Modern', preview: 'Manrope • Dynamic Rhythm' },
];

/**
 * Injects a Google Font stylesheet if not already present
 */
export function loadGoogleFont(fontName: string) {
  if (!fontName) return;
  const clean = fontName.trim();
  if (clean.toLowerCase() === 'pogonia') return; // Locally hosted font

  const linkId = `google-font-${clean.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  if (document.getElementById(linkId)) return;

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  const encodedName = clean.replace(/\s+/g, '+');
  link.href = `https://fonts.googleapis.com/css2?family=${encodedName}:ital,wght@0,300..900;1,300..900&display=swap`;

  link.onerror = () => {
    // If variable weight range fails, fallback to simple family query
    link.href = `https://fonts.googleapis.com/css2?family=${encodedName}&display=swap`;
  };

  document.head.appendChild(link);
}

/**
 * Applies custom heading and body fonts across the entire website via CSS custom properties and styles
 */
export function applyDynamicFonts(headingFont?: string, bodyFont?: string) {
  const hFont = (headingFont && headingFont.trim()) || 'Pogonia';
  const bFont = (bodyFont && bodyFont.trim()) || 'Montserrat';

  // Load Google Fonts
  loadGoogleFont(hFont);
  loadGoogleFont(bFont);

  // Set CSS Variables
  const root = document.documentElement;
  root.style.setProperty('--font-custom-heading', `'${hFont}', 'Pogonia', 'Montserrat', serif`);
  root.style.setProperty('--font-custom-body', `'${bFont}', 'Montserrat', system-ui, sans-serif`);

  // Direct body style
  document.body.style.fontFamily = `'${bFont}', 'Montserrat', system-ui, sans-serif`;

  // Inject or update global style override element
  let styleEl = document.getElementById('dynamic-font-styles') as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-font-styles';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    :root {
      --font-pogonia: '${hFont}', 'Pogonia', 'Montserrat', serif !important;
      --font-montserrat: '${bFont}', 'Montserrat', system-ui, sans-serif !important;
      --font-sans: '${bFont}', 'Montserrat', system-ui, sans-serif !important;
    }
    .font-pogonia, .font-editorial, .font-serif {
      font-family: '${hFont}', 'Pogonia', 'Montserrat', serif !important;
    }
    .font-montserrat, .font-sans, .font-ui, body, button, input, select, textarea {
      font-family: '${bFont}', 'Montserrat', system-ui, sans-serif !important;
    }
  `;
}
