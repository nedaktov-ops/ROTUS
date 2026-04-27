# ROTUS Development Strategy for OpenCode

**Project:** ROTUS (Rotten Brain of POTUS) - A fact-checking parody mobile app  
**Location:** `/home/adrian/Desktop/NEDAILAB/ROTUS/`  
**Tech Stack:** Node.js + Express, SQLite (FTS5), Vanilla JS + Vite, Capacitor (iOS/Android)  
**AI Tools:** MemPalace, Graphify, Playwright, Obsidian Vault  
**Status:** Core Complete - Ready for Enhancement

---

## 🎯 Project Overview

ROTUS is a content-driven mobile app that:
- Displays verified quotes from Donald Trump with full attribution
- Provides search/filter functionality by platform and category
- Includes stats dashboard and modal detail views
- Uses Capacitor to wrap a web app for iOS/Android distribution
- Leverages AI tools (MemPalace, Graphify) for knowledge management

**Current State:** Backend API + frontend SPA are functional with 53 verified quotes. Mobile projects initialized. AI/Knowledge tools set up but not fully integrated.

---

## 🏗️ Architecture & File Organization

```
ROTUS/
├── AGENTS.md                 ← THIS FILE - OpenCode strategy
├── README.md                 ← Project overview
├── COMPLETE-SUMMARY.md      ← Detailed status
├── PROJECT-STATUS.md         ← Progress tracking
├── start-rotus.sh           ← Quick start script
│
├── webapp/                   ← Express backend + frontend SPA
│   ├── server.js            ← Main API server (335 lines)
│   ├── index.html           ← Single-page app (HTML+CSS+JS)
│   ├── app.js               ← (deprecated, logic moved to index.html)
│   ├── style.css            ← (deprecated, CSS now inline)
│   ├── export-from-db.js    ← DB → Obsidian export
│   └── add-*.js             ← Quote import scripts
│
├── database/
│   ├── rotus.db             ← SQLite database (production)
│   └── schema.sql           ← Schema definition
│
├── android/                  ← Capacitor Android project
│   └── app/build.gradle     ← Gradle config (minSdk needs setting)
│
├── ios/                      ← Capacitor iOS project
│   └── App/AppDelegate.swift
│
├── obsidian-vault/           ← Obsidian knowledge vault
│   ├── Quotes/              ← 55+ markdown quote files
│   ├── People/              ← Person notes
│   ├── Topics/              ← Topic tags
│   └── Dashboards/          ← Dataview queries
│
├── venv/                     ← Python virtual environment
│   └── lib/python3.12/site-packages/
│       ├── mempalace/       ← AI memory system
│       ├── graphify/        ← Knowledge graph extraction
│       └── playwright/      ← Web scraping automation
│
├── quotes/                   ← Raw quote data files
├── scraper/                  ← Playwright scrapers
├── scripts/                  ← Utility scripts
├── sources/                  ← Source attribution files
├── mobile/                   ← Additional mobile configs
└── capacitor.config.json     ← Capacitor configuration
```

---

## 🚀 Quick Start Commands

```bash
cd /home/adrian/Desktop/NEDAILAB/ROTUS

# Start everything (Python venv + web server)
./start-rotus.sh

# OR manually:
source venv/bin/activate
cd webapp
PORT=3000 node server.js
# Access: http://localhost:3000

# Build mobile assets
npm run build
npx cap sync

# Open Android Studio (if installed)
npx cap open android

# Run Graphify knowledge graph
source venv/bin/activate
python3 -m graphify obsidian-vault --obsidian

# Access MemPalace AI memory
mempalace search "weird Trump quotes"
```

---

## 🎯 Development Priorities

### **PHASE 1: Content Expansion (URGENT)**
**Goal:** 100+ verified quotes before mobile deployment

- Use scraper: `venv/bin/python scraper/trump_quotes_scraper.py`
- Manual addition: `curl -X POST http://localhost:3000/api/quotes -H "Content-Type: application/json" -d '{...}'`
- Focus on: variety of platforms (Truth Social, X, speeches, interviews)
- Verify: each quote must have ≥2 source URLs from FactCheck.org, PolitiFact, or Snopes
- Confidence score: set to 1.0 for verified quotes

**Files to modify:** `database/rotus.db` (via API), `webapp/add-more-quotes-*.js`

---

### **PHASE 2: Feature Development (MEDIUM)**
Implement missing planned features:

