const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function updateDb() {
  const dbPath = path.join(__dirname, '..', 'data', 'portfolio.db');
  const wasmPath = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist');

  const SQL = await initSqlJs({
    locateFile: file => path.join(wasmPath, file)
  });

  const filebuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(filebuffer);

  const reels = db.exec('SELECT id, video_url, thumbnail_url FROM reels')[0];
  console.log('Current reels before update:', reels);

  const updateStmt = db.prepare('UPDATE reels SET thumbnail_url = ? WHERE id = ?');

  for (const row of reels.values) {
    const id = row[0];
    const videoUrl = row[1];
    let currentThumb = row[2];

    if (!currentThumb || currentThumb.trim() === '') {
      if (videoUrl && videoUrl.startsWith('/uploads/')) {
        const base = videoUrl.replace(/\.mp4$/i, '');
        const newThumb = `${base}-thumb.jpg`;
        const localPath = path.join(__dirname, '..', newThumb.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          console.log(`Setting thumbnail for reel ${id}: ${newThumb}`);
          updateStmt.run([newThumb, id]);
        } else {
          console.log(`Thumbnail file not found on disk: ${localPath}`);
        }
      }
    }
  }
  updateStmt.free();

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  console.log('Database updated and saved successfully!');

  // Verify
  const verifyDb = new SQL.Database(fs.readFileSync(dbPath));
  const res = verifyDb.exec('SELECT id, title, video_url, thumbnail_url FROM reels');
  console.log('Verified updated reels in SQLite:', JSON.stringify(res, null, 2));
}

updateDb().catch(console.error);
