/**
 * Font loader utility: dynamically loads Google Fonts and applies granular styling across the entire website
 */

export interface FontCategory {
  family: string;
  fonts: { name: string; label: string }[];
}

export const FONT_FAMILIES: FontCategory[] = [
  {
    family: 'Serif & Luxury Editorial',
    fonts: [
      { name: 'Pogonia', label: 'Pogonia (Custom Luxury — Default)' },
      { name: 'Cinzel', label: 'Cinzel (Cinematic & Epic)' },
      { name: 'Playfair Display', label: 'Playfair Display (Vogue Editorial)' },
      { name: 'Cormorant Garamond', label: 'Cormorant Garamond (Classical Elegance)' },
      { name: 'Bodoni Moda', label: 'Bodoni Moda (High-Fashion Title)' },
      { name: 'Prata', label: 'Prata (Refined Luxury Serif)' },
      { name: 'Lora', label: 'Lora (Contemporary Serif)' },
    ],
  },
  {
    family: 'Modern Sans-Serif',
    fonts: [
      { name: 'Montserrat', label: 'Montserrat (Geometric — Default)' },
      { name: 'Inter', label: 'Inter (Ultra-Clean Modern Tech)' },
      { name: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Premium Tech)' },
      { name: 'Poppins', label: 'Poppins (Bold & Friendly Geometric)' },
      { name: 'Outfit', label: 'Outfit (Sleek Futuristic)' },
      { name: 'DM Sans', label: 'DM Sans (Balanced & Crisp)' },
      { name: 'Urbanist', label: 'Urbanist (Minimalist Architecture)' },
      { name: 'Raleway', label: 'Raleway (Sophisticated Thin/Bold)' },
      { name: 'Manrope', label: 'Manrope (Modern Dynamic Pacing)' },
    ],
  },
  {
    family: 'Display & Bold Cinematic',
    fonts: [
      { name: 'Syne', label: 'Syne (Artistic High-Impact Display)' },
      { name: 'Bebas Neue', label: 'Bebas Neue (Punchy All-Caps Title)' },
      { name: 'Oswald', label: 'Oswald (Tall Impact Condensed)' },
      { name: 'Space Grotesk', label: 'Space Grotesk (Cyber / Raw Kinetic)' },
      { name: 'Anton', label: 'Anton (Heavy Impact Headline)' },
      { name: 'Righteous', label: 'Righteous (Retro Neo-Modern)' },
      { name: 'Russo One', label: 'Russo One (Heavy Solid Motion)' },
    ],
  },
  {
    family: 'Tech & Monospace',
    fonts: [
      { name: 'Space Mono', label: 'Space Mono (Brutalist Code)' },
      { name: 'JetBrains Mono', label: 'JetBrains Mono (Developer Clean)' },
      { name: 'Fira Code', label: 'Fira Code (Modern Monospace)' },
    ],
  },
];

// Flat list for quick lookups
export const ALL_PRESET_FONTS = FONT_FAMILIES.flatMap((cat) => cat.fonts);

export interface FontWeightOption {
  value: string;
  label: string;
}

export const FONT_WEIGHT_OPTIONS: FontWeightOption[] = [
  { value: '300', label: '300 — Light' },
  { value: '400', label: '400 — Regular' },
  { value: '500', label: '500 — Medium' },
  { value: '600', label: '600 — Semi-Bold' },
  { value: '700', label: '700 — Bold' },
  { value: '800', label: '800 — Extra Bold' },
  { value: '900', label: '900 — Black / Heavy' },
];

export interface TypographySettings {
  heading_font?: string;
  heading_font_weight?: string;
  body_font?: string;
  body_font_weight?: string;
  hero_title_font?: string;
  hero_title_font_weight?: string;
  section_title_font?: string;
  section_title_font_weight?: string;
  cta_font?: string;
  cta_font_weight?: string;
  badge_font?: string;
  badge_font_weight?: string;
  nav_font?: string;
  nav_font_weight?: string;
}

/**
 * Loads a single Google Font dynamically if not Pogonia
 */
