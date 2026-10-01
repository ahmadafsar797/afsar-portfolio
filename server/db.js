const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'portfolio.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for high performance
db.exec('PRAGMA journal_mode = WAL;');

// Initialize Tables
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      client TEXT NOT NULL,
      video_url TEXT NOT NULL,
      thumbnail_url TEXT,
      views_count TEXT,
      duration TEXT,
      aspect_ratio TEXT DEFAULT '9:16',
      is_featured INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS horizontal_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      client TEXT NOT NULL,
      video_url TEXT NOT NULL,
      thumbnail_url TEXT,
      description TEXT,
      duration TEXT,
      year TEXT DEFAULT '2025',
      aspect_ratio TEXT DEFAULT '16:9',
      is_featured INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      client_title TEXT,
      company TEXT NOT NULL,
      avatar_url TEXT,
      video_url TEXT NOT NULL,
      thumbnail_url TEXT,
      quote TEXT,
      rating INTEGER DEFAULT 5,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      client TEXT NOT NULL,
      category TEXT NOT NULL,
      thumbnail_url TEXT,
      video_url TEXT NOT NULL,
      brief TEXT,
      approach TEXT,
      deliverables TEXT,
      software_used TEXT,
      before_image_url TEXT,
      after_image_url TEXT,
      metrics TEXT,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      icon_name TEXT,
      short_description TEXT,
      deliverables TEXT,
      turnaround TEXT,
      order_index INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS about (
      id INTEGER PRIMARY KEY,
      headline TEXT,
      bio TEXT,
      philosophy TEXT,
      years_experience TEXT,
      views_generated TEXT,
      projects_delivered TEXT,
      client_satisfaction TEXT,
      avatar_url TEXT,
      showreel_url TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      project_type TEXT,
      budget TEXT,
      message TEXT,
      brief_url TEXT,
      status TEXT DEFAULT 'unread',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  seedDefaultData();
}

