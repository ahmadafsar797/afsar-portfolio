const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('data/portfolio.db');

const updates = [
  ['site_name', 'AFSAR AHMAD | Video Editor & Narrative Storyteller'],
  ['contact_email', 'afsar@ahmadfilms.studio'],
  ['instagram_url', 'https://instagram.com/afsarahmad.edits'],
  ['linkedin_url', 'https://linkedin.com/in/afsarahmad-video'],
  ['youtube_url', 'https://youtube.com/@afsarahmadedits'],
  ['twitter_url', 'https://x.com/afsarahmad_edit']
];

const stmt = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
for (const [key, val] of updates) {
  stmt.run(val, key);
}

console.log('Updated settings successfully:');
console.log(db.prepare('SELECT * FROM settings').all());