export function loadGoogleFont(fontName?: string) {
  if (!fontName) return;
  const clean = fontName.trim();
  if (!clean || clean.toLowerCase() === 'pogonia' || clean.toLowerCase() === 'inherit') return;

  const linkId = `google-font-${clean.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  if (document.getElementById(linkId)) return;

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  const encodedName = clean.replace(/\s+/g, '+');
  link.href = `https://fonts.googleapis.com/css2?family=${encodedName}:ital,wght@0,300..900;1,300..900&display=swap`;

  link.onerror = () => {
    // Fallback without weight range for single-weight fonts
    link.href = `https://fonts.googleapis.com/css2?family=${encodedName}&display=swap`;
  };

  document.head.appendChild(link);
}

/**
 * Resolves a font name with fallback
 */
function resolveFont(font?: string, fallback: string = 'Montserrat') {
  if (!font || font.trim().toLowerCase() === 'inherit' || font.trim() === '') {
    return fallback;
  }
  return font.trim();
}

/**
 * Resolves a font weight with fallback
 */
function resolveWeight(weight?: string, fallback: string = '400') {
  if (!weight || weight.trim().toLowerCase() === 'inherit' || weight.trim() === '') {
    return fallback;
  }
  return weight.trim();
}

/**
 * Applies typography settings across the entire website
 */
