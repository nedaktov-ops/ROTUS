# ROTUS - The Rotten Brain of POTUS
## Complete Project Summary

**Status:** 🟢 Core Complete - Ready for Enhancement

---

## ✅ What's Built

### Backend (Node.js + Express + SQLite)
- **Server:** `webapp/server.js` running on port 3000
- **Database:** `database/rotus.db` with 53 verified quotes
- **API Endpoints:**
  - `GET /api/stats` - Returns counts (total, verified, by category)
  - `GET /api/quotes?q=&platform=&category=&limit=` - Search/filter quotes
  - `GET /api/quotes/:id` - Get single quote with sources
  - `POST /api/quotes` - Add new quote

### Frontend (Vanilla JS + CSS)
- **Single Page App:** `webapp/index.html` (531 lines, all-in-one)
- **Features:**
  - Quote browser with grid layout
  - Search by keyword
  - Filter by platform (Speech, Interview, Social Media, Truth Social, X)
  - Filter by category (funny, lie, outrageous, ridiculous, unexpected)
  - Modal popup with full quote details
  - Stats dashboard (total quotes, verified count, sources count)
  - Responsive design (mobile-friendly)

### Database (SQLite + FTS5)
- **53 verified quotes** from Donald Trump
- **Categories:** funny (11), lie (13), outrageous (13), ridiculous (9), unexpected (7)
- **Sources:** FactCheck.org, PolitiFact, Snopes
- **Full-text search** enabled via FTS5
- **Schema:** quotes, sources, entities, tags tables

### Mobile Apps (Capacitor)
- **Android:** `android/` directory initialized, synced with web assets
- **iOS:** `ios/` directory initialized (requires macOS + Xcode to build)
- **Capacitor config:** `capacitor.config.json` with appId "com.rotus.app"

### AI & Knowledge Tools
- **MemPalace:** Installed in `venv/`, initialized for project, mined
- **Graphify:** Python package installed in `venv/`, detects 61 files in vault
- **Playwright:** Installed in `venv/` for future web scraping
- **Obsidian Vault:** `obsidian-vault/` with 55 quote files exported from DB

---

## 🚀 Quick Start

### Start the Server
```bash
cd /home/adrian/Desktop/NEDAILAB/ROTUS
./start-rotus.sh
# OR manually:
cd webapp && PORT=3000 node server.js
```

### Access the App
- **Web:** http://localhost:3000
- **API Stats:** http://localhost:3000/api/stats
- **API Quotes:** http://localhost:3000/api/quotes?limit=5

### Add More Quotes
```bash
cd webapp
node add-more-quotes-3.js  # Adds 20 more quotes
node export-from-db.js     # Exports to Obsidian vault
```

### Run Graphify
```bash
cd /home/adrian/Desktop/NEDAILAB/ROTUS
source venv/bin/activate
python3 -c "from graphify.detect import detect; from pathlib import Path; print(detect(Path('obsidian-vault')))"
```

---

## 📊 Data Sources & Verification

All quotes are verified through:
1. **FactCheck.org** - https://www.factcheck.org/person/donald-trump/
2. **PolitiFact** - https://www.politifact.com/factchecks/list/?speaker=donald-trump
3. **Snopes** - https://www.snopes.com/fact-check/?s=trump

Each quote includes:
- ✅ Exact quote text
- 📅 Date spoken
- 📍 Location
- 📱 Platform (Truth Social, X, Interview, Speech, Rally)
- 📝 Context/backdrop
- 🔗 Source URL(s)
- ✔️ Verification status (all 53 are "verified")
- 📊 Confidence score (1.0 = 100%)

---

## 🔧 Tech Stack

| Layer | Technology |
|------|------------|
| **Backend** | Node.js + Express + better-sqlite3 |
| **Frontend** | Vanilla JS + CSS (single HTML file) |
| **Database** | SQLite with FTS5 full-text search |
| **Mobile** | Capacitor (iOS + Android wrappers) |
| **AI Memory** | MemPalace (local, in `venv/`) |
| **Knowledge Graph** | Graphify (Python, in `venv/`) |
| **Scraping** | Playwright (Python, in `venv/`) |
| **Vault** | Obsidian markdown notes |

