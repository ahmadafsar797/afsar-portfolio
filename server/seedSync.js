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
    console.log(`[Auto-Sync] Permanently saved content state (${reels.length} reels, ${horizontal.length} horizontal, ${testimonials.length} testimonials) -> ${seedJsonPath}`);
    return true;
  } catch (err) {
    console.error('[Auto-Sync Error] Failed to sync seed code:', err.message);
    return false;
  }
}

module.exports = {
  syncPermanentSeedCode,
  seedJsonPath,
};
