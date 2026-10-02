import React, { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { SettingsData } from '../types';
import { gsap } from 'gsap';

interface NavbarProps {
  settings?: SettingsData;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
}

const NAV_LINKS = [
  { name: 'Home',         href: '#home',         sectionId: 'home' },
  { name: 'Services',     href: '#services',     sectionId: 'services' },
  { name: 'About',        href: '#about',        sectionId: 'about' },
  { name: 'Reels',        href: '#reels',        sectionId: 'reels' },
  { name: 'Testimonials', href: '#testimonials', sectionId: 'testimonials' },
  { name: 'Contact',      href: '#contact',      sectionId: 'contact' },
];

export const Navbar: React.FC<NavbarProps> = ({ settings, onOpenAdmin, isAdminLoggedIn }) => {
  const [scrolled, setScrolled]           = useState(false);
  const [hidden, setHidden]               = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [imgError, setImgError]           = useState(false);
  const [activeSection, setActiveSection] = useState<string>('home');

  const lastScrollY    = useRef(0);
  const navRef         = useRef<HTMLElement>(null);
  const mobileMenuRef  = useRef<HTMLDivElement>(null);

  const profilePicUrl = settings?.profile_picture_url || null;

  /* ── Scroll: hide/show + shadow ─────────────────────────────── */
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 30);
      if (currentY > 100) {
        setHidden(currentY > lastScrollY.current && currentY > 200);
      } else {
        setHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ── IntersectionObserver: highlight active section on scroll ── */
  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.sectionId);

    // Track how much of each section is visible
    const visibilityMap: Record<string, number> = {};

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibilityMap[entry.target.id] = entry.intersectionRatio;
        });

        // Pick the section with the highest visible ratio
        let bestId = '';
        let bestRatio = 0;
        Object.entries(visibilityMap).forEach(([id, ratio]) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });

        if (bestId) setActiveSection(bestId);
      },
      {
        // Fire at several thresholds so small sections still register
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        rootMargin: '-10% 0px -10% 0px',
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  /* ── GSAP: animate nav hide/show ─────────────────────────────── */
  useEffect(() => {
    if (!navRef.current) return;
    gsap.to(navRef.current, {
      y: hidden ? -120 : 0,
      duration: 0.4,
      ease: hidden ? 'power2.in' : 'power3.out',
    });
  }, [hidden]);

  /* ── GSAP: mobile menu slide in ──────────────────────────────── */
  useEffect(() => {
    if (!mobileMenuRef.current) return;
    if (mobileMenuOpen) {
      gsap.fromTo(
        mobileMenuRef.current,
        { clipPath: 'inset(0% 0% 100% 0%)', opacity: 0 },
        { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, [mobileMenuOpen]);

  /* ── Handle click: instantly set active + smooth scroll ─────── */
  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
  };

  const isActive = (sectionId: string) => activeSection === sectionId;

  return (
    <header
      ref={navRef}
      className="fixed top-3 sm:top-6 md:top-7 left-0 right-0 z-50 px-3 sm:px-8 pointer-events-none"
    >
      <div className="w-full max-w-6xl xl:max-w-[1360px] mx-auto pointer-events-auto">
        <div
          className={`flex items-center justify-between px-3.5 sm:px-8 md:px-10 py-2.5 sm:py-4 md:py-4.5 rounded-full bg-[#2B170F] text-[#FFF9F2] shadow-2xl border border-white/10 transition-shadow duration-300 ${
            scrolled ? 'bg-[#2B170F]/95 backdrop-blur-xl shadow-black/35 py-2.5 md:py-3.5' : ''
          }`}
        >
          {/* Brand */}
          <a
            href="#home"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 sm:gap-3.5 group shrink-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#C65D45] text-[#2B170F] flex items-center justify-center font-pogonia font-bold text-base sm:text-xl shadow-md group-hover:scale-105 transition-transform duration-300 overflow-hidden shrink-0">
              {profilePicUrl && !imgError ? (
                <img
                  src={profilePicUrl}
                  alt="Afsar Ahmad"
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span>A</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-pogonia text-lg sm:text-2xl md:text-[26px] font-bold tracking-tight text-[#FFF9F2] group-hover:text-[#C65D45] transition-colors duration-300 whitespace-nowrap">
                Afsar Ahmad
              </span>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#C65D45] shrink-0 inline-block" />
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-10 xl:gap-12">
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => handleNavClick(link.sectionId)}
                className={`text-sm lg:text-base font-sans tracking-wide transition-all duration-200 relative group/link ${
                  isActive(link.sectionId)
                    ? 'text-[#C65D45] font-bold'
                    : 'text-[#FFF9F2]/85 hover:text-[#FFF9F2] font-medium'
                }`}
              >
                {link.name}
                {/* Active / hover underline */}
                <span
                  className={`absolute -bottom-0.5 left-0 h-px bg-[#C65D45] transition-all duration-300 ${
                    isActive(link.sectionId) ? 'w-full' : 'w-0 group-hover/link:w-full'
                  }`}
                />
              </a>
            ))}
          </nav>

          {/* Right CTAs */}
          <div className="hidden sm:flex items-center gap-3 md:gap-4">
            <button
              onClick={onOpenAdmin}
              className={`p-2.5 md:p-3 rounded-full border transition-all duration-300 flex items-center justify-center ${
                isAdminLoggedIn
                  ? 'border-[#C65D45] text-[#C65D45] bg-[#C65D45]/10'
                  : 'border-white/15 text-[#FFF9F2]/70 hover:text-[#FFF9F2] hover:border-white/30 bg-white/5'
              }`}
              title="Admin Panel"
            >
              <ShieldCheck className="w-4 h-4 md:w-4.5 md:h-4.5" />
            </button>

            <a
              href="#contact"
              onClick={() => handleNavClick('contact')}
              data-cursor="open"
              className="px-6 sm:px-7 md:px-8 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm md:text-base font-sans font-bold text-[#2B170F] bg-[#FFF9F2] hover:bg-white hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg cursor-pointer"
            >
              Contact Me
            </a>
          </div>

          {/* Mobile Hamburger & Contact */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            <a
              href="#contact"
              onClick={() => handleNavClick('contact')}
              className="px-3 py-1.5 rounded-full text-xs font-sans font-bold text-[#2B170F] bg-[#FFF9F2] shadow-sm hover:bg-white active:scale-95 transition-all whitespace-nowrap"
            >
              Contact
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-full text-[#FFF9F2] hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="sm:hidden mt-3 p-5 rounded-3xl bg-[#2B170F] border border-white/15 shadow-2xl text-[#FFF9F2] space-y-3"
            style={{ clipPath: 'inset(0% 0% 100% 0%)', opacity: 0 }}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => handleNavClick(link.sectionId)}
                className={`block py-2.5 px-4 rounded-xl text-base font-sans transition-all duration-200 ${
                  isActive(link.sectionId)
                    ? 'text-[#C65D45] font-bold bg-white/10'
                    : 'text-[#FFF9F2]/85 hover:bg-white/5'
                }`}
              >
                {link.name}
              </a>
            ))}

          </div>
        )}
      </div>
    </header>
  );
};
