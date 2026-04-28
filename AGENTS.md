# ROTUS Pre‑Release Quality Strategy

**Goal:** 100% quality assurance before any public deployment. No release until all gates are met.

**Audit Summary:** 178 quotes, 42.7% have NULL platform/category, platform values not normalized (11 distinct), mobile app stuck on “Loading quotes…”, missing offline bundle functionality, no E2E tests.

---

## 🎯 Critical Bug Fixes (Stage 0)

### Issue: Mobile app never loads quotes

**Root cause:** `displayQuotes`, `createLoadMoreButton`, `showLoadMore`, `hideLoadMore` are undefined; `loadQuotes` references `newQuotes` instead of `quotes`; mobile code relies on `quotes-bundle.json` which is not generated.

**Fixes required in `webapp/index.html`:**

1. Add pagination UI functions after line 732 (before `populateModal`):
```javascript
function displayQuotes(quotes, append = false) {
    const container = document.getElementById('quotes-container');
    if (!append) container.innerHTML = '';

    if (quotes.length === 0 && !append) {
        container.innerHTML = '<div class="loading">No quotes found.</div>';
        return;
    }

    quotes.forEach(q => {
        const card = document.createElement('div');
        card.className = 'quote-card';
        const isFav = getFavorites().includes(q.id);
        card.innerHTML = `
            <svg class="favorite-heart ${isFav ? 'filled' : ''}" onclick="event.stopPropagation(); toggleFavorite(${q.id})" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <div class="quote-text">"${escapeHtml(q.quote_text)}"</div>
            <div class="quote-meta">
                <span class="badge badge-verified">${q.verification_status || 'pending'}</span>
                ${q.category ? `<span class="badge badge-category">${q.category}</span>` : ''}
                <span>${q.platform || 'Unknown platform'}</span>
                <span>${q.date_spoken || ''}</span>
            </div>
        `;
        card.onclick = () => showQuote(q.id);
        container.appendChild(card);
    });
}

function createLoadMoreButton() {
    const pagination = document.getElementById('pagination');
    if (!document.getElementById('load-more-btn')) {
        const btn = document.createElement('button');
        btn.id = 'load-more-btn';
        btn.className = 'share-btn';
        btn.style.margin = '0 auto';
        btn.textContent = 'Load More';
        btn.onclick = loadNextPage;
        pagination.appendChild(btn);
    }
}

function showLoadMore() {
    const btn = document.getElementById('load-more-btn');
    if (btn) btn.style.display = 'inline-block';
}

function hideLoadMore() {
    const btn = document.getElementById('load-more-btn');
    if (btn) btn.style.display = 'none';
}
```

2. Fix the `loadQuotes` function: replace `newQuotes` with `quotes` on line 654, and call `createLoadMoreButton()` before `showLoadMore()`. Update the block:
```javascript
// After building the `quotes` array and applying favorites filter:
const filtered = favOnly ? quotes.filter(q => getFavorites().includes(q.id)) : quotes;
displayQuotes(filtered, false);
if (quotes.length >= pageSize) {
    nextOffset = pageSize; // reset offset for new search
    createLoadMoreButton();
    showLoadMore();
} else {
    hideLoadMore();
}
```

3. Update `loadNextPage` to call `displayQuotes(filtered, true)` (append mode).

**Verification:**
```bash
cd webapp && PORT=3000 node server.js
# Open http://localhost:3000 in Android emulator or Chrome mobile devtools
# Quotes should load and paginate
```

### Generate offline bundle for mobile

Add missing script `webapp/generate-bundle.js`:
```javascript
const fs = require('fs');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, '../database/rotus.db'));

const quotes = db.prepare('SELECT * FROM quotes WHERE verification_status = ?', 'verified').all();
const bundlePath = path.join(__dirname, 'public/quotes-bundle.json');
fs.writeFileSync(bundlePath, JSON.stringify(quotes, null, 2));
console.log(`Generated bundle with ${quotes.length} quotes at ${bundlePath}`);
```