1. **Random Quote** ("Quote of the Day")
   - API: `GET /api/quotes/random`
   - Frontend: Add button to main page, show in modal
   - File: `webapp/server.js` (add route), `webapp/index.html` (add button)

2. **Share Buttons**
   - Native Web Share API if available, fallback to copy link
   - Share quote text + attribution + source URL
   - File: `webapp/index.html` (add share UI + JS)

3. **Favorites/Bookmarks**
   - Store in localStorage: `localStorage.setItem('favorites', JSON.stringify([...]))`
   - Show count badge, filter quotes by favorites
   - File: `webapp/index.html` (modify filter logic)

4. **Timeline View**
   - Sort quotes by date descending
   - Offer as alternative to grid view (toggle)
   - File: `webapp/index.html` (add timeline CSS + JS)

5. **Map View**
   - Use Leaflet.js or Google Maps API
   - Plot quote locations (requires lat/lon data in DB)
   - Database: add `latitude`, `longitude` columns to `quotes` table
   - File: new `webapp/map.js` or inline in `index.html`

---

### **PHASE 3: Mobile Build & Deployment (HIGH)**
**Android:** Build directly on Linux

```bash
cd /home/adrian/Desktop/NEDAILAB/ROTUS/android
./gradlew assembleDebug  # produces APK at app/build/outputs/apk/debug/
```

**iOS:** Requires macOS. Options:

- **Cloud Build:** Ionic Appflow, Codemagic, GitHub Actions (macOS runner)
- **Remote Mac:** MacStadium, MacInCloud rental
- **Collaborate:** Have macOS contributor build

**Prerequisites for Android:**
- Install OpenJDK 17: `sudo apt install openjdk-17-jdk`
- Set `JAVA_HOME` environment variable
- Install Android SDK command-line tools
- Accept licenses: `yes | sdkmanager --licenses`
- Install platform: `sdkmanager "platforms;android-34" "build-tools;34.0.0"`

---

### **PHASE 4: AI & Knowledge Integration (LOW - OPTIONAL)**
Graphify currently returns 0 nodes. Debug:

1. Check install: `source venv/bin/activate && python3 -c "import graphify; print(graphify.__version__)"`
2. Run detection: `python3 -c "from graphify.detect import detect; from pathlib import Path; print(detect(Path('obsidian-vault')))"`
3. If cache issue: delete `graphify-out/` and re-run
4. See SKILL.md: `/home/adrian/.config/opencode/skills/graphify/SKILL.md`

MemPalace already initialized. Use:
- `mempalace search "query"` - semantic search
- `mempalace mine .` - re-index project files
- `mempalace stats` - view memory statistics

---

## 📋 Technical Specifications & Constraints

**Linux Development Environment:**
- CPU: Intel i5-7200U (2 cores, 4 threads)
- RAM: 7.6 GB total, 3.7 GB available
- No NVIDIA GPU (graphify CPU-only OK for now)
- No Java installed (needed for Android builds)
- Node.js v22.22.2, npm 10.9.7 ✓
- Python 3.12.3 ✓
- OpenCode installed ✓

**Mobile Build Constraints:**
- **Android:** ✅ Full Linux support. Just need JDK + Android SDK
- **iOS:** ❌ Requires macOS or cloud build service. Plan accordingly.
- **Recommendation:** Use cloud CI/CD for iOS (Codemagic, GitHub Actions)

**Performance Considerations:**
- Database: SQLite FTS5 is fast for <10k quotes. Use indexes.
- Frontend: Vanilla JS is lightweight. No build bottleneck with Vite.
- Mobile: Capacitor WebView is adequate for content apps. No complex animations needed.

---

## 🔧 Common Development Tasks

### Add a New API Endpoint
1. Open `webapp/server.js`
2. Add route handler: `app.get('/api/quotes/random', ...)`
3. Export data from database using `better-sqlite3`
4. Test: `curl http://localhost:3000/api/quotes/random`
5. Commit: `git add webapp/server.js && git commit -m "Add random quote API"`

### Modify Frontend UI
1. Edit `webapp/index.html` (everything is in one file)
   - HTML structure at top
   - CSS in `<style>` tag
   - JavaScript in `<script>` tag
2. Refresh browser to see changes (Vite dev server hot reload)
3. Build production: `npm run build`
4. Sync to mobile: `npx cap sync`

### Add Database Column
1. Edit `database/schema.sql`
   ```sql
   ALTER TABLE quotes ADD COLUMN latitude REAL;
   ALTER TABLE quotes ADD COLUMN longitude REAL;
   ```
