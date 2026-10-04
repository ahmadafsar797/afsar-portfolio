/**
 * db.js — Pure JavaScript SQLite using sql.js (WebAssembly)
 * No native binaries. Works on every platform including Render free tier.
 */
const path = require('path');
const fs   = require('fs');
const bcrypt = require('bcryptjs');

const dataDir   = path.join(__dirname, '..', 'data');
const uploadsDir = path.join(__dirname, '..', 'uploads');
const dbPath    = path.join(dataDir, 'portfolio.db');
const { syncPermanentSeedCode, seedJsonPath } = require('./seedSync');

// ─── Compatibility wrapper: makes sql.js look like better-sqlite3 ─────────────
// All operations are synchronous once the db is initialized.
function wrapSqlJs(sqlJsDb) {
  function saveToFile() {
    try {
      const data = sqlJsDb.export();
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(dbPath, Buffer.from(data));
    } catch (e) {
      console.error('DB save error:', e.message);
    }
  }

  function flatParams(args) {
    // Accept either spread args or a single array
    if (args.length === 1 && Array.isArray(args[0])) return args[0];
    return args;
  }

  return {
    // exec: multi-statement SQL, no params, no save (used for schema creation)
    exec(sql) {
      try { sqlJsDb.run(sql); } catch(e) { /* ignore pragma warnings */ }
    },

    // prepare: returns a statement-like object
    prepare(sql) {
      return {
        // get: returns first row as plain object, or null
        get(...args) {
          const params = flatParams(args);
          const stmt = sqlJsDb.prepare(sql);
          try {
            if (params.length) stmt.bind(params);
            if (!stmt.step()) return null;
            const row = stmt.getAsObject();
            // sql.js returns BigInt for INTEGER cols in newer builds; normalize
            return normalizeRow(row);
          } finally {
            stmt.free();
          }
        },

        // all: returns array of plain objects
        all(...args) {
          const params = flatParams(args);
          const stmt = sqlJsDb.prepare(sql);
          const rows = [];
          try {
            if (params.length) stmt.bind(params);
            while (stmt.step()) rows.push(normalizeRow(stmt.getAsObject()));
          } finally {
            stmt.free();
          }
          return rows;
        },

        // run: execute with params, save db, return {lastInsertRowid, changes}
        run(...args) {
          const params = flatParams(args);
          sqlJsDb.run(sql, params);
          const lastId = sqlJsDb.exec('SELECT last_insert_rowid()');
          const rowid  = lastId[0]?.values[0][0] ?? null;
          saveToFile();
          return { lastInsertRowid: rowid, changes: sqlJsDb.getRowsModified() };
        }
      };
    }
  };
}

// Normalize sql.js row: convert null-prototype objects and BigInt values
function normalizeRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = typeof v === 'bigint' ? Number(v) : v;
  }
  return out;
}

// ─── Internal database handle ─────────────────────────────────────────────────
let _db = null;

// ─── Async initializer (called once at server startup) ───────────────────────
async function initDb() {
  if (_db) return _db; // already initialized

  // Ensure directories exist
  if (!fs.existsSync(dataDir))    fs.mkdirSync(dataDir,    { recursive: true });
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  // Load sql.js — tell it exactly where to find the WASM binary
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file)
  });

  // Load existing database file or create a new one
  let sqlJsDb;
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    sqlJsDb = new SQL.Database(buf);
  } else {
    sqlJsDb = new SQL.Database();
  }

  _db = wrapSqlJs(sqlJsDb);

  // Create schema and seed data
  createSchema();
  seedDefaultData();
  try { syncPermanentSeedCode(_db); } catch(e) {}

  console.log('Database initialized and verified successfully!');
  return _db;
}

// ─── Proxy: forwards property access to _db (throws if not yet initialized) ──
const db = new Proxy({}, {
  get(_, prop) {
    if (prop === 'initDb') return initDb;
    if (!_db) throw new Error('Database not initialized. Wait for initDb() to resolve.');
    const val = _db[prop];
    return typeof val === 'function' ? val.bind(_db) : val;
  }
});

module.exports = db;