Update `package.json`:
```json
{
  "scripts": {
    "build": "node webapp/generate-bundle.js && ..."
  }
}
```

Update `server.js` to serve static files from `webapp/public`:
```javascript
app.use(express.static(path.join(__dirname, 'public')));
```

**Verification:**
```bash
npm run build
curl http://localhost:3000/quotes-bundle.json | jq length
# Should equal number of verified quotes
```

---

## Phase 1: Data Quality Gating

**Goal:** 100% of quotes have valid platform (5 standardized values), category (one of approved), at least one source, and no duplicates.

### 1.1 Normalize platform values

Standardize to these 5 values:
- `Speech`
- `Social Media` (covers Truth Social, X/Twitter, Facebook)
- `Interview`
- `Rally`
- `Press` (covers Press Conference, Statement, Television)

Run migration:
```bash
node -e "
const db = require('better-sqlite3')('database/rotus.db');
const map = {
  'Tweet': 'Social Media', 'Twitter': 'Social Media', 'Truth Social': 'Social Media', 'X': 'Social Media',
  'Press Conference': 'Press', 'Press conference': 'Press', 'Statement': 'Press', 'Television': 'Press',
  'Debate': 'Speech', 'Rally': 'Rally', 'Interview': 'Interview', 'Speech': 'Speech', 'Social Media': 'Social Media', null: 'Speech'
};
const stmt = db.prepare('UPDATE quotes SET platform = ? WHERE id = ?');
db.transaction(() => {
  db.prepare('SELECT id, platform FROM quotes').all().forEach(row => {
    const normalized = map[row.platform] || 'Speech';
    stmt.run(normalized, row.id);
  });
})();
console.log('Platforms normalized');
"
```

Add database constraint:
```sql
ALTER TABLE quotes ADD COLUMN platform_normalized VARCHAR(20);
UPDATE quotes SET platform_normalized = platform;
-- Then rename columns after validation
```

### 1.2 Backfill missing categories

Approved categories: `funny`, `outrageous`, `lie`, `ridiculous`, `unexpected`, `insightful`, `confusing`.

For quotes with NULL category:
- Use AI classification script: `python3 venv/bin/classify-category.py --auto`
- Or manual review via admin interface (build one if needed)

**Verification:**
```bash
node -e "const db=require('better-sqlite3')('database/rotus.db'); const nullCat=db.prepare(\"SELECT COUNT(*) c FROM quotes WHERE category IS NULL OR category=''\").get().c; console.log('NULL category count:',nullCat); if(nullCat>0){process.exit(1)}"
```

### 1.3 Enforce source requirement

All quotes must have at least one associated source (either in `sources` table or `source_url` field).

```bash
node -e "
const db = require('better-sqlite3')('database/rotus.db');
const bad = db.prepare(\"SELECT q.id FROM quotes q LEFT JOIN sources s ON q.id=s.quote_id WHERE s.id IS NULL AND (q.source_url IS NULL OR q.source_url='')\").all();
if(bad.length) {
  console.log('Quotes without sources:', bad.length);
  bad.forEach(q=>console.log('  - ID',q.id));
  process.exit(1);
} else {
  console.log('All quotes have at least one source');
}
"
```

### 1.4 Detect and merge duplicates

Find near-duplicate quotes (same text, similar dates):
```bash
node -e "
const db = require('better-sqlite3')('database/rotus.db');
const rows = db.prepare('SELECT id, quote_text, date_spoken, platform FROM quotes ORDER BY date_spoken').all();
const dupes = [];
for(let i=1;i<rows.length;i++) {
  const a=rows[i-1], b=rows[i];
  if(a.quote_text.toLowerCase().trim() === b.quote_text.toLowerCase().trim()) {
    dupes.push([a.id, b.id, a.quote_text.substring(0,50)]);
  }
}
if(dupes.length) {
  console.log('Potential duplicates:', dupes.length);
  dupes.forEach(d=>console.log('  ',d));
} else {
  console.log('No duplicates found');
}
"
```