2. Reinitialize (if in dev): `sqlite3 database/rotus.db < database/schema.sql`
3. Update API serialization in `webapp/server.js`
4. Update frontend to use new field

### Deploy Web Version
- Vercel: `vercel --prod`
- Render: Connect GitHub repo, set build command `npm run build`, start command `node webapp/server.js`
- Heroku: `git push heroku main` (needs Procfile)

---

## 🐛 Known Issues & Solutions

**Issue:** Graphify extraction returns 0 nodes  
**Solution:** The Python version may be outdated. Use the JS version in `graphify-repo/` instead:
```bash
cd graphify-repo
npm install
node graphify.js obsidian-vault
```

**Issue:** Android build fails with "JAVA_HOME not set"  
**Solution:** Install OpenJDK 17 and set environment variable:
```bash
sudo apt install openjdk-17-jdk
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
source ~/.bashrc
```

**Issue:** iOS build required but on Linux  
**Solution:** Use Codemagic (free tier available) or GitHub Actions with macOS runners. Build configured in `ios/` directory.

**Issue:** better-sqlite3 native module fails to install  
**Solution:** Rebuild for your Node version: `npm rebuild better-sqlite3`

**Issue:** Capacitor sync fails  
**Solution:** Ensure web build is up-to-date: `npm run build && npx cap sync`

---

## 📚 OpenCode Usage Guidelines

When OpenCode works on this project:

1. **Always respect existing patterns:**
   - Use Express.js for APIs (router pattern)
   - Use `better-sqlite3` for database queries
   - Frontend: vanilla JS, no frameworks
   - Single HTML file structure (keep CSS/JS inline)

2. **Database changes:**
   - Update `database/schema.sql` first
   - Use parameterized queries to prevent SQL injection
   - Add indexes for performance: `CREATE INDEX idx_quotes_category ON quotes(category)`

3. **API design:**
   - RESTful endpoints: `/api/quotes`, `/api/quotes/:id`, `/api/stats`
   - Return JSON with consistent structure: `{ success: true, data: {...} }` or `{ error: "message" }`
   - Handle CORS: already configured in `server.js`

4. **Mobile builds:**
   - Android: test with `./gradlew assembleDebug` before committing
   - iOS: document mac requirements, don't attempt Linux builds
   - Capacitor plugins: add via npm, then `npx cap sync`

5. **AI/Knowledge tools:**
   - Graphify: use `--obsidian` for Obsidian vault export
   - MemPalace: `.mempalace.yaml` already configured, re-run `mempalace mine .`
   - Obsidian vault: export from DB with `export-from-db.js` after adding quotes

6. **Testing:**
   - Manual browser testing at http://localhost:3000
   -API: use `curl` or Postman to test endpoints
   - Mobile: `npx cap open android` (Android Studio) or cloud for iOS

7. **Deployment:**
   - Web: ensure `PORT` env var is respected
   - Database: SQLite file must be writable
   - Mobile: increment version in `capacitor.config.json` and `package.json`

---

## 🎨 Code Style & Conventions

- **JavaScript:** ES6+ syntax, 4-space indentation, single quotes, semicolons optional
- **Node.js:** CommonJS `require()` (no ES modules)
- **SQL:** UPPERCASE keywords, snake_case column names
- **HTML:** Semantic tags, id attributes for JS hooks
- **CSS:** Embedded in `<style>` in index.html (for now). Could extract later.
- **File naming:** lowercase with hyphens: `add-sample-quotes.js`
- **Commit messages:** "Add X", "Fix Y", "Update Z"

---

## 🔄 Update This Document

When project evolves:
- Update PHASE priorities based on current needs
- Add new known issues and solutions
- Document new API endpoints
- Note changes to architecture or tooling

---

## 📞 Getting Help with OpenCode

When you need OpenCode to:
- **Add features:** "Add a random quote button to the home page"
- **Fix bugs:** "The search filter doesn't work for category 'funny'"
- **Improve performance:** "The quote grid loads slowly with 500 quotes"
- **Deploy:** "Set up GitHub Actions to build iOS app"
- **Integrate AI:** "Connect MemPalace search to the frontend"

OpenCode will read this AGENTS.md to understand the project context and apply the appropriate strategies above.

---

**Last Updated:** 2026-04-27  
**Maintainer:** Adrian  
**OpenCode Model Pref:** Use cloud AI (OpenAI GPT-4o or Anthropic Claude 3.5 Sonnet) for best results. Local models may struggle with complex refactoring.
