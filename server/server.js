const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const db = require('./db');
const { verifyToken, JWT_SECRET } = require('./middleware/auth');
const { syncPermanentSeedCode, importContentIntoDb, seedJsonPath } = require('./seedSync');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Auto-Sync Middleware: Automatically writes any admin Add/Edit/Delete/Settings change to permanent code seed
app.use((req, res, next) => {
  if (
    req.method !== 'GET' &&
    req.path.startsWith('/api/') &&
    !req.path.startsWith('/api/auth') &&
    !req.path.startsWith('/api/contact')
  ) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          syncPermanentSeedCode(db);
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

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

/* ==========================================================================
   AUTHENTICATION ROUTES
   ========================================================================== */

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
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

app.get('/api/auth/me', verifyToken, (req, res) => {
  try {
    const admin = db.prepare('SELECT id, username, email, created_at FROM admins WHERE id = ?').get(req.user.id);
    if (!admin) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: admin });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/auth/change-password', verifyToken, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.user.id);
    if (!admin || !bcrypt.compareSync(currentPassword, admin.password_hash)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);
    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

app.post('/api/admin/sync-seed', verifyToken, (req, res) => {
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

app.get('/api/admin/export-content', verifyToken, (req, res) => {
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

app.post('/api/admin/import-content', verifyToken, (req, res) => {
  try {
    const content = req.body;
    importContentIntoDb(db, content);
    res.json({ message: 'Content restored and synchronized successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Import failed' });
  }
});

/* ==========================================================================
   SETTINGS ROUTES
   ========================================================================== */

app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', verifyToken, (req, res) => {
  try {
    const updateStmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    for (const [key, value] of Object.entries(req.body)) {
      updateStmt.run(key, String(value));
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

app.get('/api/about', (req, res) => {
  try {
    const about = db.prepare('SELECT * FROM about WHERE id = 1').get();
    res.json(about || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch about data' });
  }
});

app.put('/api/about', verifyToken, (req, res) => {
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

    db.prepare(`
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

app.get('/api/reels', (req, res) => {
  try {
    const reels = db.prepare('SELECT * FROM reels ORDER BY order_index ASC, id DESC').all();
    res.json(reels);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reels' });
  }
});

app.post('/api/reels', verifyToken, (req, res) => {
  try {
    const { title, category, client, video_url, thumbnail_url, views_count, duration, is_featured } = req.body;
    if (!title || !video_url) {
      return res.status(400).json({ error: 'Title and video URL are required' });
    }

    const maxOrder = db.prepare('SELECT COALESCE(MAX(order_index), 0) as maxOrder FROM reels').get();
    const newOrder = (maxOrder.maxOrder || 0) + 1;

    const result = db.prepare(`
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

    const created = db.prepare('SELECT * FROM reels WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create reel error:', err);
    res.status(500).json({ error: 'Failed to create reel' });
  }
});

app.put('/api/reels/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, client, video_url, thumbnail_url, views_count, duration, is_featured } = req.body;

    db.prepare(`
      UPDATE reels SET
        title = ?,
        category = ?,
        client = ?,
        video_url = ?,
        thumbnail_url = ?,
        views_count = ?,
        duration = ?,
        is_featured = ?
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
      id
    );

    const updated = db.prepare('SELECT * FROM reels WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update reel' });
  }
});

app.delete('/api/reels/:id', verifyToken, (req, res) => {
  try {
    db.prepare('DELETE FROM reels WHERE id = ?').run(req.params.id);
    res.json({ message: 'Reel deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete reel' });
  }
});

app.put('/api/reels-reorder', verifyToken, (req, res) => {
  try {
    const { items } = req.body; // array of { id, order_index }
    const updateStmt = db.prepare('UPDATE reels SET order_index = ? WHERE id = ?');
    for (const item of items) {
      updateStmt.run(item.order_index, item.id);
    }
    res.json({ message: 'Reels reordered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder reels' });
  }
});

/* ==========================================================================
   HORIZONTAL VIDEOS (16:9)
   ========================================================================== */

app.get('/api/horizontal-videos', (req, res) => {
  try {
    const videos = db.prepare('SELECT * FROM horizontal_videos ORDER BY order_index ASC, id DESC').all();
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch horizontal videos' });
  }
});

app.post('/api/horizontal-videos', verifyToken, (req, res) => {
  try {
    const { title, category, client, video_url, thumbnail_url, description, duration, year, is_featured } = req.body;
    if (!title || !video_url) {
      return res.status(400).json({ error: 'Title and video URL are required' });
    }

    const maxOrder = db.prepare('SELECT COALESCE(MAX(order_index), 0) as maxOrder FROM horizontal_videos').get();
    const newOrder = (maxOrder.maxOrder || 0) + 1;

    const result = db.prepare(`
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

    const created = db.prepare('SELECT * FROM horizontal_videos WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create horizontal video error:', err);
    res.status(500).json({ error: 'Failed to create horizontal video' });
  }
});

app.put('/api/horizontal-videos/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, client, video_url, thumbnail_url, description, duration, year, is_featured } = req.body;

    db.prepare(`
      UPDATE horizontal_videos SET
        title = ?,
        category = ?,
        client = ?,
        video_url = ?,
        thumbnail_url = ?,
        description = ?,
        duration = ?,
        year = ?,
        is_featured = ?
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
      id
    );

    const updated = db.prepare('SELECT * FROM horizontal_videos WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update horizontal video' });
  }
});

app.delete('/api/horizontal-videos/:id', verifyToken, (req, res) => {
  try {
    db.prepare('DELETE FROM horizontal_videos WHERE id = ?').run(req.params.id);
    res.json({ message: 'Horizontal video deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete horizontal video' });
  }
});

/* ==========================================================================
   CLIENT TESTIMONIALS (9:16 VERTICAL)
   ========================================================================== */

app.get('/api/testimonials', (req, res) => {
  try {
    const testimonials = db.prepare('SELECT * FROM testimonials ORDER BY order_index ASC, id DESC').all();
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

app.post('/api/testimonials', verifyToken, (req, res) => {
  try {
    const { client_name, client_title, company, avatar_url, video_url, thumbnail_url, quote, rating } = req.body;
    if (!client_name || !video_url) {
      return res.status(400).json({ error: 'Client name and video URL are required' });
    }

    const maxOrder = db.prepare('SELECT COALESCE(MAX(order_index), 0) as maxOrder FROM testimonials').get();
    const newOrder = (maxOrder.maxOrder || 0) + 1;

    const result = db.prepare(`
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

    const created = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create testimonial error:', err);
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
});

app.put('/api/testimonials/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { client_name, client_title, company, avatar_url, video_url, thumbnail_url, quote, rating } = req.body;

    db.prepare(`
      UPDATE testimonials SET
        client_name = ?,
        client_title = ?,
        company = ?,
        avatar_url = ?,
        video_url = ?,
        thumbnail_url = ?,
        quote = ?,
        rating = ?
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
      id
    );

    const updated = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
});

app.delete('/api/testimonials/:id', verifyToken, (req, res) => {
  try {
    db.prepare('DELETE FROM testimonials WHERE id = ?').run(req.params.id);
    res.json({ message: 'Testimonial deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

/* ==========================================================================
   SELECTED PROJECTS (CASE STUDIES)
   ========================================================================== */

app.get('/api/projects', (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects ORDER BY order_index ASC, id DESC').all();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.get('/api/projects/:id', (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.post('/api/projects', verifyToken, (req, res) => {
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

    const maxOrder = db.prepare('SELECT COALESCE(MAX(order_index), 0) as maxOrder FROM projects').get();
    const newOrder = (maxOrder.maxOrder || 0) + 1;

    const result = db.prepare(`
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

    const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/api/projects/:id', verifyToken, (req, res) => {
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

    db.prepare(`
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

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', verifyToken, (req, res) => {
  try {
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

/* ==========================================================================
   SERVICES
   ========================================================================== */

app.get('/api/services', (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY order_index ASC').all();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.post('/api/services', verifyToken, (req, res) => {
  try {
    const { title, slug, icon_name, short_description, deliverables, turnaround } = req.body;
    const maxOrder = db.prepare('SELECT COALESCE(MAX(order_index), 0) as maxOrder FROM services').get();
    const newOrder = (maxOrder.maxOrder || 0) + 1;

    const result = db.prepare(`
      INSERT INTO services (title, slug, icon_name, short_description, deliverables, turnaround, order_index, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(title, slug, icon_name || 'Film', short_description, deliverables, turnaround, newOrder);

    const created = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

app.put('/api/services/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { title, icon_name, short_description, deliverables, turnaround, is_active } = req.body;

    db.prepare(`
      UPDATE services SET
        title = ?,
        icon_name = ?,
        short_description = ?,
        deliverables = ?,
        turnaround = ?,
        is_active = ?
      WHERE id = ?
    `).run(title, icon_name, short_description, deliverables, turnaround, is_active ? 1 : 0, id);

    const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

app.delete('/api/services/:id', verifyToken, (req, res) => {
  try {
    db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

/* ==========================================================================
   CONTACT INQUIRIES
   ========================================================================== */

app.post('/api/contact', (req, res) => {
  try {
    const { name, email, company, project_type, budget, message, brief_url } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required fields.' });
    }

    const result = db.prepare(`
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

app.get('/api/messages', verifyToken, (req, res) => {
  try {
    const messages = db.prepare('SELECT * FROM messages ORDER BY id DESC').all();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.patch('/api/messages/:id/status', verifyToken, (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE messages SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: 'Message status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

app.delete('/api/messages/:id', verifyToken, (req, res) => {
  try {
    db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

/* ==========================================================================
   FILE UPLOAD (VIDEO & IMAGE)
   ========================================================================== */

app.post('/api/upload', verifyToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'File upload failed' });
  }
});

/* --------------------------------------------------------------------------
   PROFILE PICTURE UPLOAD
   Dedicated endpoint: uploads image, auto-saves URL to settings table
   so the navbar can fetch it from /api/settings without extra code.
   -------------------------------------------------------------------------- */

// Multer config specifically for profile pictures (images only, 5MB max)
const profilePicStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `profile-picture${ext}`);
  },
});

const profilePicUpload = multer({
  storage: profilePicStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

app.post('/api/upload/profile-picture', verifyToken, profilePicUpload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Always serve at a stable, cache-busting URL
    const fileUrl = `/uploads/${req.file.filename}?v=${Date.now()}`;

    // Persist URL into settings so /api/settings returns it to the frontend
    db.prepare(`
      INSERT INTO settings (key, value) VALUES ('profile_picture_url', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(fileUrl);

    res.json({
      message: 'Profile picture updated successfully',
      url: fileUrl,
    });
  } catch (err) {
    console.error('Profile picture upload error:', err);
    res.status(500).json({ error: 'Profile picture upload failed' });
  }
});

app.delete('/api/upload/profile-picture', verifyToken, (req, res) => {
  try {
    // Remove from settings
    db.prepare(`DELETE FROM settings WHERE key = 'profile_picture_url'`).run();

    // Try to delete the file too (all common extensions)
    ['jpg', 'jpeg', 'png', 'webp', 'gif'].forEach((ext) => {
      const filePath = path.join(uploadsDir, `profile-picture.${ext}`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

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