Merge manually or with script. Keep the entry with more/better sources.

### 1.5 Geocode locations for map view

Populate `latitude`/`longitude` for quotes with location:
```bash
# Use free Nominatim (OpenStreetMap) API with rate limiting
node scripts/geocode-locations.js
```

**Final data audit:**
```bash
node scripts/audit-data.js
# Should output:
# - Total quotes: >= 100
# - Platform coverage: 100% non-NULL, 100% in ['Speech','Social Media','Interview','Rally','Press']
# - Category coverage: 100% non-NULL, all in approved list
# - Source coverage: 100% have >=1 source
# - Duplicates: 0
# - Geocoded: >=80% for quotes with location field
```

---

## Phase 2: Source Verification & Expansion

**Policy:** New quotes require either:
- Two independent sources from trusted fact‑checkers (FactCheck.org, PolitiFact, Snopes, AP, Reuters), OR
- One primary source + direct media evidence (video/audio from C-SPAN, official transcripts).

### 2.1 Scraper improvements

**Sources to add:**
1. **Truth Social** – Use official RSS or API (requires OAuth). Fallback: manual entry with archive.is links.
2. **X/Twitter** – Use Twitter API v2 (academic access) or `nitter` instances for scraping. Rate limits apply.
3. **Internet Archive** – Scrape `web.archive.org` snapshots of Trump statements (Wayback Machine).
4. **Google Fact Check Tools API** – Query for claims about Trump.

Update `scraper/` scripts:
- Increase limits from 50 → 500 per source
- Add retry logic with exponential backoff
- Normalize `platform` field during scrape
- Require 2+ source URLs before inserting

**Verification:**
```bash
source venv/bin/activate
python3 scraper/trump_quotes_scraper.py --sources truthsocial,x,archive,googlefactcheck --limit 200 --since 2024-01-01 --output new-quotes.json
# Inspect output, check source count per quote
jq '[.[] | select(.sources | length >= 2)] | length' new-quotes.json
```

### 2.2 Manual curation pipeline

For quotes with only one source:
- Admin interface to add second source
- Confidence score should be < 1.0 until 2 sources verified

Build simple admin API (protected by basic auth):
```javascript
// server.js
app.post('/admin/verify/:id', basicAuth, (req,res) => {
  // Add source, increment confidence, set verified
});
```

---

## Phase 3: Comprehensive Testing

### 3.1 Unit tests (existing)

Ensure passing:
```bash
npm test
# Should show: 35 passing tests
```

### 3.2 Integration tests (API)

Add `tests/api.integration.test.js` with Playwright or Supertest:
```javascript
const request = require('supertest');
const app = require('../webapp/server');

describe('API Integration', () => {
  test('GET /api/quotes returns array', async () => {
    const res = await request(app).get('/api/quotes?limit=5');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeLessThanOrEqual(5);
  });

  test('Random quote endpoint returns verified', async () => {
    const res = await request(app).get('/api/quotes/random');
    expect(res.statusCode).toBe(200);
    expect(res.body.verification_status).toBe('verified');
  });
});
```

### 3.3 E2E tests (Playwright)

Install Playwright: `npm i -D @playwright/test`

Add `tests/e2e/quotes.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('loads quotes on homepage', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('.quote-card')).toHaveCount(20);
});

test('pagination works', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('#load-more-btn');
  await expect(page.locator('.quote-card')).toHaveCount(40);
});

test('filter by platform', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.selectOption('#platform-filter', 'Speech');
  const cards = page.locator('.quote-card');
  await expect(cards.first()).toContainText('Speech');
});

test('random quote modal opens', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('#random-quote-btn');
  await expect(page.locator('#quote-modal')).toBeVisible();
});
```

