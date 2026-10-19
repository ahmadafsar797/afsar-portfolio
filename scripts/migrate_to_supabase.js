/**
 * Supabase PostgreSQL Migration Script
 * Creates schema and migrates all data from local SQLite/seed to Supabase.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { initDb } = require('../server/db');

const connectionString = process.env.DATABASE_URL ||
  `postgresql://postgres.wrhbhqgtigqgtdqadwuj:${encodeURIComponent('Ansari,7867')}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`;

async function main() {
  console.log('🚀 Connecting to Supabase PostgreSQL...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Connected to Supabase!');

  console.log('📦 Creating tables in Supabase...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reels (
      id SERIAL PRIMARY KEY,
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
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS horizontal_videos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      client TEXT NOT NULL,
      video_url TEXT NOT NULL,
      thumbnail_url TEXT,
      description TEXT,
      duration TEXT,
      year TEXT DEFAULT '2026',
      aspect_ratio TEXT DEFAULT '16:9',
      is_featured INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id SERIAL PRIMARY KEY,
      client_name TEXT NOT NULL,
      client_title TEXT,
      company TEXT NOT NULL,
      avatar_url TEXT,
      video_url TEXT NOT NULL,
      thumbnail_url TEXT,
      quote TEXT,
      rating INTEGER DEFAULT 5,
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
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
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
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
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      project_type TEXT,
      budget TEXT,
      message TEXT,
      brief_url TEXT,
      status TEXT DEFAULT 'unread',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  console.log('✅ Schema created successfully!');

  // Read current data from local SQLite DB
  const sqliteDb = await initDb();

  console.log('🔄 Migrating data from SQLite to Supabase...');

  // 1. Admins
  const admins = sqliteDb.prepare('SELECT * FROM admins').all();
  for (const a of admins) {
    await client.query(`
      INSERT INTO admins (username, password_hash, email)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, email = EXCLUDED.email
    `, [a.username, a.password_hash, a.email]);
  }
  console.log(`  - Admins migrated: ${admins.length}`);

  // 2. Settings
  const settings = sqliteDb.prepare('SELECT key, value FROM settings').all();
  for (const s of settings) {
    await client.query(`
      INSERT INTO settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [s.key, s.value]);
  }
  console.log(`  - Settings migrated: ${settings.length}`);

  // 3. About
  const about = sqliteDb.prepare('SELECT * FROM about WHERE id = 1').get();
  if (about) {
    await client.query(`
      INSERT INTO about (id, headline, bio, philosophy, years_experience, views_generated, projects_delivered, client_satisfaction, avatar_url, showreel_url)
      VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        headline = EXCLUDED.headline,
        bio = EXCLUDED.bio,
        philosophy = EXCLUDED.philosophy,
        years_experience = EXCLUDED.years_experience,
        views_generated = EXCLUDED.views_generated,
        projects_delivered = EXCLUDED.projects_delivered,
        client_satisfaction = EXCLUDED.client_satisfaction,
        avatar_url = EXCLUDED.avatar_url,
        showreel_url = EXCLUDED.showreel_url
    `, [
      about.headline, about.bio, about.philosophy,
      about.years_experience, about.views_generated,
      about.projects_delivered, about.client_satisfaction,
      about.avatar_url, about.showreel_url,
    ]);
    console.log('  - About migrated');
  }

  // 4. Reels
  const reels = sqliteDb.prepare('SELECT * FROM reels ORDER BY id ASC').all();
  await client.query('TRUNCATE TABLE reels RESTART IDENTITY CASCADE');
  for (const r of reels) {
    await client.query(`
      INSERT INTO reels (title, category, client, video_url, thumbnail_url, views_count, duration, aspect_ratio, is_featured, order_index)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [r.title, r.category, r.client, r.video_url, r.thumbnail_url, r.views_count, r.duration, r.aspect_ratio, r.is_featured, r.order_index]);
  }
  console.log(`  - Reels migrated: ${reels.length}`);

  // 5. Horizontal Videos
  const horiz = sqliteDb.prepare('SELECT * FROM horizontal_videos ORDER BY id ASC').all();
  await client.query('TRUNCATE TABLE horizontal_videos RESTART IDENTITY CASCADE');
  for (const h of horiz) {
    await client.query(`
      INSERT INTO horizontal_videos (title, category, client, video_url, thumbnail_url, description, duration, year, aspect_ratio, is_featured, order_index)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [h.title, h.category, h.client, h.video_url, h.thumbnail_url, h.description, h.duration, h.year, h.aspect_ratio, h.is_featured, h.order_index]);
  }
  console.log(`  - Horizontal Videos migrated: ${horiz.length}`);

  // 6. Testimonials
  const testimonials = sqliteDb.prepare('SELECT * FROM testimonials ORDER BY id ASC').all();
  await client.query('TRUNCATE TABLE testimonials RESTART IDENTITY CASCADE');
  for (const t of testimonials) {
    await client.query(`
      INSERT INTO testimonials (client_name, client_title, company, avatar_url, video_url, thumbnail_url, quote, rating, order_index)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [t.client_name, t.client_title, t.company, t.avatar_url, t.video_url, t.thumbnail_url, t.quote, t.rating, t.order_index]);
  }
  console.log(`  - Testimonials migrated: ${testimonials.length}`);

  // 7. Projects
  const projects = sqliteDb.prepare('SELECT * FROM projects ORDER BY id ASC').all();
  await client.query('TRUNCATE TABLE projects RESTART IDENTITY CASCADE');
  for (const p of projects) {
    await client.query(`
      INSERT INTO projects (title, client, category, thumbnail_url, video_url, brief, approach, deliverables, software_used, before_image_url, after_image_url, metrics, order_index)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [p.title, p.client, p.category, p.thumbnail_url, p.video_url, p.brief, p.approach, p.deliverables, p.software_used, p.before_image_url, p.after_image_url, p.metrics, p.order_index]);
  }
  console.log(`  - Projects migrated: ${projects.length}`);

  // 8. Services
  const services = sqliteDb.prepare('SELECT * FROM services ORDER BY id ASC').all();
  await client.query('TRUNCATE TABLE services RESTART IDENTITY CASCADE');
  for (const s of services) {
    await client.query(`
      INSERT INTO services (title, slug, icon_name, short_description, deliverables, turnaround, order_index, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [s.title, s.slug, s.icon_name, s.short_description, s.deliverables, s.turnaround, s.order_index, s.is_active]);
  }
  console.log(`  - Services migrated: ${services.length}`);

  // 9. Messages
  const messages = sqliteDb.prepare('SELECT * FROM messages ORDER BY id ASC').all();
  await client.query('TRUNCATE TABLE messages RESTART IDENTITY CASCADE');
  for (const m of messages) {
    await client.query(`
      INSERT INTO messages (name, email, company, project_type, budget, message, brief_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [m.name, m.email, m.company, m.project_type, m.budget, m.message, m.brief_url, m.status]);
  }
  console.log(`  - Messages migrated: ${messages.length}`);

  console.log('\n======================================================');
  console.log('✨ ALL TABLES AND DATA MIGRATED TO SUPABASE SUCCESSFULLY!');
  console.log('======================================================\n');

  await client.end();
}

main().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
