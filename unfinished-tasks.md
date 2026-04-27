# Unfinished Tasks - ROTUS Upgrade

This file tracks tasks that require further investigation, have blockers, or are deferred to later phases. Completed tasks are not listed here.

Last Updated: 2026-04-27 (Phase 1 Implementation)

---

## Phase 1: Stabilize Core & Activate Graphify - COMPLETED

All Phase 1 tasks have been implemented:

- **Export path fixed** (`export-from-db.js` writes to `obsidian-vault/Quotes/`)
- **Vault re-exported** (53 quote notes, no duplicates)
- **Vault-to-graph pipeline** script created: `scripts/generate_graph_from_vault.py`
- **run-graphify.sh** updated to call full pipeline; outputs `graph.json`, `graph.html`, `GRAPH_REPORT.md`
- **FTS5 search** enabled in `/api/quotes` using `MATCH`; `OFFSET` support added for pagination
- **Auxiliary tables** API extended:
  - POST `/api/quotes` now accepts `sources`, `entities`, `tags`
  - New GET endpoints: `/api/quotes/:id/sources`, `/api/quotes/:id/entities`, `/api/quotes/:id/tags`, `/api/tags`
- **Dead code removed**: deleted `webapp/app.js`, `webapp/style.css`, `webapp/all-quotes.html`; archived `add-*.js` → `scripts/legacy/`
- **Orphaned repo** deleted: `graphify-repo/`

---

## Open Items from Phase 1

### Export Script - Missing Auxiliary Relationships
`webapp/export-from-db.js` only exports quotes and hard-coded tags. It does **not** export `sources`, `entities`, or `tags` from the database. This means quotes added via API (with those fields) will not appear in the Obsidian vault. **Action needed**: update script to:
- Query sources for each quote and include in frontmatter or body
- Query entities and include in frontmatter or body
- Include actual tag list from `tags` table

**Why important**: Keeps vault in sync and allows Graphify to see all connections.

### FTS5 Ranking (Optional)
Search results ordered by `date_spoken DESC` only. Could use `bm25(quotes_fts)` for relevance ranking, but availability varies across SQLite builds. **Research**: Add `ORDER BY CASE WHEN bm25(quotes_fts) IS NULL THEN date_spoken ELSE bm25(quotes_fts) END` or fallback.

---

## Phase 2: Feature Completion (Mostly DONE)

Completed:

- ✅ **Random Quote** API (`/api/quotes/random`) + UI button (header)
- ✅ **Favorites** system: LocalStorage, heart icons, filter checkbox, persistence
- ✅ **Pagination UI**: "Load More" button (client-side infinite scroll with `limit`/`offset`)
- ✅ **Sorting controls**: dropdown with options (Date, Category, Platform; asc/desc)
- ✅ Knowledge Graph route (`/graph`) now served
- ✅ Export script enhanced: includes `sources` from DB, `entities` section, `tags` from DB

Remaining minor:

- Timeline view toggle (low priority) – not started

---

## Phase 3: Mobile & Deployment (Partially Started)

### Android Build
- Need to verify `android/variables.gradle` exists; if missing, create with:
  ```
  ext {
      compileSdkVersion = 34
      minSdkVersion = 21
      targetSdkVersion = 34
      androidxAppCompatVersion = '1.6.1'
      androidxCoordinatorLayoutVersion = '1.2.0'
      coreSplashScreenVersion = '1.0.0'
      junitVersion = '4.13.2'
      androidxJunitVersion = '1.1.5'
      androidxEspressoCoreVersion = '1.5.1'
  }
  ```
- Ensure OpenJDK 17 installed (`sudo apt install openjdk-17-jdk`)
- Build: `npx cap sync android && cd android && ./gradlew assembleDebug`
- Test APK on device/emulator.

### iOS Build
- Requires macOS or cloud CI (Codemagic, GitHub Actions macOS runners)
- Not feasible on Linux; defer to later.

### Web Deployment
- Choose platform (Render.com, Fly.io, Railway) that supports long-running Node servers.
- Add `Procfile`: `web: node webapp/server.js`
- Add `engines.node` in `package.json`
- Ensure environment variables (PORT, NODE_ENV=production)
- Consider enabling gzip compression middleware (`compression`) and logging (`morgan`).

---

## Phase 4: AI & Advanced Features (Deferred)

### Graph Page in App
Serve `graph.html` at `/graph` route; add nav link. Optional interactivity (node click → quote modal) later.

### MemPalace Q&A
Prototype backend endpoint `/api/mempalace/ask?q=...` that calls `mempalace` via subprocess or Python embedding. Would require user to have local LLM configured or Anthropic API key.

### Entity Extraction & Auto-Tagging
Use NLP (spaCy) to auto-extract entities from quote text and populate `entities` table. Could be a one-time script.

### Map View
- Add `latitude`,`longitude` columns to `quotes` via migration.
- Geocode location strings (batch with Nominatim; respect rate limits).
- Frontend: Leaflet integration with markers.

### Admin UI
Simple Basic Auth + CRUD endpoints for quotes, sources, entities. UI: HTML forms.

---

## Known Risks & Unknowns

- **Graphify extraction**: Only wikilinks are used; tags and implicit relations may be missed. Could consider edges for `#hashtags` as well.
- **Database migrations**: No migration framework; manual `ALTER TABLE` acceptable for small changes.
- **Testing**: No automated tests; consider adding API integration tests (Mocha/Chai) for core endpoints.
- **Duplicate node IDs in vault**: Our safe_id uses full relative path; ensures uniqueness even if two notes share same filename in different folders.

---

**End of unfinished-tasks.md**
