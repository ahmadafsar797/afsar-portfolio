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

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'warm-terracotta',
    name: 'Warm Terracotta (Original)',
    category: 'Cinematic',
    canvas: '#F8F1E7',
    surface: '#FFF9F2',
    text: '#2B170F',
    muted: '#756A62',
    primary: '#C65D45',
    arch: '#FF5023',
    isDark: false,
    description: 'The signature editorial look: warm cream canvas, deep espresso text & terracotta accent.',
  },
  {
    id: 'midnight-luxury',
    name: 'Midnight Luxury Gold',
    category: 'Dark Luxury',
    canvas: '#0B0B0E',
    surface: '#14141A',
    text: '#F5F5F7',
    muted: '#9E9EB2',
    primary: '#E5B158',
    arch: '#D49A37',
    isDark: true,
    description: 'Ultra-luxurious cinema aesthetic: pitch black OLED background with premium champagne gold accents.',
  },
  {
    id: 'cyber-crimson',
    name: 'Neon Crimson & Onyx',
    category: 'Modern Bold',
    canvas: '#090A0F',
    surface: '#11141E',
    text: '#FFFFFF',
    muted: '#8A92A6',
    primary: '#FF2A55',
    arch: '#E60039',
    isDark: true,
    description: 'High-energy creator vibe: intense neon crimson highlights on stealth midnight obsidian.',
  },
  {
    id: 'nordic-ice',
    name: 'Nordic Slate & Ice Blue',
    category: 'Modern Bold',
    canvas: '#0B1120',
    surface: '#151F32',
    text: '#F8FAFC',
    muted: '#94A3B8',
    primary: '#38BDF8',
    arch: '#0284C7',
    isDark: true,
    description: 'Clean Scandinavian commercial look: deep navy slate with crisp electric sky blue.',
  },
  {
    id: 'emerald-cinematic',
    name: 'Emerald Forest & Mint',
    category: 'Cinematic',
    canvas: '#06130E',
    surface: '#0D211A',
    text: '#ECFDF5',
    muted: '#769E90',
    primary: '#10B981',
    arch: '#059669',
    isDark: true,
    description: 'Film-grade rich dark botanical aesthetic with glowing emerald green accents.',
  },
  {
    id: 'minimal-mono',
    name: 'Editorial Studio White',
    category: 'Minimalist',
    canvas: '#F5F5F7',
    surface: '#FFFFFF',
    text: '#111113',
    muted: '#666673',
    primary: '#FF5500',
    arch: '#FF3300',
    isDark: false,
    description: 'Swiss design agency feel: pure bright canvas with punchy electric orange contrasts.',
  },
  {
    id: 'tokyo-neon-violet',
    name: 'Tokyo Neon Violet',
    category: 'Creative',
    canvas: '#0C0814',
    surface: '#171124',
    text: '#F5F3FF',
    muted: '#9D95B5',
    primary: '#A855F7',
    arch: '#9333EA',
    isDark: true,
    description: 'Moody cyberpunk night vibes: dark plum void with brilliant fluorescent violet glows.',
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Ochre & Amber',
    category: 'Cinematic',
    canvas: '#16110D',
    surface: '#211914',
    text: '#FFF7ED',
    muted: '#A8998C',
    primary: '#F59E0B',
    arch: '#D97706',
    isDark: true,
    description: 'Warm golden-hour cinema palette: deep roasted wood tones and warm luminous amber.',
  },
];
