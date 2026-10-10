import React from 'react';
import { Film, ArrowUp, ShieldCheck } from 'lucide-react';
import { SettingsData } from '../types';

interface FooterProps {
  settings?: SettingsData;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenAdmin, isAdminLoggedIn }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#2B170F] border-t border-[#FFF9F2]/10 py-16 text-[#FFF9F2]/70 relative overflow-hidden font-montserrat">
      <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-12 border-b border-[#FFF9F2]/10">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[#C65D45]/40 bg-[#C65D45]/20 flex items-center justify-center">
              <Film className="w-5 h-5 text-[#C65D45]" />
            </div>
            <div>
              <span className="font-pogonia text-2xl font-bold text-[#FFF9F2] block">
                AFSAR AHMAD
              </span>
              <span className="text-[10px] font-montserrat uppercase tracking-widest text-[#FFF9F2]/50">
                Video Editor & Motion Designer
              </span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-montserrat uppercase tracking-wider text-[#FFF9F2]/80">
            <a href="#home" className="hover:text-[#C65D45] transition-colors">Home</a>
            <a href="#reels" className="hover:text-[#C65D45] transition-colors">Reels</a>
            <a href="#horizontal-work" className="hover:text-[#C65D45] transition-colors">Horizontal</a>
            <a href="#testimonials" className="hover:text-[#C65D45] transition-colors">Testimonials</a>
            <a href="#services" className="hover:text-[#C65D45] transition-colors">Services</a>
            <a href="#process" className="hover:text-[#C65D45] transition-colors">Process</a>
            <a href="#about" className="hover:text-[#C65D45] transition-colors">About</a>
            <a href="#contact" className="hover:text-[#C65D45] transition-colors">Contact</a>
          </div>

          {/* Back to top button */}
          <button
            onClick={scrollToTop}
            className="p-3 rounded-full bg-[#FFF9F2]/10 hover:bg-[#C65D45] hover:text-[#2B170F] border border-[#FFF9F2]/20 text-[#FFF9F2] transition-all flex items-center justify-center cursor-pointer"
            aria-label="Back to top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom credits & admin entry */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-[#FFF9F2]/50 font-montserrat">
          <div>
            © {new Date().getFullYear()} Afsar Ahmad. All Rights Reserved. Crafted for high-retention cinematic storytelling.
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenAdmin}
              className="hover:text-[#C65D45] transition-colors flex items-center gap-1.5 cursor-pointer text-[#FFF9F2]/70"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#C65D45]" />
              <span>{isAdminLoggedIn ? 'Admin Dashboard' : 'Editor Admin Login'}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
