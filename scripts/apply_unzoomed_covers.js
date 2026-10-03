const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function run() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const dbPath = path.join(__dirname, '..', 'data', 'portfolio.db');
  const wasmPath = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist');

  // 1. Copy each -thumb.jpg to -cover.jpg
  const files = fs.readdirSync(uploadsDir);
  for (const f of files) {
    if (f.endsWith('-thumb.jpg')) {
      const coverName = f.replace('-thumb.jpg', '-cover.jpg');
      const srcPath = path.join(uploadsDir, f);
      const destPath = path.join(uploadsDir, coverName);
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${f} -> ${coverName} (${fs.statSync(destPath).size} bytes)`);
    }
  }

  // 2. Update SQLite database reels table to use the new -cover.jpg with timestamp query
  const SQL = await initSqlJs({
    locateFile: file => path.join(wasmPath, file)
  });

  const filebuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(filebuffer);

  const reels = db.exec('SELECT id, video_url FROM reels')[0];
  const updateStmt = db.prepare('UPDATE reels SET thumbnail_url = ? WHERE id = ?');

  const timestamp = Date.now();
  for (const row of reels.values) {
    const id = row[0];
    const videoUrl = row[1];
    if (videoUrl && videoUrl.startsWith('/uploads/')) {
      const base = videoUrl.replace(/\.mp4$/i, '');
      const coverUrl = `${base}-cover.jpg?v=${timestamp}`;
      updateStmt.run([coverUrl, id]);
      console.log(`Updated reel ${id} -> ${coverUrl}`);
    }
  }
  updateStmt.free();

  // Save database
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  console.log('Database saved with fresh unzoomed cover URLs!');

  // Verify
  const verifyDb = new SQL.Database(fs.readFileSync(dbPath));
  const res = verifyDb.exec('SELECT id, title, video_url, thumbnail_url FROM reels');
  console.log('Verified updated reels in SQLite:', JSON.stringify(res, null, 2));
}

run().catch(console.error);