Run: `npx playwright test`

### 3.4 Manual Test Plan

Create `tests/MANUAL_TEST_PLAN.md` with checklist:

**Web (desktop & mobile browsers):**
- [ ] Initial load: stats visible, 20 quotes displayed, no console errors
- [ ] Search: typing + Enter filters results correctly
- [ ] Filters: platform, category, favorites toggle work independently and combined
- [ ] Sorting: each option produces correct order (verify by dates/names)
- [ ] Pagination: “Load More” appears when more quotes exist, appends correctly
- [ ] Quote modal: click card → modal opens with full details, sources linking correctly
- [ ] Random button: opens random verified quote
- [ ] Share & Copy: buttons work, clipboard contains correct text
- [ ] Favorites: heart toggles, persists after page reload, favorites filter works
- [ ] Grid/Timeline toggle: both views render properly

**Mobile (APK/IPA):**
- [ ] Install: app installs without errors
- [ ] Offline first launch: quotes load from bundle (no network required)
- [ ] Refresh: “Refresh Data” button fetches latest bundle from server (if available)
- [ ] Navigation: scrolling smooth, modals close on backdrop tap
- [ ] Performance: first paint < 2s, scroll remains 60fps
- [ ] Battery: no excessive drain after 10min use (estimate)

**Accessibility basics:**
- [ ] All interactive elements reachable via keyboard
- [ ] Contrast ratios meet WCAG AA
- [ ] Screen reader announces quote text and buttons

---

## Phase 4: Mobile App Robustness

### 4.1 Offline bundle generation

- `npm run build` creates `webapp/public/quotes-bundle.json` with latest **verified** quotes
- In `capacitor.config.json`, set `server.url` to local path for offline:
```json
{
  "appId": "com.rotus.app",
  "appName": "ROTUS",
  "webDir": "webapp/public",
  "bundledWebRuntime": false
}
```
- Build web assets: `npm run build` (outputs to `dist/` or `public/`)

### 4.2 Capacitor plugins

Required plugins:
```bash
npm i @capacitor/share @capacitor/local-notifications @capacitor/app
npx cap sync
```

Implement:
- **Share:** Use Capacitor Share plugin for native share sheet (fallback to Web Share API)
- **Local Notifications:** Schedule daily “Quote of the Day” at 9 AM
- **App:** Add “Refresh Data” button that:
  - Fetches `https://your-server.com/quotes-bundle.json`
  - Saves to app’s data directory (`cordova.file.dataDirectory`)
  - Shows success/error toast

### 4.3 Android build fixes

Install prerequisites:
```bash
sudo apt install openjdk-17-jdk
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
source ~/.bashrc
```

Set `minSdkVersion` in `android/app/build.gradle`:
```gradle
defaultConfig {
    minSdkVersion 24
    targetSdkVersion 34
}
```

Build:
```bash
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

Sign for release:
```bash
./gradlew bundleRelease
# AAB: app/build/outputs/bundle/release/app-release.aab
```

### 4.4 iOS build (requires macOS)

Use cloud CI (Codemagic, GitHub Actions macOS runner):
```yaml
# .github/workflows/ios.yml
jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build iOS
        run: |
          npm ci
          npm run build
          npx cap sync ios
          npx cap open ios
          # Then archive via Xcode or xcodebuild
