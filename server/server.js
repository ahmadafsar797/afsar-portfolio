const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { uploadBufferToCloudinary } = require('./cloudinary');

const db = require('./db');
const { verifyToken, JWT_SECRET } = require('./middleware/auth');
const { syncPermanentSeedCode, importContentIntoDb, seedJsonPath } = require('./seedSync');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check / Anti-sleep keep-alive ping endpoint (uses 0 bandwidth)
app.get(['/health', '/api/health', '/api/ping'], async (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Auto-Sync Middleware: Automatically writes any admin Add/Edit/Delete/Settings change to permanent code seed
app.use((req, res, next) => {
  if (
    req.method !== 'GET' &&
    req.path.startsWith('/api/') &&
    !req.path.startsWith('/api/auth') &&
    !req.path.startsWith('/api/contact')
  ) {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await syncPermanentSeedCode(db);
        } catch (err) {
          console.error('[Auto-Sync Error]', err.message);
        }
      }
    });
  }
  next();
});

// Static uploads folder
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use(
  '/uploads',
  express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      if (filePath.match(/\.(jpg|jpeg|png|webp|gif|svg|ico)$/i)) {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      }
    },
  })
);

// Multer Memory Storage Configuration (files go to Cloudinary, not local disk)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB (Cloudinary handles large files)
});

/* ==========================================================================
   AUTHENTICATION ROUTES
   ========================================================================== */

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admin = await db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = bcrypt.compareSync(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, email: admin.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const admin = await db.prepare('SELECT id, username, email, created_at FROM admins WHERE id = ?').get(req.user.id);
    if (!admin) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: admin });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/auth/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const admin = await db.prepare('SELECT * FROM admins WHERE id = ?').get(req.user.id);
    if (!admin || !bcrypt.compareSync(currentPassword, admin.password_hash)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);
    await db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

