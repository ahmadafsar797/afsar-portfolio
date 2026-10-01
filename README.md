# ALEX VANCE | Cinematic Video Editing Portfolio & Creative Studio

A premium, cinematic, and highly polished video editing portfolio website engineered for professional freelance Video Editors.

---

## 🌟 Highlights & Key Features

### 1. Typography & Aesthetic Inspiration
Derived from **[Creative Banjara](https://creativebanjara.com/)**, using the exact typography hierarchy:
- **`Cormorant`**: Luxury editorial display serif for cinematic headings, hero titles, client quotes, and numerical impact.
- **`Inter`**: Clean, ultra-legible modern sans-serif for UI, navigation, form inputs, metadata, and body copy.
- **`Archivo`**: Bold uppercase tracking for cinematic badges, film categories, technical specs, and status indicators.

### 2. Design System & Theme
- **Color Palette**: Deep cinematic black (`#070709`), rich obsidian/charcoal surfaces (`#0e0e15`), with warm gold & bronze accents (`#d49a37`, `#e5b158`).
- **Cinematic Atmosphere**: Subtle film grain overlay, radial vignettes, and smooth micro-interactions.
- **Natural Spacing & Layout**: Generous whitespace, default font tracking, avoiding generic AI templates or excessive glassmorphism.

---

## 🎬 Portfolio Sections

1. **Sticky Header Navigation**:
   - Monogram logo with gold hover states.
   - Smooth navigation: *Home, Reels, Horizontal Work, Testimonials, Services, Case Studies, About, Contact*.
   - Quick **Admin Dashboard** button.
   - Prominent **“Let’s Work Together”** CTA.
   - Fully responsive mobile drawer.

2. **Hero Section**:
   - Headline: *“I Edit Stories That Make People Stop Scrolling.”*
   - Positioning: *Short-Form Viral Reels • Commercial Brand Films • YouTube Retention Edits*.
   - Live availability beacon: `🟢 Available for Select Projects (Q1/Q2 2026)`.
   - Ambient cinematic motion background with mute/unmute audio toggle.
   - Dual CTAs: *View My Work* & *Watch Showreel*.
   - Proof statistics: *65M+ Views Generated, 180+ Delivered Projects, 99.4% Client Satisfaction*.

3. **Featured Showreel (16:9)**:
   - High-definition 16:9 master video player with custom play button.
   - Custom cinema controls: timeline scrubbing, mute/unmute, and Theater Mode / Fullscreen lightbox.
   - Technical badges: *4K ProRes Master, Dynamic Rhythms, Foley SFX, DaVinci Film Color*.

4. **Reels & Short-Form Section (9:16)**:
   - Dedicated 9:16 vertical ratio cards for mobile-first content.
   - Interactive category filter pills:
     - *All, Instagram Reels, YouTube Shorts, Social Media Ads, Talking Head Edits, Product Reels, Cinematic Social Content*.
   - **Hover Video Preview**: Smoothly auto-plays muted on hover, pauses on leave.
   - **Instant Mute/Unmute** audio toggle directly on each card.
   - Fullscreen 9:16 vertical lightbox viewer.

5. **Horizontal Video Section (16:9)**:
   - Completely separate section for widescreen productions: *Commercials, Brand films, YouTube documentaries, Corporate films*.
   - Large editorial showcase layouts with director notes, duration, client, and release year.

6. **Client Video Testimonials (“Don’t Take My Word For It.”)**:
   - Authentic 9:16 vertical video testimonials from real founders, agency directors, and creators.
   - Client avatars, companies, roles, written quotes, 5-star ratings, and video playback lightbox.

7. **Services Section**:
   - 9 specialized services:
     1. *Reels & Shorts Editing*
     2. *YouTube Video Editing*
     3. *Social Media Ads*
     4. *Commercial Video Editing*
     5. *Product Video Editing*
     6. *Motion Graphics*
     7. *Color Grading*
     8. *Sound Design*
     9. *Corporate Video Editing*
   - Deliverables list, turnaround badges (e.g. *24-48 Hours*), and *“Book This Service”* buttons that pre-select the project in the contact form.

8. **Selected Projects & Case Studies**:
   - Deep editorial storytelling: Creative Brief, Narrative Strategy, Software Suite, Deliverables, and Campaign Impact.
   - **Interactive Before/After Comparison Slider**: Drag to compare raw flat S-Log3 footage against the final color-graded master.

9. **My Process**:
   - 4-stage visual pipeline: *01 Brief & Story Architecture ➔ 02 Assembly & Retention Edit ➔ 03 Sound, Color & Motion ➔ 04 Feedback & Final Delivery*.

10. **About & Technical Tools**:
    - Editor portrait, creative philosophy (*“Story first. Pacing second. Effects serve the narrative.”*).
    - Tool cards: *Adobe Premiere Pro, After Effects, DaVinci Resolve Studio, Photoshop, Adobe Audition & iZotope, Frame.io*.

11. **Contact Section (“Have a video in mind?”)**:
    - Interactive inquiry form with Name, Email, Company, Project Type, Budget selector, Message, and Footage/Brief Link.
    - Real-time submission saving to SQLite database with delightful confetti celebration.
    - Direct contact channels: Email, WhatsApp, Instagram, LinkedIn.

---

## 🛡️ Functional Admin Dashboard

Access the admin dashboard anytime via the **Admin** button in the header or footer:

- **Default Username**: `admin`
- **Default Password**: `editor2026!`

### Admin Capabilities:
- **Reels Manager**: Add new 9:16 reels, upload MP4 video files, upload custom thumbnail posters, edit titles, clients, views, categories, and delete.
- **Horizontal Videos Manager**: Add/edit/delete 16:9 films, upload videos/posters, update descriptions, duration, and year.
- **Testimonials Manager**: Manage 9:16 video testimonials, upload review videos, edit quotes, names, companies, and ratings.
- **Case Studies Manager**: Create/edit projects with raw vs graded Before/After comparison images, briefs, approaches, and metrics.
- **Services Manager**: Customize service cards, deliverables, and turnaround times.
- **About Section Manager**: Update bio, philosophy, stats, and upload new portrait photos.
- **Client Inquiries Inbox**: Review incoming client leads from the contact form, toggle unread/read status, reply via email, or archive.
- **Site Settings**: Customize hero headline, availability text, WhatsApp number, email, and social links.

---

## 🛠️ Technology Stack & Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend**: Express 5, Node.js native `node:sqlite` (SQLite Database Sync with WAL mode), JWT authentication, bcryptjs password hashing, Multer file upload handling.
- **Database File**: `data/portfolio.db` (auto-seeded on initial launch).
- **Uploaded Media**: `uploads/` (serves uploaded videos and posters).

---

## 🚀 Running The Application

### Start Unified Server (Frontend + Backend on Port 5000):
```bash
npm start
```
Then visit **`http://localhost:5000`** in your browser.

### Development Mode (with Hot Reloading):
```bash
npm run dev
```
Runs Express backend on `http://localhost:5000` and Vite dev server on `http://localhost:3000`.

### Rebuild Production Client:
```bash
npm run build
```