```

---

## Phase 5: Security & Performance

### 5.1 Security hardening

`server.js`:
- Already has `helmet()` and `compression()`. Add rate limiting:
```javascript
const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({ windowMs: 15*60*1000, max: 100 });
app.use('/api/', apiLimiter);
```
- Validate all inputs (add Joi or express-validator)
- Ensure parameterized queries are used (already done)
- Remove `'unsafe-inline'` from CSP by using nonces:
```javascript
const nonce = require('crypto').randomBytes(16).toString('hex');
app.use((req,res,next) => { res.locals.nonce = nonce; next(); });
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req,res)=>`'nonce-${res.locals.nonce}'`],
      styleSrc: ["'self'", "'unsafe-inline'"] // keep until CSS refactored
    }
  }
}));
```
- Audit for XSS: All user‑generated content must be escaped (`escapeHtml` function exists but verify all uses)

### 5.2 Performance benchmarks

- API response time: `p99 < 100ms` for `/api/quotes` with limit=20
- First contentful paint: `< 2s` on 3G (use Lighthouse)
- Bundle size: `< 500KB` gzipped

Run Lighthouse:
```bash
npm i -g lighthouse
lighthouse http://localhost:3000 --view --output-path=./lighthouse.html
```

Optimization tips:
- Add `Cache-Control: public, max-age=3600` for static assets
- Enable gzip (already with `compression()`)
- Paginate all list endpoints (already implemented)
- Add database indexes: already present in schema

---

## Phase 6: Deployment Gating & Rollout

### 6.1 Final Release Checklist

**All gates must be SIGNED OFF:**

| Gate | Criteria | Owner | Status |
|------|----------|-------|--------|
| ✅ Unit Tests | `npm test` passes (35+) | Dev | |
| ✅ Integration Tests | Supertest coverage >80% | Dev | |
| ✅ E2E Tests | Playwright tests pass on CI | QA | |
| ✅ Manual QA | All checklist items verified | QA lead | |
| ✅ Data Audit | 0 NULL platform/category, 0 duplicates, 100% have sources | Data team | |
| ✅ Performance | API p99 <100ms, FCP <2s, bundle <500KB | DevOps | |
| ✅ Security | No high/critical vulnerabilities in npm audit, CSP valid | Security | |
| ✅ Mobile Build | APK installs and functions, offline works | Mobile dev | |
| ✅ iOS Build | IPA passes TestFlight validation | iOS dev | |
| ✅ Device Testing | Tested on ≥3 Android models + iOS if available | QA | |
| ✅ Backup Plan | Database backup script tested, rollback documented | DevOps | |

**Sign-off required:** Lead Dev, QA Lead, Product Owner.

### 6.2 Staged Rollout

1. **Web soft launch** – open to internal team, gather feedback
2. **Android open beta** – Google Play internal testing (10% rollout)
3. **iOS TestFlight** – up to 100 testers
4. **Public release** – after 1 week of beta with <5 critical issues

### 6.3 Monitoring

- Add error reporting (Sentry or similar)
- Add analytics (Plausible, no personal data)
- Health check endpoint: `/health` (exists)

---

## 📅 Timeline Estimates

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Stage 0 – Bug fix | 0.5 day | None |
| Phase 1 – Data cleanup | 2–3 days | Bug fix, database access |
| Phase 2 – Source expansion | 3–5 days | Scraper access, API keys |
| Phase 3 – Testing | 2–3 days | Test framework setup |
| Phase 4 – Mobile robustness | 1–2 days | Build tools installed |
| Phase 5 – Security/Perf | 1–2 days | Server access |
| Phase 6 – Release prep | 0.5 day | All previous |
| **Total** | **10–15 days** | |

---

## ⚠️ Risk Notes

- **Scraper API limits** – X/Twitter API may require paid tier; have manual entry fallback
- **Geocoding rate limits** – batch geocoding with cache to avoid daily quota exceeded
- **iOS build without Mac** – must use cloud CI; budget for Codemagic or similar
- **Data volume** – 100+ quotes with sources is minimum; consider target 200+ for launch
- **Legal review** – parody app may need DMCA counsel; ensure fair use disclaimer prominent

---

**Last Updated:** 2026‑04‑28  
**Maintainer:** Adrian  
**OpenCode Model Pref:** Use cloud AI (OpenAI GPT‑4o, Claude 3.5 Sonnet) for complex refactoring.