app.post('/api/admin/sync-seed', verifyToken, async (req, res) => {
  try {
    const success = syncPermanentSeedCode(db);
    if (success) {
      res.json({ message: 'All content permanently synchronized to code seed.' });
    } else {
      res.status(500).json({ error: 'Failed to synchronize seed.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/export-content', verifyToken, async (req, res) => {
  try {
    syncPermanentSeedCode(db);
    if (fs.existsSync(seedJsonPath)) {
      const data = fs.readFileSync(seedJsonPath, 'utf8');
      res.setHeader('Content-Disposition', 'attachment; filename=afsar_portfolio_backup.json');
      res.setHeader('Content-Type', 'application/json');
      return res.send(data);
    }
    res.status(404).json({ error: 'Backup seed file not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/import-content', verifyToken, async (req, res) => {
  try {
    const content = req.body;
    await importContentIntoDb(db, content);
    res.json({ message: 'Content restored and synchronized successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Import failed' });
  }
});

app.post('/api/admin/publish-live', verifyToken, async (req, res) => {
  try {
    const { syncPermanentSeedCode } = require('./seedSync');
    syncPermanentSeedCode(db);

    const { execSync, spawn } = require('child_process');
    const projectDir = path.join(__dirname, '..');

    // Locate git binary
    let gitBin = 'git';
    const ghDesktopGit = path.join(
      process.env.LOCALAPPDATA || 'C:\\Users\\asus\\AppData\\Local',
      'GitHubDesktop\\app-3.6.6\\resources\\app\\git\\cmd\\git.exe'
    );
    if (fs.existsSync(ghDesktopGit)) {
      gitBin = `"${ghDesktopGit}"`;
    }

    // Git add
    try {
      execSync(`${gitBin} add uploads/ data/default_content.json data/portfolio.db`, {
        cwd: projectDir,
        stdio: 'pipe'
      });
    } catch (addErr) {
      console.warn('Git add warning:', addErr.message);
    }

    // Check status
    let committed = false;
    try {
      const status = execSync(`${gitBin} status --porcelain`, {
        cwd: projectDir,
        encoding: 'utf8'
      });

      if (status.trim().length > 0) {
        execSync(`${gitBin} commit -m "Auto-publish portfolio updates from Admin Dashboard"`, {
          cwd: projectDir,
          stdio: 'pipe'
        });
        committed = true;
      }
    } catch (cErr) {
      console.warn('Git commit notice:', cErr.message);
    }

    // Check if GitHub token is provided in environment or settings for silent push
    let token = process.env.GITHUB_TOKEN;
    if (!token) {
      try {
        const row = await db.prepare("SELECT value FROM settings WHERE key = 'github_token'").get();
        if (row && row.value) token = row.value.trim();
      } catch (e) {}
    }

    let pushed = false;
    if (token) {
      try {
        const repoUrl = `https://${token}@github.com/ahmadafsar797/afsar-portfolio.git`;
        execSync(`${gitBin} push ${repoUrl} main`, {
          cwd: projectDir,
          timeout: 45000,
          stdio: 'pipe'
        });
        pushed = true;
      } catch (pushErr) {
        console.warn('Silent push with token failed:', pushErr.message);
      }
    }

    // If not pushed directly with token, open GitHub Desktop
    let openedDesktop = false;
    if (!pushed) {
      const ghDesktopExe = path.join(
        process.env.LOCALAPPDATA || 'C:\\Users\\asus\\AppData\\Local',
        'GitHubDesktop\\GitHubDesktop.exe'
      );
      if (fs.existsSync(ghDesktopExe)) {
        try {
          spawn(ghDesktopExe, [projectDir], { detached: true, stdio: 'ignore' }).unref();
          openedDesktop = true;
        } catch (e) {}
      }
    }

    res.json({
      success: true,
      committed,
      pushed,
      openedDesktop,
      message: pushed
        ? 'All files permanently saved & pushed to GitHub! Render is deploying your update now.'
        : 'All files permanently saved to git! GitHub Desktop has opened — click "Push origin" to publish to Render.'
    });
  } catch (err) {
    console.error('Publish-live error:', err);
    res.status(500).json({ error: 'Failed to publish: ' + err.message });
  }
});


/* ==========================================================================
   SETTINGS ROUTES
   ========================================================================== */

app.get('/api/settings', async (req, res) => {
  try {
    const rows = await db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', verifyToken, async (req, res) => {
  try {
    const updateStmt = await db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    for (const [key, value] of Object.entries(req.body)) {
      await updateStmt.run(key, String(value));
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/* ==========================================================================
   ABOUT ROUTES
   ========================================================================== */

app.get('/api/about', async (req, res) => {
  try {
    const about = await db.prepare('SELECT * FROM about WHERE id = 1').get();
    res.json(about || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch about data' });
  }
});

app.put('/api/about', verifyToken, async (req, res) => {
  try {
    const {
      headline,
      bio,
      philosophy,
      years_experience,
      views_generated,
      projects_delivered,
      client_satisfaction,
      avatar_url,
      showreel_url,
    } = req.body;

    await db.prepare(`
      UPDATE about SET
        headline = ?,
        bio = ?,
        philosophy = ?,
        years_experience = ?,
        views_generated = ?,
        projects_delivered = ?,
        client_satisfaction = ?,
        avatar_url = ?,
        showreel_url = ?
      WHERE id = 1
    `).run(
      headline,
      bio,
      philosophy,
      years_experience,
      views_generated,
      projects_delivered,
      client_satisfaction,
      avatar_url,
      showreel_url
    );

    res.json({ message: 'About section updated successfully' });
  } catch (err) {
    console.error('About update error:', err);
    res.status(500).json({ error: 'Failed to update about data' });
  }
});

/* ==========================================================================
   REELS (9:16 VERTICAL)
   ========================================================================== */

app.get('/api/reels', async (req, res) => {
  try {
    const reels = await db.prepare('SELECT * FROM reels ORDER BY order_index ASC, id DESC').all();
    res.json(reels);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reels' });
  }
});

app.post('/api/reels', verifyToken, async (req, res) => {
  try {
    const { title, category, client, video_url, thumbnail_url, views_count, duration, is_featured, order_index } = req.body;
    if (!title || !video_url) {
      return res.status(400).json({ error: 'Title and video URL are required' });
    }

    const maxOrder = await db.prepare('SELECT COALESCE(MAX(order_index), 0) as maxOrder FROM reels').get();
    const newOrder = (order_index !== undefined && order_index !== null && order_index !== '') ? Number(order_index) : ((maxOrder.maxOrder || 0) + 1);

    const result = await db.prepare(`
      INSERT INTO reels (title, category, client, video_url, thumbnail_url, views_count, duration, is_featured, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      category || 'Reels',
      client || '',
      video_url,
      thumbnail_url || '',
      views_count || '1M+ Views',
      duration || '0:30',
      is_featured ? 1 : 0,
      newOrder
    );

    const created = await db.prepare('SELECT * FROM reels WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create reel error:', err);
    res.status(500).json({ error: 'Failed to create reel' });
  }
});

app.put('/api/reels/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, client, video_url, thumbnail_url, views_count, duration, is_featured, order_index } = req.body;

    const existing = await db.prepare('SELECT * FROM reels WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Reel not found' });
    const finalOrder = (order_index !== undefined && order_index !== null && order_index !== '') ? Number(order_index) : (existing.order_index ?? 0);

    await db.prepare(`
      UPDATE reels SET
        title = ?,
        category = ?,
        client = ?,
        video_url = ?,
        thumbnail_url = ?,
        views_count = ?,
        duration = ?,
        is_featured = ?,
        order_index = ?
      WHERE id = ?
    `).run(
      title,
      category,
      client,
      video_url,
      thumbnail_url,
      views_count,
      duration,
      is_featured ? 1 : 0,
      finalOrder,
      id
    );

    const updated = await db.prepare('SELECT * FROM reels WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update reel' });
  }
});

app.delete('/api/reels/:id', verifyToken, async (req, res) => {
  try {
    await db.prepare('DELETE FROM reels WHERE id = ?').run(req.params.id);
    res.json({ message: 'Reel deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete reel' });
  }
});

app.put('/api/reels-reorder', verifyToken, async (req, res) => {
  try {
    const { items } = req.body; // array of { id, order_index }
    const updateStmt = await db.prepare('UPDATE reels SET order_index = ? WHERE id = ?');
    for (const item of items) {
      await updateStmt.run(item.order_index, item.id);
    }
    res.json({ message: 'Reels reordered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder reels' });
  }
});

/* ==========================================================================
   HORIZONTAL VIDEOS (16:9)
   ========================================================================== */

app.get('/api/horizontal-videos', async (req, res) => {
  try {
    const videos = await db.prepare('SELECT * FROM horizontal_videos ORDER BY order_index ASC, id DESC').all();
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch horizontal videos' });
  }
});

app.post('/api/horizontal-videos', verifyToken, async (req, res) => {
  try {
    const { title, category, client, video_url, thumbnail_url, description, duration, year, is_featured, order_index } = req.body;
    if (!title || !video_url) {
      return res.status(400).json({ error: 'Title and video URL are required' });
    }

    const maxOrder = await db.prepare('SELECT COALESCE(MAX(order_index), 0) as maxOrder FROM horizontal_videos').get();
    const newOrder = (order_index !== undefined && order_index !== null && order_index !== '') ? Number(order_index) : ((maxOrder.maxOrder || 0) + 1);

    const result = await db.prepare(`
      INSERT INTO horizontal_videos (title, category, client, video_url, thumbnail_url, description, duration, year, is_featured, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      category || 'Commercials',
      client || '',
      video_url,
      thumbnail_url || '',
      description || '',
      duration || '02:00',
      year || '2025',
      is_featured ? 1 : 0,
      newOrder
    );

    const created = await db.prepare('SELECT * FROM horizontal_videos WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create horizontal video error:', err);
    res.status(500).json({ error: 'Failed to create horizontal video' });
  }
});

app.put('/api/horizontal-videos/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, client, video_url, thumbnail_url, description, duration, year, is_featured, order_index } = req.body;

    const existing = await db.prepare('SELECT * FROM horizontal_videos WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Horizontal video not found' });
    const finalOrder = (order_index !== undefined && order_index !== null && order_index !== '') ? Number(order_index) : (existing.order_index ?? 0);

    await db.prepare(`
      UPDATE horizontal_videos SET
        title = ?,
        category = ?,
        client = ?,
        video_url = ?,
        thumbnail_url = ?,
        description = ?,
        duration = ?,
        year = ?,
        is_featured = ?,
        order_index = ?
      WHERE id = ?
    `).run(
      title,
      category,
      client,
      video_url,
      thumbnail_url,
      description,
      duration,
      year,
      is_featured ? 1 : 0,
      finalOrder,
      id
    );

    const updated = await db.prepare('SELECT * FROM horizontal_videos WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update horizontal video' });
  }
});

app.delete('/api/horizontal-videos/:id', verifyToken, async (req, res) => {
  try {
    await db.prepare('DELETE FROM horizontal_videos WHERE id = ?').run(req.params.id);
    res.json({ message: 'Horizontal video deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete horizontal video' });
  }
});

app.put('/api/horizontal-videos-reorder', verifyToken, async (req, res) => {
  try {
    const { items } = req.body; // array of { id, order_index }
    const updateStmt = await db.prepare('UPDATE horizontal_videos SET order_index = ? WHERE id = ?');
    for (const item of items) {
      await updateStmt.run(item.order_index, item.id);
    }
    res.json({ message: 'Horizontal videos reordered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder horizontal videos' });
  }
});

/* ==========================================================================
   CLIENT TESTIMONIALS (9:16 VERTICAL)
   ========================================================================== */

app.get('/api/testimonials', async (req, res) => {
  try {
    const testimonials = await db.prepare('SELECT * FROM testimonials ORDER BY order_index ASC, id DESC').all();
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

app.post('/api/testimonials', verifyToken, async (req, res) => {
  try {
    const { client_name, client_title, company, avatar_url, video_url, thumbnail_url, quote, rating, order_index } = req.body;
    if (!client_name || !video_url) {
      return res.status(400).json({ error: 'Client name and video URL are required' });
    }

    const maxOrder = await db.prepare('SELECT COALESCE(MAX(order_index), 0) as maxOrder FROM testimonials').get();
    const newOrder = (order_index !== undefined && order_index !== null && order_index !== '') ? Number(order_index) : ((maxOrder.maxOrder || 0) + 1);

    const result = await db.prepare(`
      INSERT INTO testimonials (client_name, client_title, company, avatar_url, video_url, thumbnail_url, quote, rating, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      client_name,
      client_title || '',
      company || '',
      avatar_url || '',
      video_url,
      thumbnail_url || '',
      quote || '',
      rating || 5,
      newOrder
    );

    const created = await db.prepare('SELECT * FROM testimonials WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create testimonial error:', err);
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
});

app.put('/api/testimonials/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { client_name, client_title, company, avatar_url, video_url, thumbnail_url, quote, rating, order_index } = req.body;

    const existing = await db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Testimonial not found' });
    const finalOrder = (order_index !== undefined && order_index !== null && order_index !== '') ? Number(order_index) : (existing.order_index ?? 0);

    await db.prepare(`
      UPDATE testimonials SET
        client_name = ?,
        client_title = ?,
        company = ?,
        avatar_url = ?,
        video_url = ?,
        thumbnail_url = ?,
        quote = ?,
        rating = ?,
        order_index = ?
      WHERE id = ?
    `).run(
      client_name,
      client_title,
      company,
      avatar_url,
      video_url,
      thumbnail_url,
      quote,
      rating,
      finalOrder,
      id
    );

    const updated = await db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
});

app.delete('/api/testimonials/:id', verifyToken, async (req, res) => {
  try {
    await db.prepare('DELETE FROM testimonials WHERE id = ?').run(req.params.id);
    res.json({ message: 'Testimonial deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

app.put('/api/testimonials-reorder', verifyToken, async (req, res) => {
  try {
    const { items } = req.body; // array of { id, order_index }
    const updateStmt = await db.prepare('UPDATE testimonials SET order_index = ? WHERE id = ?');
    for (const item of items) {
      await updateStmt.run(item.order_index, item.id);
    }
    res.json({ message: 'Testimonials reordered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder testimonials' });
  }
});

/* ==========================================================================
   SELECTED PROJECTS (CASE STUDIES)
   ========================================================================== */

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await db.prepare('SELECT * FROM projects ORDER BY order_index ASC, id DESC').all();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.post('/api/projects', verifyToken, async (req, res) => {
  try {
    const {
      title,
      client,
      category,
      thumbnail_url,
      video_url,
      brief,
      approach,
      deliverables,
      software_used,
      before_image_url,
      after_image_url,
      metrics,
    } = req.body;

    const maxOrder = await db.prepare('SELECT COALESCE(MAX(order_index), 0) as maxOrder FROM projects').get();
    const newOrder = (maxOrder.maxOrder || 0) + 1;

    const result = await db.prepare(`
      INSERT INTO projects (
        title, client, category, thumbnail_url, video_url, brief, approach, deliverables, software_used, before_image_url, after_image_url, metrics, order_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      client,
      category,
      thumbnail_url || '',
      video_url,
      brief,
      approach,
      deliverables,
      software_used,
      before_image_url || '',
      after_image_url || '',
      metrics || '',
      newOrder
    );

    const created = await db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/api/projects/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      client,
      category,
      thumbnail_url,
      video_url,
      brief,
      approach,
      deliverables,
      software_used,
      before_image_url,
      after_image_url,
      metrics,
    } = req.body;

    await db.prepare(`
      UPDATE projects SET
        title = ?,
        client = ?,
        category = ?,
        thumbnail_url = ?,
        video_url = ?,
        brief = ?,
        approach = ?,
        deliverables = ?,
        software_used = ?,
        before_image_url = ?,
        after_image_url = ?,
        metrics = ?
      WHERE id = ?
    `).run(
      title,
      client,
      category,
      thumbnail_url,
      video_url,
      brief,
      approach,
      deliverables,
      software_used,
      before_image_url,
      after_image_url,
      metrics,
      id
    );

    const updated = await db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', verifyToken, async (req, res) => {
  try {
    await db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

/* ==========================================================================
   SERVICES
   ========================================================================== */

app.get('/api/services', async (req, res) => {
  try {
    const services = await db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY order_index ASC').all();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.post('/api/services', verifyToken, async (req, res) => {
  try {
    const { title, slug, icon_name, short_description, deliverables, turnaround } = req.body;
    const maxOrder = await db.prepare('SELECT COALESCE(MAX(order_index), 0) as maxOrder FROM services').get();
    const newOrder = (maxOrder.maxOrder || 0) + 1;

    const result = await db.prepare(`
      INSERT INTO services (title, slug, icon_name, short_description, deliverables, turnaround, order_index, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(title, slug, icon_name || 'Film', short_description, deliverables, turnaround, newOrder);

    const created = await db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

app.put('/api/services/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, icon_name, short_description, deliverables, turnaround, is_active } = req.body;

    await db.prepare(`
      UPDATE services SET
        title = ?,
        icon_name = ?,
        short_description = ?,
        deliverables = ?,
        turnaround = ?,
        is_active = ?
      WHERE id = ?
    `).run(title, icon_name, short_description, deliverables, turnaround, is_active ? 1 : 0, id);

    const updated = await db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

app.delete('/api/services/:id', verifyToken, async (req, res) => {
  try {
    await db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

/* ==========================================================================
   CONTACT INQUIRIES
   ========================================================================== */

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, company, project_type, budget, message, brief_url } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required fields.' });
    }

    const result = await db.prepare(`
      INSERT INTO messages (name, email, company, project_type, budget, message, brief_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'unread')
    `).run(
      name,
      email,
      company || '',
      project_type || 'General Inquiry',
      budget || 'Flexible',
      message,
      brief_url || ''
    );

    res.status(201).json({
      success: true,
      message: 'Thank you! Your inquiry has been received. I will review your project details and get back to you within 24 hours.',
      id: result.lastInsertRowid,
    });
  } catch (err) {
    console.error('Contact submit error:', err);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

app.get('/api/messages', verifyToken, async (req, res) => {
  try {
    const messages = await db.prepare('SELECT * FROM messages ORDER BY id DESC').all();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.patch('/api/messages/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    await db.prepare('UPDATE messages SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: 'Message status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

app.delete('/api/messages/:id', verifyToken, async (req, res) => {
  try {
    await db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

/* ==========================================================================
   FILE UPLOAD (VIDEO & IMAGE)
   ========================================================================== */

app.post('/api/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Determine resource type for Cloudinary (video or image)
    const isVideo = req.file.mimetype.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    // Upload buffer to Cloudinary
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'portfolio',
      resource_type: resourceType,
      // Use original filename (sanitized) as public_id
      public_id: `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_')}`,
    });

    res.json({
      message: 'File uploaded successfully',
      url: result.secure_url,
      filename: result.public_id,
      size: result.bytes,
      mimetype: req.file.mimetype,
      cloudinary_id: result.public_id,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'File upload failed', details: err.message });
  }
});

/* --------------------------------------------------------------------------
   PROFILE PICTURE UPLOAD
   Dedicated endpoint: uploads image, auto-saves URL to settings table
   so the navbar can fetch it from /api/settings without extra code.
   -------------------------------------------------------------------------- */

// Multer config specifically for profile pictures (images only, 5MB max)
const profilePicUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

app.post('/api/upload/profile-picture', verifyToken, profilePicUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'portfolio',
      public_id: `profile-picture-${Date.now()}`,
      resource_type: 'image',
    });

    const fileUrl = result.secure_url;

    // Persist URL into settings so /api/settings returns it to the frontend
    await db.prepare(`
      INSERT INTO settings (key, value) VALUES ('profile_picture_url', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(fileUrl);

    res.json({
      message: 'Profile picture updated successfully',
      url: fileUrl,
    });
  } catch (err) {
    console.error('Profile picture upload error:', err);
    res.status(500).json({ error: 'Profile picture upload failed', details: err.message });
  }
});

app.delete('/api/upload/profile-picture', verifyToken, async (req, res) => {
  try {
    // Remove from settings
    await db.prepare(`DELETE FROM settings WHERE key = 'profile_picture_url'`).run();

    res.json({ message: 'Profile picture removed' });
  } catch (err) {
    console.error('Profile picture delete error:', err);
    res.status(500).json({ error: 'Failed to remove profile picture' });
  }
});

/* ==========================================================================
   SERVE PRODUCTION CLIENT BUILD
   ========================================================================== */

const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const http = require('http');

// Wait for sql.js database to initialize, then start the server
db.initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Cinematic Portfolio API server running on http://localhost:${PORT}`);
  });

  // Also bind to port 3000 if available
  try {
    const server3000 = http.createServer((req, res) => { app(req, res); });
    server3000.listen(3000, () => {
      console.log(`Portfolio also accessible on http://localhost:3000`);
    });
    server3000.on('error', () => {});
  } catch (e) {}

}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
