/**
 * Migration Script: Uploads all active/used files from /uploads to Cloudinary,
 * and updates SQLite DB and data/default_content.json with Cloudinary URLs.
 * 
 * Features:
 * - Resumable (skips already migrated files)
 * - Uses upload_large for video files
 * - Automatically updates DB and data/default_content.json
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const cloudinary = require('cloudinary').v2;

const { initDb } = require('../server/db');
const { syncPermanentSeedCode } = require('../server/seedSync');

const uploadsDir = path.join(__dirname, '..', 'uploads');

async function main() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || cloudName === 'your_cloud_name') {
    console.error('\n❌ ERROR: Cloudinary credentials missing in .env!');
    console.error('Please configure .env with valid credentials.\n');
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  console.log('🚀 Initializing database...');
  const db = await initDb();

  // Find all distinct /uploads/ URLs currently referenced in the database
  const queryQueries = [
    'SELECT id, video_url AS url FROM reels WHERE video_url LIKE \'/uploads/%\'',
    'SELECT id, thumbnail_url AS url FROM reels WHERE thumbnail_url LIKE \'/uploads/%\'',
    'SELECT id, video_url AS url FROM horizontal_videos WHERE video_url LIKE \'/uploads/%\'',
    'SELECT id, thumbnail_url AS url FROM horizontal_videos WHERE thumbnail_url LIKE \'/uploads/%\'',
    'SELECT id, avatar_url AS url FROM testimonials WHERE avatar_url LIKE \'/uploads/%\'',
    'SELECT id, video_url AS url FROM testimonials WHERE video_url LIKE \'/uploads/%\'',
    'SELECT id, thumbnail_url AS url FROM testimonials WHERE thumbnail_url LIKE \'/uploads/%\'',
    'SELECT id, thumbnail_url AS url FROM projects WHERE thumbnail_url LIKE \'/uploads/%\'',
    'SELECT id, video_url AS url FROM projects WHERE video_url LIKE \'/uploads/%\'',
    'SELECT id, before_image_url AS url FROM projects WHERE before_image_url LIKE \'/uploads/%\'',
    'SELECT id, after_image_url AS url FROM projects WHERE after_image_url LIKE \'/uploads/%\'',
    'SELECT 1 AS id, avatar_url AS url FROM about WHERE id = 1 AND avatar_url LIKE \'/uploads/%\'',
    'SELECT 1 AS id, showreel_url AS url FROM about WHERE id = 1 AND showreel_url LIKE \'/uploads/%\'',
    'SELECT key AS id, value AS url FROM settings WHERE value LIKE \'/uploads/%\'',
  ];

  const referencedUrls = new Set();
  queryQueries.forEach((q) => {
    try {
      const rows = db.prepare(q).all();
      rows.forEach((r) => {
        if (r.url) referencedUrls.add(r.url.split('?')[0]);
      });
    } catch (e) {}
  });

  console.log(`\n📦 Found ${referencedUrls.size} active files in use by your website.`);

  const urlMap = {};
  let current = 0;
  const total = referencedUrls.size;

  for (const localUrl of referencedUrls) {
    current++;
    const filename = path.basename(localUrl);
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      console.warn(`[${current}/${total}] ⚠️ File not found locally: ${filename}`);
      continue;
    }

    const stat = fs.statSync(filePath);
    const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);
    const ext = path.extname(filename).toLowerCase();
    const isVideo = ['.mp4', '.mov', '.webm', '.mkv'].includes(ext);
    const resourceType = isVideo ? 'video' : 'image';
    const publicId = path.basename(filename, ext).replace(/[^a-zA-Z0-9_.-]/g, '_');

    console.log(`[${current}/${total}] 📤 Uploading ${filename} (${sizeMb} MB, ${resourceType})...`);

    try {
      let result;
      if (isVideo) {
        // upload_large uses callback, wrap in Promise
        result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_large(
            filePath,
            {
              folder: 'portfolio',
              resource_type: 'video',
              chunk_size: 6000000,
              public_id: publicId,
              overwrite: true,
            },
            (err, res) => {
              if (err) return reject(err);
              resolve(res);
            }
          );
        });
      } else {
        result = await cloudinary.uploader.upload(filePath, {
          folder: 'portfolio',
          resource_type: 'image',
          public_id: publicId,
          overwrite: true,
        });
      }

      urlMap[localUrl] = result.secure_url;
      console.log(`  ✅ Done -> ${result.secure_url}`);

      // Immediately replace this URL in SQLite DB
      replaceSingleUrlInDb(db, localUrl, result.secure_url);
    } catch (err) {
      console.error(`  ❌ Failed to upload ${filename}:`, err.message);
    }
  }

  console.log(`\n💾 Synchronizing permanent seed (default_content.json)...`);
  syncPermanentSeedCode(db);

  console.log('\n======================================================');
  console.log(`✨ STEP 1 CLOUDINARY MIGRATION COMPLETE!`);
  console.log(`- Uploaded files: ${Object.keys(urlMap).length}/${total}`);
  console.log(`- Database & default_content.json updated with Cloudinary CDN URLs`);
  console.log('======================================================\n');
}

function replaceSingleUrlInDb(db, oldUrl, newUrl) {
  // Update reels
  db.prepare(`UPDATE reels SET video_url = ? WHERE video_url = ?`).run(newUrl, oldUrl);
  db.prepare(`UPDATE reels SET thumbnail_url = ? WHERE thumbnail_url = ?`).run(newUrl, oldUrl);

  // Update horizontal
  db.prepare(`UPDATE horizontal_videos SET video_url = ? WHERE video_url = ?`).run(newUrl, oldUrl);
  db.prepare(`UPDATE horizontal_videos SET thumbnail_url = ? WHERE thumbnail_url = ?`).run(newUrl, oldUrl);

  // Update testimonials
  db.prepare(`UPDATE testimonials SET avatar_url = ? WHERE avatar_url = ?`).run(newUrl, oldUrl);
  db.prepare(`UPDATE testimonials SET video_url = ? WHERE video_url = ?`).run(newUrl, oldUrl);
  db.prepare(`UPDATE testimonials SET thumbnail_url = ? WHERE thumbnail_url = ?`).run(newUrl, oldUrl);

  // Update projects
  db.prepare(`UPDATE projects SET thumbnail_url = ? WHERE thumbnail_url = ?`).run(newUrl, oldUrl);
  db.prepare(`UPDATE projects SET video_url = ? WHERE video_url = ?`).run(newUrl, oldUrl);
  db.prepare(`UPDATE projects SET before_image_url = ? WHERE before_image_url = ?`).run(newUrl, oldUrl);
  db.prepare(`UPDATE projects SET after_image_url = ? WHERE after_image_url = ?`).run(newUrl, oldUrl);

  // Update about
  db.prepare(`UPDATE about SET avatar_url = ? WHERE avatar_url = ?`).run(newUrl, oldUrl);
  db.prepare(`UPDATE about SET showreel_url = ? WHERE showreel_url = ?`).run(newUrl, oldUrl);

  // Update settings (match with or without query strings like ?v=...)
  db.prepare(`UPDATE settings SET value = ? WHERE value = ? OR value LIKE ?`).run(newUrl, oldUrl, `${oldUrl}?%`);
}

main().catch((err) => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});
