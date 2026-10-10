import React, { useState } from 'react';
import { Mail, MessageCircle, Clock, ArrowUpRight, CheckCircle2, Copy, Check } from 'lucide-react';
import { SettingsData } from '../types';

interface ContactSectionProps {
  settings?: SettingsData;
  preselectedService?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ settings, preselectedService }) => {
  const [copied, setCopied] = useState(false);

  const email = settings?.contact_email || 'afsar@ahmadfilms.studio';
  const whatsapp = settings?.whatsapp_number || '+91 7860317481';
  const cleanWhatsapp = whatsapp.replace(/[^0-9]/g, '');
  const instagram = settings?.instagram_url || 'https://instagram.com/afsarahmad.edits';
  const linkedin = settings?.linkedin_url || 'https://linkedin.com/in/afsarahmad-video';

  const defaultMsg = preselectedService
    ? encodeURIComponent(`Hi Afsar, I saw your portfolio and would like to discuss a project regarding ${preselectedService}!`)
    : encodeURIComponent('Hi Afsar, I saw your portfolio and would love to collaborate on a video editing project!');

  const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${defaultMsg}`;

  const handleCopyNumber = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(whatsapp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="contact" className="py-20 md:py-28 lg:py-32 bg-[#FFF9F2] relative overflow-hidden border-t border-[#2B170F]/10 font-sans select-none">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] bg-gradient-to-tr from-[#25D366]/6 via-[#C65D45]/8 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl sm:max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#2B170F]/10 shadow-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#C65D45]">
              Open For Collaboration • Let's Connect
            </span>
          </div>

          <h2 className="font-pogonia text-4xl sm:text-6xl lg:text-7xl font-bold text-[#2B170F] leading-[1.08] mb-6">
            Liked My Work? <br />
            <span className="text-[#C65D45]">Let's Create Together.</span>
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-[#756A62] font-medium leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
            Whether you are a creator, brand, or director looking for intentional editing, cinematic pacing, or dynamic visual storytelling — reach out directly to discuss your vision.
          </p>
        </div>

        {/* Hero WhatsApp Feature Card */}
        <div className="relative rounded-3xl lg:rounded-[36px] bg-gradient-to-br from-[#2B170F] via-[#331C13] to-[#20110B] text-[#FFF9F2] p-8 sm:p-12 lg:p-14 xl:p-16 shadow-2xl border border-white/10 overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#25D366]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#C65D45]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Availability pill */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-6 sm:pb-8 border-b border-white/10 mb-8 sm:mb-10">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#25D366]" />
              </span>
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-white/90">
                Available for Select Projects & Collaborations
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60 font-medium">
              <Clock className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Direct & Friendly Response</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-5 lg:space-y-6">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-[#25D366]/30 shrink-0">
                  <svg className="w-8 h-8 lg:w-9 lg:h-9 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-pogonia text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                    Chat on WhatsApp
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-white/70 text-xs sm:text-sm lg:text-base font-mono">
                      {whatsapp}
                    </span>
                    <button
                      onClick={handleCopyNumber}
                      className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                      title="Copy phone number"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#25D366]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {copied && (
                      <span className="text-[11px] text-[#25D366] font-medium">Copied!</span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm sm:text-base lg:text-lg text-white/75 leading-relaxed font-light max-w-3xl">
                Great edits come from clear creative communication. Drop me a message with your project vision, reference reels, or raw ideas, and let's bring it to life.
              </p>

              {/* Portfolio Collaboration Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-white/85">
                  <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#25D366] shrink-0" />
                  <span>Direct creative collaboration with Afsar</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-white/85">
                  <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#25D366] shrink-0" />
                  <span>Cinematic storytelling & rhythmic pacing</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-white/85">
                  <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#25D366] shrink-0" />
                  <span>Short-form reels & commercial brand films</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-white/85">
                  <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#25D366] shrink-0" />
                  <span>Immersive sound design & color polish</span>
                </div>
              </div>
            </div>

            {/* Right Action Block */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-stretch sm:items-center lg:items-end justify-center">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="open"
                className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 sm:px-10 lg:px-11 py-4 sm:py-5 lg:py-5.5 rounded-2xl sm:rounded-full text-base sm:text-lg lg:text-lg font-bold uppercase tracking-wider text-[#111827] bg-[#25D366] hover:bg-[#20bd5a] shadow-[0_10px_35px_rgba(37,211,102,0.45)] hover:shadow-[0_16px_50px_rgba(37,211,102,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
              >
                <MessageCircle className="w-6 h-6 fill-current shrink-0" />
                <span>Open WhatsApp</span>
                <ArrowUpRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
              <span className="text-[11px] sm:text-xs text-white/50 mt-3 text-center sm:text-right block">
                Opens directly in WhatsApp App or Web
              </span>
            </div>
          </div>
        </div>

        {/* Secondary Direct Channels */}
        <div className="mt-8 lg:mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <a
            href={`mailto:${email}`}
            className="p-5 sm:p-6 lg:p-7 rounded-2xl lg:rounded-3xl bg-[#F8F1E7] hover:bg-[#ece4da] border border-[#2B170F]/10 flex items-center justify-between text-xs text-[#2B170F] group transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-[#C65D45]/15 flex items-center justify-center text-[#C65D45] shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-[#756A62] block">Email</span>
                <span className="font-semibold text-xs sm:text-sm lg:text-base text-[#2B170F] truncate block">{email}</span>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-[#756A62] group-hover:text-[#C65D45] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-2" />
          </a>

          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 sm:p-6 lg:p-7 rounded-2xl lg:rounded-3xl bg-[#F8F1E7] hover:bg-[#ece4da] border border-[#2B170F]/10 flex items-center justify-between text-xs text-[#2B170F] group transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-[#C65D45]/15 flex items-center justify-center text-[#C65D45] shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-[#756A62] block">Instagram</span>
                <span className="font-semibold text-xs sm:text-sm lg:text-base text-[#2B170F] block">Direct Message</span>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-[#756A62] group-hover:text-[#C65D45] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-2" />
          </a>

          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 sm:p-6 lg:p-7 rounded-2xl lg:rounded-3xl bg-[#F8F1E7] hover:bg-[#ece4da] border border-[#2B170F]/10 flex items-center justify-between text-xs text-[#2B170F] group transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-[#C65D45]/15 flex items-center justify-center text-[#C65D45] shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-[#756A62] block">LinkedIn</span>
                <span className="font-semibold text-xs sm:text-sm lg:text-base text-[#2B170F] block">Professional Network</span>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-[#756A62] group-hover:text-[#C65D45] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-2" />
          </a>
        </div>
      </div>
    </section>
  );
};
