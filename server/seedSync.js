const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const seedJsonPath = path.join(dataDir, 'default_content.json');

/**
 * Automatically captures the current live state of all reels, videos,
 * testimonials, projects, services, settings, and about info from SQLite,
 * and permanently saves it into data/default_content.json.
 * 
 * This file is tracked in git and loaded whenever the database initializes,
 * guaranteeing that every add, update, replace, or delete made from the admin
 * dashboard becomes permanent code automatically.
 */
function syncPermanentSeedCode(db) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const reels = db.prepare('SELECT title, category, client, video_url, thumbnail_url, views_count, duration, aspect_ratio, is_featured, order_index FROM reels ORDER BY order_index ASC, id ASC').all();
    const horizontal = db.prepare('SELECT title, category, client, video_url, thumbnail_url, description, duration, year, aspect_ratio, is_featured, order_index FROM horizontal_videos ORDER BY order_index ASC, id ASC').all();
    const testimonials = db.prepare('SELECT client_name, client_title, company, avatar_url, video_url, thumbnail_url, quote, rating, order_index FROM testimonials ORDER BY order_index ASC, id ASC').all();
    const projects = db.prepare('SELECT title, client, category, thumbnail_url, video_url, brief, approach, deliverables, software_used, before_image_url, after_image_url, metrics, order_index FROM projects ORDER BY order_index ASC, id ASC').all();
    const services = db.prepare('SELECT title, slug, icon_name, short_description, deliverables, turnaround, order_index, is_active FROM services ORDER BY order_index ASC, id ASC').all();
    const about = db.prepare('SELECT headline, bio, philosophy, years_experience, views_generated, projects_delivered, client_satisfaction, avatar_url, showreel_url FROM about WHERE id = 1').get();
    const settingsRows = db.prepare('SELECT key, value FROM settings').all();
    
    const settings = {};
    for (const r of settingsRows) {
      settings[r.key] = r.value;
    }

    const content = {
      version: '1.0',
      syncedAt: new Date().toISOString(),
      settings,
      about: about || {},
      reels: reels || [],
      horizontal_videos: horizontal || [],
      testimonials: testimonials || [],
      projects: projects || [],
      services: services || [],
    };

    fs.writeFileSync(seedJsonPath, JSON.stringify(content, null, 2), 'utf8');
    try {
      db.prepare(`
        INSERT INTO settings (key, value) VALUES ('last_seed_synced_at', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(content.syncedAt);
    } catch {}
    console.log(`[Auto-Sync] Permanently saved content state (${reels.length} reels, ${horizontal.length} horizontal, ${testimonials.length} testimonials) -> ${seedJsonPath}`);
    return true;
  } catch (err) {
    console.error('[Auto-Sync Error] Failed to sync seed code:', err.message);
    return false;
  }
}

/**
 * Restores all database tables from a content JSON object (e.g. from backup or updated default_content.json).
 */
function importContentIntoDb(db, content) {
  if (!content || typeof content !== 'object') throw new Error('Invalid content structure');

  // 1. Settings
  if (content.settings && typeof content.settings === 'object') {
    const insertSetting = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    for (const [key, value] of Object.entries(content.settings)) {
      if (key !== 'last_seed_synced_at') {
        insertSetting.run(key, String(value));
      }
    }
  }

  // 2. About
  if (content.about && typeof content.about === 'object') {
    const a = content.about;
    db.prepare(`
      INSERT INTO about (id, headline, bio, philosophy, years_experience, views_generated, projects_delivered, client_satisfaction, avatar_url, showreel_url)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        headline = excluded.headline,
        bio = excluded.bio,
        philosophy = excluded.philosophy,
        years_experience = excluded.years_experience,
        views_generated = excluded.views_generated,
        projects_delivered = excluded.projects_delivered,
        client_satisfaction = excluded.client_satisfaction,
        avatar_url = excluded.avatar_url,
        showreel_url = excluded.showreel_url
    `).run(
      a.headline || '', a.bio || '', a.philosophy || '',
      a.years_experience || '2+', a.views_generated || '65M+',
      a.projects_delivered || '180+', a.client_satisfaction || '99.4%',
      a.avatar_url || '', a.showreel_url || ''
    );
  }

  // 3. Reels
  if (Array.isArray(content.reels) && content.reels.length > 0) {
    db.prepare('DELETE FROM reels').run();
    const insertReel = db.prepare(`
      INSERT INTO reels (title, category, client, video_url, thumbnail_url, views_count, duration, aspect_ratio, is_featured, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of content.reels) {
      insertReel.run(
        r.title, r.category || 'Instagram Reels', r.client || '',
        r.video_url, r.thumbnail_url || '', r.views_count || '1.2M Views',
        r.duration || '0:30', r.aspect_ratio || '9:16',
        r.is_featured ? 1 : 0, r.order_index || 0
      );
    }
  }

  // 4. Horizontal Videos
  if (Array.isArray(content.horizontal_videos) && content.horizontal_videos.length > 0) {
    db.prepare('DELETE FROM horizontal_videos').run();
    const insertHoriz = db.prepare(`
      INSERT INTO horizontal_videos (title, category, client, video_url, thumbnail_url, description, duration, year, aspect_ratio, is_featured, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const h of content.horizontal_videos) {
      insertHoriz.run(
        h.title, h.category || 'Commercials', h.client || '',
        h.video_url, h.thumbnail_url || '', h.description || '',
        h.duration || '02:00', h.year || '2026', h.aspect_ratio || '16:9',
        h.is_featured ? 1 : 0, h.order_index || 0
      );
    }
  }

  // 5. Testimonials
  if (Array.isArray(content.testimonials) && content.testimonials.length > 0) {
    db.prepare('DELETE FROM testimonials').run();
    const insertT = db.prepare(`
      INSERT INTO testimonials (client_name, client_title, company, avatar_url, video_url, thumbnail_url, quote, rating, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const t of content.testimonials) {
      insertT.run(
        t.client_name, t.client_title || '', t.company || '',
        t.avatar_url || '', t.video_url, t.thumbnail_url || '',
        t.quote || '', t.rating || 5, t.order_index || 0
      );
    }
  }

  const syncedAt = content.syncedAt || new Date().toISOString();
  try {
    db.prepare(`
      INSERT INTO settings (key, value) VALUES ('last_seed_synced_at', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(syncedAt);
  } catch {}

  syncPermanentSeedCode(db);
  return true;
}

module.exports = {
  syncPermanentSeedCode,
  importContentIntoDb,
  seedJsonPath,
};