// ─── Schema ───────────────────────────────────────────────────────────────────
function createSchema() {
  _db.exec(`
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
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
function seedDefaultData() {
  // Check if permanent content seed file exists
  let seedJson = null;
  if (fs.existsSync(seedJsonPath)) {
    try {
      seedJson = JSON.parse(fs.readFileSync(seedJsonPath, 'utf8'));
    } catch (e) {
      console.warn('[Auto-Sync] Could not parse default_content.json:', e.message);
    }
  }

  // 1. Admin user
  const adminCheck = _db.prepare('SELECT COUNT(*) as count FROM admins').get();
  if (adminCheck.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('editor2026!', salt);
    _db.prepare('INSERT INTO admins (username, password_hash, email) VALUES (?, ?, ?)').run('admin', hash, 'contact@afsaredits.com');
    console.log('Seeded default admin: admin / editor2026!');
  }

  // 2. Settings
  const settingsCount = _db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (settingsCount.count === 0) {
    const insertSetting = _db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    if (seedJson && seedJson.settings && typeof seedJson.settings === 'object') {
      for (const [key, value] of Object.entries(seedJson.settings)) {
        insertSetting.run(key, String(value));
      }
    } else {
      const defaultSettings = [
        ['site_name', 'AFSAR AHMAD | Video Editor & Motion Designer'],
        ['hero_headline', 'I Edit Stories That Make People Stop Scrolling.'],
        ['hero_subtitle', 'Creative Video Editor specializing in high-retention short-form reels, cinematic commercial brand films, and engaging long-form YouTube content.'],
        ['availability', 'Available for Select Projects (Q1/Q2 2026)'],
        ['featured_showreel_url', '/uploads/Cinematic_Reel_2-1791004710300-248821251.mp4'],
        ['featured_showreel_poster', '/uploads/master-showreel-thumb-1791004753890-1791004755766-85054138.jpg'],
        ['contact_email', 'contact@afsaredits.com'],
        ['contact_phone', '+1 (555) 382-9014'],
        ['whatsapp_number', '+15553829014'],
        ['instagram_url', 'https://instagram.com/afsar.edits'],
        ['linkedin_url', 'https://linkedin.com/in/afsar-ahmad'],
        ['youtube_url', 'https://youtube.com/@afsaredits'],
        ['twitter_url', 'https://x.com/afsar_edits'],
        ['profile_picture_url', '/uploads/profile-picture.jpg'],
      ];
      for (const [key, value] of defaultSettings) insertSetting.run(key, value);
    }
  }

  // 3. About
  const aboutCount = _db.prepare('SELECT COUNT(*) as count FROM about').get();
  if (aboutCount.count === 0) {
    const a = (seedJson && seedJson.about) ? seedJson.about : {
      headline: 'Story first. Pacing second. Effects serve the narrative.',
      bio: "I am Afsar Ahmad, a dedicated video editor and motion designer with 2+ years of hands-on post-production experience. I partner with ambitious creators, modern brands, and fast-growing channels worldwide to craft videos that capture attention within the first 1.5 seconds and retain it through emotional rhythm, dynamic soundscapes, and tight pacing.",
      philosophy: 'In a feed saturated with derivative templates, true engagement comes from intentional narrative tension, hyper-calibrated audio design, and color grading that elevates raw footage into a cinematic world.',
      years_experience: '2+',
      views_generated: '65M+',
      projects_delivered: '180+',
      client_satisfaction: '99.4%',
      avatar_url: '/uploads/ChatGPT_Image_Aug_7__2026__09_21_02_AM-1790874754492-683229882.jpg',
      showreel_url: 'https://assets.mixkit.co/videos/preview/mixkit-cinematographer-filming-with-a-professional-camera-42861-large.mp4'
    };
    _db.prepare(`
      INSERT INTO about (id, headline, bio, philosophy, years_experience, views_generated, projects_delivered, client_satisfaction, avatar_url, showreel_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      1, a.headline, a.bio, a.philosophy, a.years_experience, a.views_generated, a.projects_delivered, a.client_satisfaction, a.avatar_url, a.showreel_url
    );
  }

  // 4. Reels
  const reelsCount = _db.prepare('SELECT COUNT(*) as count FROM reels').get();
  if (reelsCount.count === 0) {
    const insertReel = _db.prepare(`INSERT INTO reels (title, category, client, video_url, thumbnail_url, views_count, duration, is_featured, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    if (seedJson && Array.isArray(seedJson.reels) && seedJson.reels.length > 0) {
      for (const r of seedJson.reels) {
        insertReel.run(r.title, r.category || 'Reels', r.client || '', r.video_url, r.thumbnail_url || '', r.views_count || '1M+ Views', r.duration || '0:30', r.is_featured ? 1 : 0, r.order_index || 0);
      }
    } else {
      const sampleReels = [
        ['Sunglasses Video with Model', 'Social Media Ads', 'KINETIX Athletics', '/uploads/Sunglasses_Reel-1790973581902-303130025.mp4', '/uploads/Sunglasses_Reel-1790973581902-303130025-cover.jpg', '2.4M Views', '0:28', 1, 1],
        ['Nescafe Coffee matchcut video', 'Product Reels', 'Devin K. (Tech Founder)', '/uploads/Imported_Coffee_Video-1790973678658-120191219.mp4', '/uploads/Imported_Coffee_Video-1790973678658-120191219-cover.jpg', '890K Views', '0:45', 1, 2],
        ['SadakChaap Restaurant Reel', 'Instagram Reels', 'SadakChaap', '/uploads/Sadakchaap_Video-1790973809368-368620759.mp4', '/uploads/Sadakchaap_Video-1790973809368-368620759-cover.jpg', '1.7M Views', '0:22', 1, 3],
        ['Ek__agga Sandal Ads Video', 'Product Reels', 'Ek__agga', '/uploads/Sandle_Product_3-1790973901599-518600078.mp4', '/uploads/Sandle_Product_3-1790973901599-518600078-cover.jpg', '3.1M Views', '0:35', 1, 4],
        ['Trending Reel', 'Instagram Reels', 'Creator Velocity', '/uploads/Priyanka_Video-1790974050192-460800610.mp4', '/uploads/Priyanka_Video-1790974050192-460800610-cover.jpg', '1.2M Views', '0:58', 0, 5],
        ['Reyan Sunglasses Ai Cgi Video', 'Product Reels', 'Fjord Coffee Labs', '/uploads/Sunglasses_Video-1790974206869-652475516.mp4', '/uploads/Sunglasses_Video-1790974206869-652475516-cover.jpg', '640K Views', '0:30', 0, 6],
        ['Look at me owner video', 'Talking Head Edits', '', '/uploads/Sadab_Video-1790872056616-348273760.mp4', '/uploads/Sadab_Video-1790872056616-348273760-cover.jpg', '1.2M Views', '0:30', 0, 7],
      ];
      for (const r of sampleReels) insertReel.run(...r);
    }
  }

  // 5. Horizontal Videos
  const horizCount = _db.prepare('SELECT COUNT(*) as count FROM horizontal_videos').get();
  if (horizCount.count === 0) {
    const insertHoriz = _db.prepare(`INSERT INTO horizontal_videos (title, category, client, video_url, thumbnail_url, description, duration, year, is_featured, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    if (seedJson && Array.isArray(seedJson.horizontal_videos) && seedJson.horizontal_videos.length > 0) {
      for (const h of seedJson.horizontal_videos) {
        insertHoriz.run(h.title, h.category || 'Commercials', h.client || '', h.video_url, h.thumbnail_url || '', h.description || '', h.duration || '02:00', h.year || '2025', h.is_featured ? 1 : 0, h.order_index || 0);
      }
    } else {
      const sampleHorizontal = [
        ['SOLITUDE: The High Alpine Climber','Brand films',"Arc'teryx & Peak Expeditions",'https://assets.mixkit.co/videos/preview/mixkit-drone-footage-of-a-mountain-landscape-43180-large.mp4','https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80','A 14-minute cinematic documentary exploring psychological resilience in extreme sub-zero conditions.','14:20','2025',1,1],
        ['Why 99% Of Startups Fail At Video','YouTube videos','The Venture Narrative (850K Subs)','https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-laptop-42867-large.mp4','https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80','Deep-dive video essay analyzing the retention curves of modern tech storytelling.','21:45','2025',1,2],
        ['NEO VELOCE: Electric Supercar Reveal','Commercials','Apex Motors Worldwide','https://assets.mixkit.co/videos/preview/mixkit-car-driving-through-the-city-at-night-42864-large.mp4','https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80','High-octane commercial campaign broadcasted across international streaming platforms.','01:30','2026',1,3],
        ['The Architecture of Thought: Studio Visit','Corporate videos','Foster & Partners Architecture','https://assets.mixkit.co/videos/preview/mixkit-modern-building-with-many-windows-41847-large.mp4','https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80','Editorial brand showcase examining minimalist structural geometry.','06:12','2025',0,4],
      ];
      for (const h of sampleHorizontal) insertHoriz.run(...h);
    }
  }

  // 6. Testimonials
  const testCount = _db.prepare('SELECT COUNT(*) as count FROM testimonials').get();
  if (testCount.count === 0) {
    const insertT = _db.prepare(`INSERT INTO testimonials (client_name, client_title, company, avatar_url, video_url, thumbnail_url, quote, rating, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    if (seedJson && Array.isArray(seedJson.testimonials) && seedJson.testimonials.length > 0) {
      for (const t of seedJson.testimonials) {
        insertT.run(t.client_name, t.client_title || '', t.company || '', t.avatar_url || '', t.video_url, t.thumbnail_url || '', t.quote || '', t.rating || 5, t.order_index || 0);
      }
    } else {
      const sampleTestimonials = [
        ['Marcus Sterling','Head of Growth','Apex Media Group','https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80','/uploads/Air_Spinnner_Second_Video-1790887275260-999210913.mp4','/uploads/Firefly__4_-1790887321364-905892598.jpg','Afsar completely transformed our channel retention. Our average view duration skyrocketed by 42% within just 30 days of working together.',5,1],
        ['Elena Rostova','Creative Director','Lumina Cosmetics','https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80','https://assets.mixkit.co/videos/preview/mixkit-fashion-model-posing-in-a-studio-42978-large.mp4','https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80','Finding an editor who understands color grading and luxury commercial rhythm this deeply is nearly impossible. Afsar delivers master-grade edits every single round.',5,2],
        ['David Thorne','YouTuber (1.4M Subs)','Thorne Tech Odyssey','https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80','https://assets.mixkit.co/videos/preview/mixkit-man-working-on-his-laptop-at-home-43282-large.mp4','https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',"He doesn't just cut video—he engineers visual stories that retain viewers until the final second. Best editing partner I have ever hired in 6 years.",5,3],
        ['Tanaya Rane','Marketing Director','Tyra Studio','','/uploads/Ladder_1-1790890639399-513834551.mp4','/uploads/TYR07962-1790890643327-775290409.JPG','This Video is very good',5,4],
      ];
      for (const t of sampleTestimonials) insertT.run(...t);
    }
  }

  // 7. Projects
  const projCount = _db.prepare('SELECT COUNT(*) as count FROM projects').get();
  if (projCount.count === 0) {
    const insertP = _db.prepare(`INSERT INTO projects (title, client, category, thumbnail_url, video_url, brief, approach, deliverables, software_used, before_image_url, after_image_url, metrics, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    if (seedJson && Array.isArray(seedJson.projects) && seedJson.projects.length > 0) {
      for (const p of seedJson.projects) {
        insertP.run(p.title, p.client, p.category, p.thumbnail_url || '', p.video_url, p.brief || '', p.approach || '', p.deliverables || '', p.software_used || '', p.before_image_url || '', p.after_image_url || '', p.metrics || '', p.order_index || 0);
      }
    } else {
      insertP.run('Project Hyperion: Cinematic Brand Film','Hyperion Robotics','Commercial Campaign','https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80','https://assets.mixkit.co/videos/preview/mixkit-cinematographer-filming-with-a-professional-camera-42861-large.mp4','Deliver a high-suspense 90-second launch film for an autonomous industrial robotics suite.','Crafted a tension-building three-act rhythm. Balanced macro mechanism close-ups with wide architectural expanses.','1x 90s Master Commercial (4K ProRes), 3x 15s Cutdowns (9:16 Vertical)','Premiere Pro, DaVinci Resolve Studio, After Effects, iZotope RX','https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80','https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80','4.8M Organic Impressions • 310% Lift in Enterprise Demo Requests',1);
      insertP.run('Viral Velocity: Short-Form Growth Engine','FinFlow App','Reels & Shorts Strategy','https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80','https://assets.mixkit.co/videos/preview/mixkit-urban-dancer-performing-in-a-neon-tunnel-42997-large.mp4',"Reinvent the client's TikTok & Reels presence from generic static finance tips into dynamic, hyper-engaging visual narratives with high retention curves.",'Designed custom dynamic motion subtitles, punch-ins every 1.8 seconds, visual match-cuts on key emphasis words, and sound-effect accents that trigger dopamine feedback loops.','24x High-Retention Vertical Videos (9:16), Motion Graphics Toolkit, Pacing Guidelines.','Premiere Pro, After Effects, Photoshop, Audition','https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1000&q=80','https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=80','0 to 285K Followers in 90 Days • 22M Total TikTok Views',2);
    }
  }

  // 8. Services
  const servCount = _db.prepare('SELECT COUNT(*) as count FROM services').get();
  if (servCount.count === 0) {
    const insertS = _db.prepare(`INSERT INTO services (title, slug, icon_name, short_description, deliverables, turnaround, order_index, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    if (seedJson && Array.isArray(seedJson.services) && seedJson.services.length > 0) {
      for (const s of seedJson.services) {
        insertS.run(s.title, s.slug, s.icon_name || 'Film', s.short_description, s.deliverables, s.turnaround, s.order_index || 0, s.is_active !== undefined ? s.is_active : 1);
      }
    } else {
      const servicesList = [
        ['Reels & Shorts Editing','reels-shorts','Smartphone','Hyper-retention 9:16 edits engineered for Instagram Reels, YouTube Shorts, and TikTok.','Retention hooks, dynamic captions, SFX layering, 9:16 vertical delivery','24-48 Hours',1],
        ['YouTube Video Editing','youtube-editing','Youtube','Engaging long-form storytelling designed to maximize average view duration.','Full A/B roll assembly, storytelling structure, custom transitions, chapter markers','3-5 Days',2],
        ['Social Media Ads','social-media-ads','Flame','High-converting video ads calibrated for Meta, TikTok, and YouTube campaigns.','Multi-hook variations, CTA animations, platform ratio exports (1:1, 4:5, 9:16)','48-72 Hours',3],
        ['Commercial Video Editing','commercial-editing','Film','Cinematic brand campaigns for television, OTT, and web.','Director\'s cuts, 30s / 15s / 6s TV cutdowns, broadcast color & audio specs','1-2 Weeks',4],
        ['Product Video Editing','product-editing','Package','Sleek, high-definition showcases for physical products, tech hardware, and luxury goods.','Feature callout callouts, 3D camera tracking sync, luxury color grade','3-4 Days',5],
        ['Motion Graphics','motion-graphics','Sparkles','Custom 2D/3D title sequences, kinetic typography, UI mockups, infographics.','Custom MOGRT templates, kinetic text animation, logo stings, UI tracking','2-4 Days',6],
        ['Color Grading','color-grading','Palette','Professional color correction and film emulation in DaVinci Resolve.','Shot-matching, skin tone isolation, custom LUT creation, HDR & Rec.709 mastering','48-72 Hours',7],
        ['Sound Design','sound-design','Volume2','Audio is 50% of the cinematic experience. Immersive Foley, whooshes, atmospheric risers.','Dialogue de-noise & compression, custom Foley SFX, music stem mixing','24-48 Hours',8],
        ['Corporate Video Editing','corporate-editing','Briefcase','Polished brand stories, executive keynotes, customer case studies.','Interview multi-cam cutting, corporate graphic branding, subtitle localization','4-6 Days',9],
      ];
      for (const s of servicesList) insertS.run(...s);
    }
  }

  // 9. Sample message
  const msgCount = _db.prepare('SELECT COUNT(*) as count FROM messages').get();
  if (msgCount.count === 0) {
    _db.prepare(`INSERT INTO messages (name, email, company, project_type, budget, message, status) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'Julian Ross','julian@apexcreatives.co','Apex Creatives','Commercial Campaign','$5,000 - $10,000',
      'Hey Afsar, we saw your showreel and loved the pacing. We have a 60-second brand spot shot on RED Komodo that needs your high-end editing, color grading, and custom sound design.',
      'unread'
    );
  }
}