function seedDefaultData() {
  // 1. Admin user
  const adminCheck = db.prepare('SELECT COUNT(*) as count FROM admins').get();
  if (adminCheck.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('editor2026!', salt);
    db.prepare('INSERT INTO admins (username, password_hash, email) VALUES (?, ?, ?)').run('admin', hash, 'contact@afsaredits.com');
    console.log('Seeded default admin: admin / editor2026!');
  }

  // 2. Settings
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (settingsCount.count === 0) {
    const defaultSettings = [
      ['site_name', 'AFSAR AHMAD | Video Editor & Visual Storyteller'],
      ['hero_headline', 'I Edit Stories That Make People Stop Scrolling.'],
      ['hero_subtitle', 'Creative Video Editor specializing in high-retention short-form reels, cinematic commercial brand films, and engaging long-form YouTube content.'],
      ['availability', 'Available for Select Projects (Q1/Q2 2026)'],
      ['featured_showreel_url', 'https://assets.mixkit.co/videos/preview/mixkit-cinematographer-filming-with-a-professional-camera-42861-large.mp4'],
      ['featured_showreel_poster', 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1920&q=80'],
      ['contact_email', 'contact@afsaredits.com'],
      ['contact_phone', '+1 (555) 382-9014'],
      ['whatsapp_number', '+15553829014'],
      ['instagram_url', 'https://instagram.com/afsar.edits'],
      ['linkedin_url', 'https://linkedin.com/in/afsar-ahmad'],
      ['youtube_url', 'https://youtube.com/@afsaredits'],
      ['twitter_url', 'https://x.com/afsar_edits'],
    ];

    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of defaultSettings) {
      insertSetting.run(key, value);
    }
  }

  // 3. About
  const aboutCount = db.prepare('SELECT COUNT(*) as count FROM about').get();
  if (aboutCount.count === 0) {
    db.prepare(`
      INSERT INTO about (
        id, headline, bio, philosophy, years_experience, views_generated, projects_delivered, client_satisfaction, avatar_url, showreel_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      1,
      'Story first. Pacing second. Effects serve the narrative.',
      "I'm Afsar Ahmad, a freelance video editor and colorist with over 2 years of dedicated post-production experience. I partner with ambitious creators, modern brands, and growing channels worldwide to craft videos that capture attention within the first 1.5 seconds and retain it through emotional rhythm, dynamic soundscapes, and flawless pacing.",
      'In a feed saturated with derivative templates, true engagement comes from intentional narrative tension, hyper-calibrated audio design, and color grading that elevates raw footage into a cinematic world.',
      '2+',
      '65M+',
      '180+',
      '99.4%',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      'https://assets.mixkit.co/videos/preview/mixkit-cinematographer-filming-with-a-professional-camera-42861-large.mp4'
    );
  }

  // 4. Reels (9:16 Vertical)
  const reelsCount = db.prepare('SELECT COUNT(*) as count FROM reels').get();
  if (reelsCount.count === 0) {
    const sampleReels = [
      {
        title: 'HYPER-PACE: Cyberpunk Sneaker Drop',
        category: 'Social Media Ads',
        client: 'KINETIX Athletics',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-urban-dancer-performing-in-a-neon-tunnel-42997-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
        views_count: '2.4M Views',
        duration: '0:28',
        is_featured: 1,
        order_index: 1,
      },
      {
        title: 'The AI Revolution in 45 Seconds',
        category: 'Talking Head Edits',
        client: 'Devin K. (Tech Founder)',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-on-his-laptop-at-home-43282-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
        views_count: '890K Views',
        duration: '0:45',
        is_featured: 1,
        order_index: 2,
      },
      {
        title: 'Chrono Lux: Kinetic Watch Macro',
        category: 'Product Reels',
        client: 'AURA Timepieces',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-wearing-a-watch-41846-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        views_count: '1.7M Views',
        duration: '0:22',
        is_featured: 1,
        order_index: 3,
      },
      {
        title: 'Tokyo Midnight Drift: Street Culture',
        category: 'Cinematic Social Content',
        client: 'Drift & Grain Studio',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-car-driving-through-the-city-at-night-42864-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
        views_count: '3.1M Views',
        duration: '0:35',
        is_featured: 1,
        order_index: 4,
      },
      {
        title: '3 Editing Secrets That Broke The Algorithm',
        category: 'YouTube Shorts',
        client: 'Creator Velocity',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-recording-himself-with-his-phone-42982-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        views_count: '1.2M Views',
        duration: '0:58',
        is_featured: 0,
        order_index: 5,
      },
      {
        title: 'Nordic Roast: Coffee Sensory Journey',
        category: 'Instagram Reels',
        client: 'Fjord Coffee Labs',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-barista-pouring-coffee-into-a-cup-41785-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        views_count: '640K Views',
        duration: '0:30',
        is_featured: 0,
        order_index: 6,
      },
    ];

    const insertReel = db.prepare(`
      INSERT INTO reels (title, category, client, video_url, thumbnail_url, views_count, duration, is_featured, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const reel of sampleReels) {
      insertReel.run(
        reel.title,
        reel.category,
        reel.client,
        reel.video_url,
        reel.thumbnail_url,
        reel.views_count,
        reel.duration,
        reel.is_featured,
        reel.order_index
      );
    }
  }

  // 5. Horizontal Videos (16:9)
  const horizCount = db.prepare('SELECT COUNT(*) as count FROM horizontal_videos').get();
  if (horizCount.count === 0) {
    const sampleHorizontal = [
      {
        title: 'SOLITUDE: The High Alpine Climber',
        category: 'Brand films',
        client: 'Arc’teryx & Peak Expeditions',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-drone-footage-of-a-mountain-landscape-43180-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        description: 'A 14-minute cinematic documentary exploring psychological resilience in extreme sub-zero conditions. Features full 4K RAW color grading, custom Foley audio design, and orchestral rhythm matching.',
        duration: '14:20',
        year: '2025',
        is_featured: 1,
        order_index: 1,
      },
      {
        title: 'Why 99% Of Startups Fail At Video',
        category: 'YouTube videos',
        client: 'The Venture Narrative (850K Subs)',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-laptop-42867-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
        description: 'Deep-dive video essay analyzing the retention curves of modern tech storytelling. Optimized for an astonishing 68% average watch duration with dynamic infographics and sound sculpting.',
        duration: '21:45',
        year: '2025',
        is_featured: 1,
        order_index: 2,
      },
      {
        title: 'NEO VELOCE: Electric Supercar Reveal',
        category: 'Commercials',
        client: 'Apex Motors Worldwide',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-car-driving-through-the-city-at-night-42864-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80',
        description: 'High-octane commercial campaign broadcasted across international streaming platforms. Fast-paced beat editing, 3D title tracking, and visceral sound synthesis.',
        duration: '01:30',
        year: '2026',
        is_featured: 1,
        order_index: 3,
      },
      {
        title: 'The Architecture of Thought: Studio Visit',
        category: 'Corporate videos',
        client: 'Foster & Partners Architecture',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-modern-building-with-many-windows-41847-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        description: 'Editorial brand showcase examining minimalist structural geometry. Gentle pacing, classical string balance, and natural warm color grading.',
        duration: '06:12',
        year: '2025',
        is_featured: 0,
        order_index: 4,
      },
    ];

    const insertHoriz = db.prepare(`
      INSERT INTO horizontal_videos (title, category, client, video_url, thumbnail_url, description, duration, year, is_featured, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const h of sampleHorizontal) {
      insertHoriz.run(
        h.title,
        h.category,
        h.client,
        h.video_url,
        h.thumbnail_url,
        h.description,
        h.duration,
        h.year,
        h.is_featured,
        h.order_index
      );
    }
  }

  // 6. Client Video Testimonials (9:16 Vertical)
  const testCount = db.prepare('SELECT COUNT(*) as count FROM testimonials').get();
  if (testCount.count === 0) {
    const sampleTestimonials = [
      {
        client_name: 'Marcus Sterling',
        client_title: 'Head of Growth',
        company: 'Apex Media Group',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-recording-himself-with-his-phone-42982-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
        quote: 'Afsar completely transformed our channel retention. Our average view duration skyrocketed by 42% within just 30 days of working together.',
        rating: 5,
        order_index: 1,
      },
      {
        client_name: 'Elena Rostova',
        client_title: 'Creative Director',
        company: 'Lumina Cosmetics',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-posing-in-a-studio-42978-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        quote: 'Finding an editor who understands color grading and luxury commercial rhythm this deeply is nearly impossible. Afsar delivers master-grade edits every single round.',
        rating: 5,
        order_index: 2,
      },
      {
        client_name: 'David Thorne',
        client_title: 'YouTuber (1.4M Subs)',
        company: 'Thorne Tech Odyssey',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-on-his-laptop-at-home-43282-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
        quote: 'He doesn’t just cut video—he engineers visual stories that retain viewers until the final second. Best editing partner I have ever hired in 6 years.',
        rating: 5,
        order_index: 3,
      },
    ];

    const insertTestimonial = db.prepare(`
      INSERT INTO testimonials (client_name, client_title, company, avatar_url, video_url, thumbnail_url, quote, rating, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const t of sampleTestimonials) {
      insertTestimonial.run(
        t.client_name,
        t.client_title,
        t.company,
        t.avatar_url,
        t.video_url,
        t.thumbnail_url,
        t.quote,
        t.rating,
        t.order_index
      );
    }
  }

  // 7. Case Studies / Selected Projects
  const projCount = db.prepare('SELECT COUNT(*) as count FROM projects').get();
  if (projCount.count === 0) {
    const sampleProjects = [
      {
        title: 'Project Hyperion: Cinematic Brand Film',
        client: 'Hyperion Robotics',
        category: 'Commercial Campaign',
        thumbnail_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-cinematographer-filming-with-a-professional-camera-42861-large.mp4',
        brief: 'Deliver a high-suspense 90-second launch film for an autonomous industrial robotics suite, transforming dry engineering specs into an emotive cinematic spectacle.',
        approach: 'Crafted a tension-building three-act rhythm. Balanced macro mechanism close-ups with wide architectural expanses. Integrated sound design using recorded mechanical motors layered with low sub-bass pulses.',
        deliverables: '1x 90s Master Commercial (4K ProRes), 3x 15s Cutdowns (9:16 Vertical for Paid Meta/TikTok), Custom Sound Stems.',
        software_used: 'Premiere Pro, DaVinci Resolve Studio, After Effects, iZotope RX',
        before_image_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80',
        after_image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
        metrics: '4.8M Organic Impressions • 310% Lift in Enterprise Demo Requests',
        order_index: 1,
      },
      {
        title: 'Viral Velocity: Short-Form Growth Engine',
        client: 'FinFlow App',
        category: 'Reels & Shorts Strategy',
        thumbnail_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-urban-dancer-performing-in-a-neon-tunnel-42997-large.mp4',
        brief: 'Reinvent the client’s TikTok & Reels presence from generic static finance tips into dynamic, hyper-engaging visual narratives with high retention curves.',
        approach: 'Designed custom dynamic motion subtitles, punch-ins every 1.8 seconds, visual match-cuts on key emphasis words, and sound-effect accents that trigger dopamine feedback loops.',
        deliverables: '24x High-Retention Vertical Videos (9:16), Motion Graphics Toolkit, Pacing Guidelines.',
        software_used: 'Premiere Pro, After Effects, Photoshop, Audition',
        before_image_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1000&q=80',
        after_image_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=80',
        metrics: '0 to 285K Followers in 90 Days • 22M Total TikTok Views',
        order_index: 2,
      },
    ];

    const insertProj = db.prepare(`
      INSERT INTO projects (
        title, client, category, thumbnail_url, video_url, brief, approach, deliverables, software_used, before_image_url, after_image_url, metrics, order_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of sampleProjects) {
      insertProj.run(
        p.title,
        p.client,
        p.category,
        p.thumbnail_url,
        p.video_url,
        p.brief,
        p.approach,
        p.deliverables,
        p.software_used,
        p.before_image_url,
        p.after_image_url,
        p.metrics,
        p.order_index
      );
    }
  }

  // 8. Services
  const servCount = db.prepare('SELECT COUNT(*) as count FROM services').get();
  if (servCount.count === 0) {
    const servicesList = [
      {
        title: 'Reels & Shorts Editing',
        slug: 'reels-shorts',
        icon_name: 'Smartphone',
        short_description: 'Hyper-retention 9:16 edits engineered for Instagram Reels, YouTube Shorts, and TikTok. Fast pacing, kinetic typography, and audio punch.',
        deliverables: 'Retention hooks, dynamic captions, SFX layering, 9:16 vertical delivery',
        turnaround: '24-48 Hours',
        order_index: 1,
      },
      {
        title: 'YouTube Video Editing',
        slug: 'youtube-editing',
        icon_name: 'Youtube',
        short_description: 'Engaging long-form storytelling designed to maximize average view duration and click-through retention. Multicam cutting and narrative flow.',
        deliverables: 'Full A/B roll assembly, storytelling structure, custom transitions, chapter markers',
        turnaround: '3-5 Days',
        order_index: 2,
      },
      {
        title: 'Social Media Ads',
        slug: 'social-media-ads',
        icon_name: 'Flame',
        short_description: 'High-converting video ads calibrated for Meta, TikTok, and YouTube campaigns. Hook-focused edits that stop the scroll and drive conversions.',
        deliverables: 'Multi-hook variations, CTA animations, platform ratio exports (1:1, 4:5, 9:16)',
        turnaround: '48-72 Hours',
        order_index: 3,
      },
      {
        title: 'Commercial Video Editing',
        slug: 'commercial-editing',
        icon_name: 'Film',
        short_description: 'Cinematic brand campaigns for television, OTT, and web. Refined pacing, rhythm alignment, and premium visual prestige.',
        deliverables: 'Director’s cuts, 30s / 15s / 6s TV cutdowns, broadcast color & audio specs',
        turnaround: '1-2 Weeks',
        order_index: 4,
      },
      {
        title: 'Product Video Editing',
        slug: 'product-editing',
        icon_name: 'Package',
        short_description: 'Sleek, high-definition showcases for physical products, tech hardware, and luxury goods with kinetic speed-ramping and micro-details.',
        deliverables: 'Feature callout callouts, 3D camera tracking sync, luxury color grade',
        turnaround: '3-4 Days',
        order_index: 5,
      },
      {
        title: 'Motion Graphics',
        slug: 'motion-graphics',
        icon_name: 'Sparkles',
        short_description: 'Custom 2D/3D title sequences, kinetic typography, UI mockups, infographics, and branded lower thirds created inside After Effects.',
        deliverables: 'Custom MOGRT templates, kinetic text animation, logo stings, UI tracking',
        turnaround: '2-4 Days',
        order_index: 6,
      },
      {
        title: 'Color Grading',
        slug: 'color-grading',
        icon_name: 'Palette',
        short_description: 'Professional color correction and film emulation in DaVinci Resolve. Transform flat LOG footage into mood-drenched cinematic imagery.',
        deliverables: 'Shot-matching, skin tone isolation, custom LUT creation, HDR & Rec.709 mastering',
        turnaround: '48-72 Hours',
        order_index: 7,
      },
      {
        title: 'Sound Design',
        slug: 'sound-design',
        icon_name: 'Volume2',
        short_description: 'Audio is 50% of the cinematic experience. Immersive Foley, whooshes, atmospheric risers, sub-bass impacts, and pristine dialogue cleanup.',
        deliverables: 'Dialogue de-noise & compression, custom Foley SFX, music stem mixing, stereo/surround mastering',
        turnaround: '24-48 Hours',
        order_index: 8,
      },
      {
        title: 'Corporate Video Editing',
        slug: 'corporate-editing',
        icon_name: 'Briefcase',
        short_description: 'Polished brand stories, executive keynotes, customer case studies, and internal culture films that communicate institutional credibility.',
        deliverables: 'Interview multi-cam cutting, corporate graphic branding, subtitle localization',
        turnaround: '4-6 Days',
        order_index: 9,
      },
    ];

    const insertServ = db.prepare(`
      INSERT INTO services (title, slug, icon_name, short_description, deliverables, turnaround, order_index, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (const s of servicesList) {
      insertServ.run(s.title, s.slug, s.icon_name, s.short_description, s.deliverables, s.turnaround, s.order_index);
    }
  }

  // 9. Initial Messages sample
  const msgCount = db.prepare('SELECT COUNT(*) as count FROM messages').get();
  if (msgCount.count === 0) {
    db.prepare(`
      INSERT INTO messages (name, email, company, project_type, budget, message, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Julian Ross',
      'julian@apexcreatives.co',
      'Apex Creatives',
      'Commercial Campaign',
      '$5,000 - $10,000',
      'Hey Afsar, we saw your showreel and loved the pacing. We have a 60-second brand spot shot on RED Komodo that needs your high-end editing, color grading, and custom sound design.',
      'unread'
    );
  }

  console.log('Database initialized and verified successfully!');
}

initDatabase();

module.exports = db;