---

## 📋 Project Structure

```
ROTUS/
├── start-rotus.sh           # Quick start script
├── README.md                # Project documentation
├── PROJECT-STATUS.md        # Detailed status (see file)
├── database/
│   ├── rotus.db           # SQLite database (53 quotes)
│   └── schema.sql         # Database schema
├── webapp/
│   ├── server.js          # Express backend (335 lines)
│   ├── index.html         # Single-page app (531 lines)
│   ├── app.js             # Frontend JS (deprecated, now in index.html)
│   ├── style.css          # Styles (deprecated, now in index.html)
│   ├── export-from-db.js  # Export DB → Obsidian
│   ├── add-sample-quotes.js
│   ├── add-more-quotes.js
│   └── add-more-quotes-2.js
├── obsidian-vault/
│   ├── Quotes/           # 55 quote markdown files
│   ├── People/
│   ├── Topics/
│   ├── Dashboards/
│   └── README.md
├── android/                 # Capacitor Android project
├── ios/                     # Capacitor iOS project
├── venv/                    # Python virtual environment
│   ├── bin/
│   ├── lib/python3.12/site-packages/
│   │   ├── mempalace/
│   │   ├── graphify/
│   │   └── playwright/
├── graphify-repo/           # Cloned from GitHub (JS version)
├── graphify-py/             # Cloned from safishamsi (Python version)
├── graphify-out/            # Graphify output
└── capacitor.config.json
```

---

## 🎯 Next Steps (Prioritized)

### Phase 1: Content (PRIORITY: HIGH)
1. **Add 50+ more quotes** to reach 100+ total
   - Use the scraper: `venv/bin/python scraper/trump_quotes_scraper.py`
   - Or manually: `curl -X POST http://localhost:3000/api/quotes -d {...}`
2. **Enhance verification** - add Archive.org links, video timestamps
3. **Add media** - photos/videos of quotes being said

### Phase 2: Features (PRIORITY: MEDIUM)
1. **Random Quote** - "Quote of the Day" feature
2. **Share buttons** - Twitter, Facebook, WhatsApp sharing
3. **Favorites** - Let users bookmark favorite quotes
4. **Timeline view** - Quotes displayed chronologically
5. **Map view** - Quotes by location on a map

### Phase 3: Mobile & Deploy (PRIORITY: MEDIUM)
1. **Build Android APK:**
   ```bash
   npx cap sync android
   cd android && ./gradlew assembleDebug
   ```
2. **Test iOS build** (requires macOS + Xcode)
3. **Deploy web version** to Vercel/Render/Heroku

### Phase 4: AI & Knowledge (PRIORITY: LOW)
1. **Fix Graphify** - investigate why extraction returns 0 nodes
2. **Automated scraping** - run Playwright scraper on schedule
3. **Entity recognition** - auto-tag people, places, organizations
4. **Knowledge graph viz** - interactive graph of related quotes

---

## 🤝 How to Contribute

1. **Add quotes:** Run `node add-more-quotes-3.js` or create your own
2. **Verify quotes:** Ensure all quotes have multiple source links
3. **Export to Obsidian:** Run `node webapp/export-from-db.js`
4. **Submit PR:** With new verified quotes

---

## ⚖️ Legal & Ethic

- **Parody/Fact-check:** This is a political commentary project under Fair Use
- **Verification:** All quotes are sourced from reputable fact-checkers
- **No harm intent:** Educational and informational purposes only
- **Attribution:** All sources are credited

---

## 📱 Access & Links

- **Current URL:** http://localhost:3000 (when server running)
- **API:** http://localhost:3000/api/stats
- **GitHub:** (Add your repo URL here)
- **Live Demo:** (Deploy to add URL)

---

**Built with ❤️ using Node.js, SQLite, Capacitor, MemPalace, Graphify, and Obsidian.**

**Project Location:** `/home/adrian/Desktop/NEDAILAB/ROTUS`
**Server Command:** `cd webapp && PORT=3000 node server.js`
**Current Status:** 53 quotes, web app running, mobile apps initialized
