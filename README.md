# ROTUS - The Rotten Brain of POTUS

A parody/fact-checking app that collects and collates verified quotes from Donald Trump, the 47th President of the United States.

## 🎯 Mission

ROTUS (Rotten Brain of POTUS) is a fun, fact-based app that:
- Collects weird, funny, outrageous, ridiculous, or unexpected statements
- Verifies every quote with multiple source attribution
- Provides full context: date, time, location, platform, backdrop
- Works as both entertainment and fact-checker

## 🏗️ Architecture

```
ROTUS/
├── quotes/              # Quote collections and raw data
├── database/            # SQLite database with schema
├── scraper/             # Playwright scrapers for quote collection
├── webapp/              # Web frontend (HTML/CSS/JS) + Express backend
├── mobile/              # Mobile app (Capacitor-wrapped)
├── obsidian-vault/      # Obsidian vault for knowledge management
├── scripts/             # Utility scripts
├── docs/                # Documentation
└── venv/                # Python virtual environment
```

## 🛠️ Tech Stack

- **Backend**: Node.js + Express + better-sqlite3
- **Frontend**: Vanilla JS + Vite (build tool)
- **Mobile**: Capacitor (iOS/Android wrappers)
- **Database**: SQLite with FTS5 full-text search
- **AI Memory**: MemPalace (local AI memory system)
- **Knowledge Graph**: Graphify (for entity relationships)
- **Scraping**: Playwright (automated quote collection)
- **Vault**: Obsidian (knowledge management)

## ✨ Features

- Full-text search with SQLite FTS5
- Pagination (Load More) and sorting (date, category, platform)
- Random quote generator
- Favorites (heart icon) with local storage persistence
- Timeline view toggle
- Knowledge graph visualization with community detection
- Multi-source attribution and entity tagging
- Health check endpoint for monitoring


## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd /home/adrian/Desktop/NEDAILAB/ROTUS
source venv/bin/activate  # Activate Python venv
npm install               # Install Node dependencies
```

### 2. Initialize Database
```bash
cd database
sqlite3 rotus.db < schema.sql
cd ..
```

### 3. Add Sample Quotes
```bash
node webapp/add-sample-quotes.js
```

### 4. Start Web Server
```bash
cd webapp
node server.js
# Opens at http://localhost:3000
```

### 5. Set Up Mobile App (Optional)
```bash
npm install @capacitor/core @capacitor/cli
npx cap init rotus com.rotus.app --web-dir=webapp
npx cap add ios
npx cap add android
```

## 📚 API

For detailed API endpoint documentation, see [docs/API.md](docs/API.md).

## 📊 Data Sources

All quotes are verified through:
- **FactCheck.org** - Comprehensive fact-checking
- **PolitiFact** - Truth-O-Meter ratings
- **Snopes** - Rumor verification
- **Truth Social** - Official posts (public archives)
- **X (Twitter)** - Historical tweets (Internet Archive)
- **Transcripts** - Fox News, CBS, NBC, etc.

## 🔍 Verification Standards

Every quote includes:
- ✅ Exact quote text
- 📅 Date and time spoken
- 📍 Location (city, venue, event)
- 📱 Platform (Truth Social, X, Interview, Speech, Rally)
- 📝 Context and backdrop
- 🔗 Multiple source URLs
- ✔️ Verification status (verified/pending/disputed)
- 📊 Confidence score (0.00 to 1.00)

## 🧠 MemPalace Integration

ROTUS uses MemPalace for AI memory:
```bash
source venv/bin/activate
mempalace init . --yes
mempalace mine .
mempalace search "weird Trump quotes"
```

## 🕸️ Graphify Knowledge Graph

Visualize connections between quotes, people, and topics:
```bash
./run-graphify.sh
```
Outputs `graphify-out/graph.html` and powers the in-app graph at `/graph`.

## ⚖️ Legal Disclaimer

ROTUS is a parody/fact-checking project created under Fair Use for:
- Political commentary
- Educational purposes
- Fact-checking and verification

All quotes are attributed to original sources. We neither support nor oppose any political figure - we simply document verified public statements.

## 📱 Mobile Apps

The app works on:
- ✅ Any web browser (Chrome, Safari, Firefox, Edge)
- ✅ iOS (via Capacitor wrapper)
- ✅ Android (via Capacitor wrapper)

## 🤝 Contributing

1. Fork the repository
2. Add verified quotes with proper sourcing
3. Ensure all quotes have multiple source attributions
4. Submit a pull request

## 📧 Contact

For questions or to report incorrect quotes: [your-email]

---

Built with ❤️ using MemPalace, Graphify, Playwright, and Obsidian.