export function applyDynamicFonts(
  settingsOrHeading?: TypographySettings | string,
  bodyFallback?: string
) {
  let settings: TypographySettings;

  if (typeof settingsOrHeading === 'object' && settingsOrHeading !== null) {
    settings = settingsOrHeading;
  } else {
    settings = {
      heading_font: settingsOrHeading,
      body_font: bodyFallback,
    };
  }

  const hFont = resolveFont(settings.heading_font, 'Pogonia');
  const bFont = resolveFont(settings.body_font, 'Montserrat');
  const heroFont = resolveFont(settings.hero_title_font, hFont);
  const secFont = resolveFont(settings.section_title_font, hFont);
  const ctaFont = resolveFont(settings.cta_font, bFont);
  const badgeFont = resolveFont(settings.badge_font, bFont);
  const navFont = resolveFont(settings.nav_font, bFont);

  // Weights
  const hWeight = resolveWeight(settings.heading_font_weight, '700');
  const bWeight = resolveWeight(settings.body_font_weight, '400');
  const heroWeight = resolveWeight(settings.hero_title_font_weight, hWeight);
  const secWeight = resolveWeight(settings.section_title_font_weight, hWeight);
  const ctaWeight = resolveWeight(settings.cta_font_weight, '700');
  const badgeWeight = resolveWeight(settings.badge_font_weight, '600');
  const navWeight = resolveWeight(settings.nav_font_weight, '600');

  // Load all selected Google fonts
  [hFont, bFont, heroFont, secFont, ctaFont, badgeFont, navFont].forEach(loadGoogleFont);

  // Set CSS Custom Properties on document root
  const root = document.documentElement;
  root.style.setProperty('--font-custom-heading', `'${hFont}', 'Pogonia', serif`);
  root.style.setProperty('--font-custom-body', `'${bFont}', 'Montserrat', system-ui, sans-serif`);
  root.style.setProperty('--font-custom-hero-title', `'${heroFont}', '${hFont}', 'Pogonia', serif`);
  root.style.setProperty('--font-custom-section-title', `'${secFont}', '${hFont}', 'Pogonia', serif`);
  root.style.setProperty('--font-custom-cta', `'${ctaFont}', '${bFont}', 'Montserrat', sans-serif`);
  root.style.setProperty('--font-custom-badge', `'${badgeFont}', '${bFont}', 'Montserrat', sans-serif`);
  root.style.setProperty('--font-custom-nav', `'${navFont}', '${bFont}', 'Montserrat', sans-serif`);

  root.style.setProperty('--font-weight-custom-heading', hWeight);
  root.style.setProperty('--font-weight-custom-body', bWeight);
  root.style.setProperty('--font-weight-custom-hero-title', heroWeight);
  root.style.setProperty('--font-weight-custom-section-title', secWeight);
  root.style.setProperty('--font-weight-custom-cta', ctaWeight);
  root.style.setProperty('--font-weight-custom-badge', badgeWeight);
  root.style.setProperty('--font-weight-custom-nav', navWeight);

  // Direct body style
  document.body.style.fontFamily = `'${bFont}', 'Montserrat', system-ui, sans-serif`;
  document.body.style.fontWeight = bWeight;

  // Inject or update global style override element
  let styleEl = document.getElementById('dynamic-font-styles') as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-font-styles';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    :root {
      --font-pogonia: '${hFont}', 'Pogonia', serif !important;
      --font-montserrat: '${bFont}', 'Montserrat', system-ui, sans-serif !important;
      --font-sans: '${bFont}', 'Montserrat', system-ui, sans-serif !important;
      --font-custom-heading: '${hFont}', 'Pogonia', serif !important;
      --font-custom-body: '${bFont}', 'Montserrat', system-ui, sans-serif !important;
      --font-custom-hero-title: '${heroFont}', '${hFont}', 'Pogonia', serif !important;
      --font-custom-section-title: '${secFont}', '${hFont}', 'Pogonia', serif !important;
      --font-custom-cta: '${ctaFont}', '${bFont}', 'Montserrat', sans-serif !important;
      --font-custom-badge: '${badgeFont}', '${bFont}', 'Montserrat', sans-serif !important;
      --font-custom-nav: '${navFont}', '${bFont}', 'Montserrat', sans-serif !important;

      --font-weight-custom-heading: ${hWeight} !important;
      --font-weight-custom-body: ${bWeight} !important;
      --font-weight-custom-hero-title: ${heroWeight} !important;
      --font-weight-custom-section-title: ${secWeight} !important;
      --font-weight-custom-cta: ${ctaWeight} !important;
      --font-weight-custom-badge: ${badgeWeight} !important;
      --font-weight-custom-nav: ${navWeight} !important;
    }

    /* Global Headings & Body Defaults */
    .font-pogonia, .font-editorial, .font-serif, h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-custom-heading) !important;
      font-weight: var(--font-weight-custom-heading) !important;
    }
    .font-montserrat, .font-sans, .font-ui, body, p, blockquote, label {
      font-family: var(--font-custom-body) !important;
      font-weight: var(--font-weight-custom-body) !important;
    }

    /* Specific: Hero Main Title (Highest Specificity for Hero) */
    .font-hero-title, [data-font="hero-title"], #hero h1, #hero h1.font-pogonia, #hero .hero-headline {
      font-family: var(--font-custom-hero-title) !important;
      font-weight: var(--font-weight-custom-hero-title) !important;
    }

    /* Specific: Section Titles (Overrides global .font-pogonia on section headings) */
    .font-section-title, [data-font="section-title"], section h2, section h2.font-pogonia, section div h2, main h2 {
      font-family: var(--font-custom-section-title) !important;
      font-weight: var(--font-weight-custom-section-title) !important;
    }

    /* Specific: CTA Buttons & Action Triggers */
    .font-cta, [data-font="cta"], button:not([data-font-ignore]), button.font-montserrat, a[data-cursor="open"], a[data-cursor="play"], .group\\/explore, .group\\/hire, .group\\/story, .group\\/play {
      font-family: var(--font-custom-cta) !important;
      font-weight: var(--font-weight-custom-cta) !important;
    }

    /* Specific: Badges, View Counters & Category Tags */
    .font-badge, [data-font="badge"], .badge-pill, span[class*="tracking-wider"], span[class*="tracking-widest"] {
      font-family: var(--font-custom-badge) !important;
      font-weight: var(--font-weight-custom-badge) !important;
    }

    /* Specific: Navbar & Brand Name */
    .font-nav, [data-font="nav"], nav, nav a, nav span, header a, header span, nav .font-pogonia, nav .font-montserrat {
      font-family: var(--font-custom-nav) !important;
      font-weight: var(--font-weight-custom-nav) !important;
    }

    /* Keep Admin Dashboard controls unaffected */
    [data-font-ignore], [data-font-ignore] button, [data-font-ignore] input, [data-font-ignore] select, [data-font-ignore] textarea {
      font-family: Montserrat, system-ui, sans-serif !important;
    }
  `;
}
