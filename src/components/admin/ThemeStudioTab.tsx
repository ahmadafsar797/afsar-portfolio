import React, { useState, useEffect } from 'react';
import { Palette, Check, RotateCcw, Save, Sparkles, Eye, ArrowUpRight, Play } from 'lucide-react';
import { SettingsData } from '../../types';
import { THEME_PRESETS, ThemePreset } from '../../utils/themePresets';

interface ThemeStudioTabProps {
  settings: SettingsData;
  onUpdateSettings: (newSettings: SettingsData) => Promise<void>;
  showNotice: (text: string, type?: 'success' | 'error') => void;
}

export const ThemeStudioTab: React.FC<ThemeStudioTabProps> = ({
  settings,
  onUpdateSettings,
  showNotice,
}) => {
  const [canvas, setCanvas] = useState<string>(settings.theme_canvas_color || '#F8F1E7');
  const [surface, setSurface] = useState<string>(settings.theme_surface_color || '#FFF9F2');
  const [text, setText] = useState<string>(settings.theme_text_color || '#2B170F');
  const [muted, setMuted] = useState<string>(settings.theme_muted_color || '#756A62');
  const [primary, setPrimary] = useState<string>(settings.theme_primary_color || '#C65D45');
  const [arch, setArch] = useState<string>(settings.hero_arch_color || '#FF5023');
  const [activePreset, setActivePreset] = useState<string>(settings.theme_preset || 'warm-terracotta');
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (settings.theme_canvas_color) setCanvas(settings.theme_canvas_color);
    if (settings.theme_surface_color) setSurface(settings.theme_surface_color);
    if (settings.theme_text_color) setText(settings.theme_text_color);
    if (settings.theme_muted_color) setMuted(settings.theme_muted_color);
    if (settings.theme_primary_color) setPrimary(settings.theme_primary_color);
    if (settings.hero_arch_color) setArch(settings.hero_arch_color);
    if (settings.theme_preset) setActivePreset(settings.theme_preset);
  }, [settings]);

  const handleSelectPreset = (preset: ThemePreset) => {
    setActivePreset(preset.id);
    setCanvas(preset.canvas);
    setSurface(preset.surface);
    setText(preset.text);
    setMuted(preset.muted);
    setPrimary(preset.primary);
    setArch(preset.arch);
    setHasUnsavedChanges(true);
  };

  const handleSaveTheme = async () => {
    setSaving(true);
    try {
      const updated: SettingsData = {
        ...settings,
        theme_preset: activePreset,
        theme_canvas_color: canvas,
        theme_surface_color: surface,
        theme_text_color: text,
        theme_muted_color: muted,
        theme_primary_color: primary,
        hero_arch_color: arch,
      };
      await onUpdateSettings(updated);
      setHasUnsavedChanges(false);
      showNotice('Theme updated successfully! Changes are live on your website.', 'success');
    } catch (err: any) {
      showNotice(err.message || 'Failed to save theme settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = () => {
    const defaultPreset = THEME_PRESETS[0];
    handleSelectPreset(defaultPreset);
  };

  return (
    <div className="space-y-8 max-w-5xl pb-16 font-sans">
      {/* ── Top Bar Header ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#101018] border border-white/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-[#C65D45]/20 border border-[#C65D45]/40 flex items-center justify-center text-[#C65D45]">
              <Palette className="w-4 h-4" />
            </div>
            <h3 className="font-pogonia text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Color & Theme Studio
            </h3>
          </div>
          <p className="text-xs text-white/50 max-w-xl">
            Change your entire portfolio's color scheme in 1-click. Pick a pre-calibrated cinematic theme or fine-tune individual colors.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleResetDefault}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs font-montserrat uppercase tracking-wider transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSaveTheme}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-montserrat uppercase font-bold tracking-wider shadow-lg transition-all cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-[#C65D45] hover:bg-[#d86b52] text-white shadow-[#C65D45]/40 ring-2 ring-white/20 animate-pulse'
                : 'bg-[#C65D45] hover:bg-[#d86b52] text-white'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Theme...' : hasUnsavedChanges ? 'Save Changes *' : 'Save Theme'}</span>
          </button>
        </div>
      </div>

      {/* ── Live Interactive Mockup Preview ───────────────────── */}
      <div className="p-6 rounded-2xl bg-[#101018] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-montserrat uppercase tracking-wider text-white/70">
            <Eye className="w-4 h-4 text-[#C65D45]" />
            <span>Real-Time Mini Preview</span>
          </div>
          {hasUnsavedChanges && (
            <span className="text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30">
              Unsaved Changes — Click "Save Theme" to publish
            </span>
          )}
        </div>

        {/* Mini Browser Frame */}
        <div
          className="rounded-xl overflow-hidden border border-white/15 shadow-2xl transition-all duration-300"
          style={{ backgroundColor: canvas }}
        >
          {/* Mock Browser Header */}
          <div
            className="px-4 py-2.5 border-b flex items-center justify-between text-xs transition-colors"
            style={{
              backgroundColor: surface,
              borderColor: 'rgba(128,128,128,0.15)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
              <span className="ml-2 font-pogonia font-bold tracking-wider text-xs" style={{ color: text }}>
                AFSAR AHMAD
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: primary, color: '#ffffff' }}
              >
                Book Project
              </span>
            </div>
          </div>

          {/* Mock Hero Content */}
          <div className="p-6 sm:p-8 relative overflow-hidden">
            {/* Mock Arch Shape */}
            <div
              className="absolute -right-8 -top-8 w-44 h-44 rounded-full opacity-70 blur-xl pointer-events-none transition-all duration-500"
              style={{
                background: `linear-gradient(135deg, ${arch}, ${primary})`,
              }}
            />

            <div className="relative z-10 max-w-md space-y-3">
              <span
                className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                style={{
                  backgroundColor: surface,
                  borderColor: primary,
                  color: primary,
                }}
              >
                ● Available for Projects
              </span>

              <h4
                className="font-pogonia text-2xl sm:text-3xl font-bold leading-tight transition-colors"
                style={{ color: text }}
              >
                I Edit Stories That Make People <span style={{ color: primary }}>Stop Scrolling.</span>
              </h4>

              <p className="text-xs leading-relaxed transition-colors line-clamp-2" style={{ color: muted }}>
                Creative Video Editor specializing in high-retention short-form reels, cinematic commercial brand films, and engaging long-form YouTube content.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <div
                  className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all"
                  style={{ backgroundColor: primary, color: '#ffffff' }}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Watch Showreel</span>
                </div>
                <div
                  className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all"
                  style={{
                    backgroundColor: surface,
                    borderColor: 'rgba(128,128,128,0.25)',
                    color: text,
                  }}
                >
                  Explore Work
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 1-Click Preset Themes Grid ────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C65D45]" />
            <span>1-Click Curated Color Themes</span>
          </h4>
          <p className="text-xs text-white/50 mt-0.5">
            Click any palette below to instantly apply it to your entire website.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {THEME_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-4 rounded-2xl text-left border transition-all duration-200 group relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-white/10 border-[#C65D45] ring-2 ring-[#C65D45]/50 shadow-xl shadow-[#C65D45]/15'
                    : 'bg-[#101018] border-white/10 hover:border-white/25 hover:bg-white/5'
                }`}
              >
                {/* Active Badge */}
                {isSelected && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#C65D45] text-white flex items-center justify-center text-[10px] shadow-md">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: preset.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        borderColor: preset.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                        color: preset.isDark ? '#94A3B8' : '#756A62',
                      }}
                    >
                      {preset.category}
                    </span>
                  </div>

                  <h5 className="font-montserrat text-sm font-bold text-white group-hover:text-[#C65D45] transition-colors">
                    {preset.name}
                  </h5>

                  <p className="text-[11px] text-white/50 line-clamp-2 mt-1 leading-snug">
                    {preset.description}
                  </p>
                </div>

                {/* Color Swatch Preview Bar */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40 block mb-1.5">
                    Palette Swatches
                  </span>
                  <div className="flex items-center gap-1.5 h-6 rounded-lg overflow-hidden p-1 bg-black/40 border border-white/10">
                    <div
                      className="flex-1 h-full rounded-sm border border-white/20"
                      style={{ backgroundColor: preset.canvas }}
                      title={`Canvas: ${preset.canvas}`}
                    />
                    <div
                      className="flex-1 h-full rounded-sm border border-white/20"
                      style={{ backgroundColor: preset.surface }}
                      title={`Surface: ${preset.surface}`}
                    />
                    <div
                      className="flex-1 h-full rounded-sm"
                      style={{ backgroundColor: preset.primary }}
                      title={`Primary: ${preset.primary}`}
                    />
                    <div
                      className="flex-1 h-full rounded-sm"
                      style={{ backgroundColor: preset.arch }}
                      title={`Arch: ${preset.arch}`}
                    />
                    <div
                      className="flex-1 h-full rounded-sm border border-white/20"
                      style={{ backgroundColor: preset.text }}
                      title={`Text: ${preset.text}`}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Fine-Tuning Color Controls (Pickers) ─────────────── */}
      <div className="p-6 rounded-2xl bg-[#101018] border border-white/10 space-y-6">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Custom Color Fine-Tuning
          </h4>
          <p className="text-xs text-white/50 mt-0.5">
            Click on any color box or type an exact HEX code to customize specific elements.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Primary Accent */}
          <ColorPickerCard
            label="Primary Accent Color"
            description="Buttons, badges, highlights & CTA accents"
            value={primary}
            onChange={(val) => {
              setPrimary(val);
              setActivePreset('custom');
              setHasUnsavedChanges(true);
            }}
          />

          {/* 2. Page Canvas */}
          <ColorPickerCard
            label="Background Canvas"
            description="Main page background behind all sections"
            value={canvas}
            onChange={(val) => {
              setCanvas(val);
              setActivePreset('custom');
              setHasUnsavedChanges(true);
            }}
          />

          {/* 3. Card Surface */}
          <ColorPickerCard
            label="Card Surface Color"
            description="Background for video cards, tool cards & boxes"
            value={surface}
            onChange={(val) => {
              setSurface(val);
              setActivePreset('custom');
              setHasUnsavedChanges(true);
            }}
          />

          {/* 4. Headings & Main Text */}
          <ColorPickerCard
            label="Headings & Main Text"
            description="Titles, headlines, client names & dark typography"
            value={text}
            onChange={(val) => {
              setText(val);
              setActivePreset('custom');
              setHasUnsavedChanges(true);
            }}
          />

          {/* 5. Body & Paragraph Copy */}
          <ColorPickerCard
            label="Body Copy & Subtitles"
            description="Descriptions, bio paragraphs & metadata"
            value={muted}
            onChange={(val) => {
              setMuted(val);
              setActivePreset('custom');
              setHasUnsavedChanges(true);
            }}
          />

          {/* 6. Hero Arch Shape */}
          <ColorPickerCard
            label="Hero Arch / Circle Glow"
            description="The geometric glow shape behind your photo"
            value={arch}
            onChange={(val) => {
              setArch(val);
              setActivePreset('custom');
              setHasUnsavedChanges(true);
            }}
          />
        </div>

        {/* Bottom Save Reminder */}
        {hasUnsavedChanges && (
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-amber-300">
              * You have unsaved color adjustments.
            </span>
            <button
              onClick={handleSaveTheme}
              disabled={saving}
              className="px-6 py-2 rounded-xl text-xs font-montserrat uppercase font-bold text-white bg-[#C65D45] hover:bg-[#d86b52] transition-all shadow-lg cursor-pointer"
            >
              {saving ? 'Saving...' : 'Apply & Save Theme'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Helper Component: Color Picker Card ───────────────────────
interface ColorPickerCardProps {
  label: string;
  description: string;
  value: string;
  onChange: (val: string) => void;
}

const ColorPickerCard: React.FC<ColorPickerCardProps> = ({
  label,
  description,
  value,
  onChange,
}) => {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between gap-3">
      <div>
        <span className="text-xs font-bold text-white block">{label}</span>
        <span className="text-[11px] text-white/40 block mt-0.5 leading-snug">{description}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Native Color Picker Trigger */}
        <label className="relative w-10 h-10 rounded-xl overflow-hidden cursor-pointer border border-white/20 shrink-0 shadow-md">
          <input
            type="color"
            value={value.startsWith('#') ? value : '#C65D45'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="w-full h-full" style={{ backgroundColor: value }} />
        </label>

        {/* Hex Text Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#HEX"
          className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white tracking-wider focus:outline-none focus:border-[#C65D45] uppercase"
          maxLength={9}
        />
      </div>
    </div>
  );
};
