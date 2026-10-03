import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Showreel } from './components/Showreel';
import { ReelsSection } from './components/ReelsSection';
import { HorizontalSection } from './components/HorizontalSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { ServicesSection } from './components/ServicesSection';
import { ProcessSection } from './components/ProcessSection';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { VideoModal } from './components/VideoModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { api } from './services/api';
import {
  Reel,
  HorizontalVideo,
  Testimonial,
  Service,
  AboutData,
  SettingsData,
} from './types';
import { useScrollAnimationEngine } from './hooks/useScrollAnimationEngine';
import { applyDynamicFonts } from './utils/fontLoader';

/** Mounts only after all content has loaded so GSAP can find DOM elements */
const ScrollAnimations: React.FC = () => {
  useScrollAnimationEngine();
  return null;
};

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsData>({});
  const [about, setAbout] = useState<AboutData | undefined>();
  const [reels, setReels] = useState<Reel[]>([]);
  const [horizontalVideos, setHorizontalVideos] = useState<HorizontalVideo[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Admin panel state
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Preselected service for contact form
  const [preselectedService, setPreselectedService] = useState<string>('');

  // Video Lightbox Modal State
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    videoUrl: string;
    title: string;
    client?: string;
    category?: string;
  }>({
    isOpen: false,
    videoUrl: '',
    title: '',
  });

  const loadData = async () => {
    try {
      const [settRes, aboutRes, reelsRes, horizRes, testRes, servRes] =
        await Promise.allSettled([
          api.getSettings(),
          api.getAbout(),
          api.getReels(),
          api.getHorizontalVideos(),
          api.getTestimonials(),
          api.getServices(),
        ]);

      if (settRes.status === 'fulfilled') setSettings(settRes.value);
      if (aboutRes.status === 'fulfilled') setAbout(aboutRes.value);
      if (reelsRes.status === 'fulfilled') setReels(reelsRes.value);
      if (horizRes.status === 'fulfilled') setHorizontalVideos(horizRes.value);
      if (testRes.status === 'fulfilled') setTestimonials(testRes.value);
      if (servRes.status === 'fulfilled') setServices(servRes.value);
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminToken = async () => {
    const token = localStorage.getItem('cinema_admin_token');
    if (token) {
      try {
        await api.getMe();
        setIsAdminLoggedIn(true);
      } catch {
        setIsAdminLoggedIn(false);
      }
    } else {
      setIsAdminLoggedIn(false);
    }
  };

  useEffect(() => {
    loadData();
    checkAdminToken();
  }, []);

  // Dynamically ensure browser tab bar favicon uses the profile picture
  useEffect(() => {
    const picUrl = settings?.profile_picture_url || '/profile-picture.jpg';
    if (!picUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = picUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.arc(32, 32, 31, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, 0, 0, 64, 64);
          const circularUrl = canvas.toDataURL('image/png');
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.type = 'image/png';
          link.href = circularUrl;
        }
      } catch {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (link) link.href = picUrl;
      }
    };
    img.onerror = () => {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) link.href = '/profile-picture.jpg';
    };
  }, [settings?.profile_picture_url]);

  // Synchronize browser tab title
  useEffect(() => {
    document.title = settings?.site_name || 'AFSAR AHMAD | Video Editor & Motion Designer';
  }, [settings?.site_name]);

  // Dynamically apply selected website fonts across all components
  useEffect(() => {
    applyDynamicFonts(settings);
  }, [
    settings?.heading_font,
    settings?.body_font,
    settings?.hero_title_font,
    settings?.section_title_font,
    settings?.cta_font,
    settings?.badge_font,
    settings?.nav_font,
  ]);

  const openLightbox = (videoUrl: string, title: string, client?: string, category?: string) => {
    setLightboxState({
      isOpen: true,
      videoUrl,
      title,
      client,
      category,
    });
  };

  const closeLightbox = () => {
    setLightboxState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSelectService = (serviceTitle: string) => {
    setPreselectedService(serviceTitle);
  };

  // Minimal dark splash while initial database API call resolves
  if (loading) {
    return (
      <div className="min-h-screen bg-[#2B170F] flex flex-col items-center justify-center text-[#FFF9F2] font-sans">
        <div className="font-pogonia text-4xl text-[#C65D45] font-bold tracking-tight">
          AFSAR AHMAD
        </div>
        <div className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#FFF9F2]/50 mt-2">
          Video Editor & Motion Designer
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F1E7] text-[#756A62] min-h-screen relative font-sans selection:bg-[#C65D45] selection:text-[#2B170F]">
      {/* Scroll-driven layout animation engine — mounts after DOM is full */}
      <ScrollAnimations />
      <Navbar
        settings={settings}
        onOpenAdmin={() => setIsAdminOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Main Content Sections */}
      <main style={{ overflowX: 'clip' }}>
        {/* Hero */}
        <Hero
          settings={settings}
          onWatchShowreel={() =>
            openLightbox(
              settings.featured_showreel_url ||
                '/uploads/Cinematic_Reel_2-1791004710300-248821251.mp4',
              'Master Cinematic Showreel',
              'Afsar Ahmad Films',
              'Showreel'
            )
          }
        />

        {/* Featured Showreel */}
        <Showreel
          settings={settings}
          onOpenLightbox={(url, title, client) => openLightbox(url, title, client, 'Master Showreel')}
        />

        {/* Reels & Short-Form Section (9:16) */}
        <ReelsSection reels={reels} onOpenLightbox={openLightbox} />

        {/* Horizontal Video Section (16:9) */}
        <HorizontalSection videos={horizontalVideos} onOpenLightbox={openLightbox} />

        {/* Client Video Testimonials (“Don’t Take My Word For It.”) */}
        <TestimonialsSection testimonials={testimonials} onOpenLightbox={openLightbox} />

        {/* Services Section */}
        <ServicesSection services={services} onSelectService={handleSelectService} />


        {/* My Process (01 Brief -> 02 Editing -> 03 Feedback -> 04 Delivery) */}
        <ProcessSection />

        {/* About & Technical Tools Section */}
        <AboutSection
          about={about}
          onOpenShowreel={() =>
            openLightbox(
              settings.featured_showreel_url ||
                '/uploads/Cinematic_Reel_2-1791004710300-248821251.mp4',
              'Master Cinematic Showreel',
              'Afsar Ahmad Films',
              'Showreel'
            )
          }
        />

        {/* Contact Section (“Have a video in mind?”) */}
        <ContactSection settings={settings} preselectedService={preselectedService} />
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenAdmin={() => setIsAdminOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Fullscreen Video Modal Lightbox */}
      <VideoModal
        isOpen={lightboxState.isOpen}
        onClose={closeLightbox}
        videoUrl={lightboxState.videoUrl}
        title={lightboxState.title}
        client={lightboxState.client}
        category={lightboxState.category}
      />

      {/* Interactive Admin Dashboard Panel */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => {
          setIsAdminOpen(false);
          checkAdminToken();
        }}
        onDataChanged={() => {
          loadData();
          checkAdminToken();
        }}
      />
    </div>
  );
};

export default App;
