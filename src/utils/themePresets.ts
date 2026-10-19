export interface ThemePreset {
  id: string;
  name: string;
  category: 'Cinematic' | 'Dark Luxury' | 'Modern Bold' | 'Minimalist' | 'Creative';
  canvas: string;      // background page color
  surface: string;     // card / section surface color
  text: string;        // main headings & dark text
  muted: string;       // body copy & subtitle text
  primary: string;     // accent buttons, highlights, badges
  arch: string;        // hero arch shape color
  isDark: boolean;     // whether overall vibe is dark
  description: string;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  if (!hex || typeof hex !== 'string') return { r: 198, g: 93, b: 69 };
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16) || 0,
      g: parseInt(clean[1] + clean[1], 16) || 0,
      b: parseInt(clean[2] + clean[2], 16) || 0,
    };
  }
  return {
    r: parseInt(clean.substring(0, 2), 16) || 0,
    g: parseInt(clean.substring(2, 4), 16) || 0,
    b: parseInt(clean.substring(4, 6), 16) || 0,
  };
}

export function adjustBrightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const adjust = (val: number) => Math.min(255, Math.max(0, Math.round(val + (val * percent) / 100)));
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

export function getLuminance(hex: string): number {
  if (!hex || typeof hex !== 'string') return 0.5;
  const clean = hex.replace('#', '');
  if (clean.length < 6) return 0.5;
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'warm-terracotta',
    name: 'Warm Terracotta (Editorial Signature)',
    category: 'Cinematic',
    canvas: '#F8F1E7',
    surface: '#FFF9F2',
    text: '#2B170F',
    muted: '#756A62',
    primary: '#C65D45',
    arch: '#FF5023',
    isDark: false,
    description: 'The signature editorial look: warm parchment canvas, deep espresso typography & rich terracotta accents.',
  },
  {
    id: 'midnight-luxury',
    name: 'Midnight 24K Gold',
    category: 'Dark Luxury',
    canvas: '#08090C',
    surface: '#12141A',
    text: '#FFFFFF',
    muted: '#94A3B8',
    primary: '#F59E0B',
    arch: '#D97706',
    isDark: true,
    description: 'Ultra-luxurious cinema suite: pitch obsidian background with prestigious 24K gold accents and crisp white typography.',
  },
  {
    id: 'nordic-ice',
    name: 'Pacific Ocean & Electric Cyan',
    category: 'Modern Bold',
    canvas: '#060B14',
    surface: '#0E1726',
    text: '#F0F6FC',
    muted: '#8DA4C4',
    primary: '#00D2FF',
    arch: '#0284C7',
    isDark: true,
    description: 'Clean high-tech commercial look: deep navy abyss background with radiant electric cyan highlights.',
  },
  {
    id: 'emerald-cinematic',
    name: 'Criterion 35mm Emerald',
    category: 'Cinematic',
    canvas: '#06120D',
    surface: '#0E2019',
    text: '#F2FBF6',
    muted: '#82A797',
    primary: '#10B981',
    arch: '#059669',
    isDark: true,
    description: 'Analog film-lab aesthetic: deep dark forest canvas with luminous emerald green grading.',
  },
  {
    id: 'cyber-crimson',
    name: 'Tokyo Cyber Crimson',
    category: 'Modern Bold',
    canvas: '#0A090D',
    surface: '#15131A',
    text: '#FFFFFF',
    muted: '#A39BA8',
    primary: '#FF2A55',
    arch: '#E11D48',
    isDark: true,
    description: 'High-energy creator vibe: intense neon crimson highlights on stealth midnight obsidian.',
  },
  {
    id: 'tokyo-neon-violet',
    name: 'Nebula Deep Violet',
    category: 'Creative',
    canvas: '#090714',
    surface: '#141024',
    text: '#FAF5FF',
    muted: '#9F95BA',
    primary: '#A855F7',
    arch: '#7C3AED',
    isDark: true,
    description: 'Moody indie film studio vibes: cosmic dark plum void with vibrant fluorescent violet glows.',
  },
  {
    id: 'minimal-mono',
    name: 'Swiss Editorial White',
    category: 'Minimalist',
    canvas: '#F4F4F6',
    surface: '#FFFFFF',
    text: '#0F172A',
    muted: '#64748B',
    primary: '#EA580C',
    arch: '#F97316',
    isDark: false,
    description: 'Clean gallery design agency feel: pristine bright canvas with bold charcoal typography and punchy international orange.',
  },
  {
    id: 'sunset-amber',
    name: 'Golden Hour Mocha 35mm',
    category: 'Cinematic',
    canvas: '#110D0B',
    surface: '#1D1714',
    text: '#FFF8F0',
    muted: '#A8988D',
    primary: '#F97316',
    arch: '#EA580C',
    isDark: true,
    description: 'Warm golden-hour cinema palette: deep roasted espresso wood tones and warm luminous sunset amber.',
  },
];
