# ROTUS Architecture

**Integrated patterns and tools** from OpenCode ecosystem and Coolstuff resources.

## Project Overview

ROTUS (The Rotten Brain of POTUS) is a full-stack web/mobile application for browsing verified Trump quotes with:
- **Backend**: SQLite + Express API
- **Frontend**: Vanilla HTML/CSS/JS responsive web app
- **Mobile**: Capacitor-based Android/iOS app with offline support
- **Data pipeline**: Scrapers + manual curation → verified quotes database
- **Knowledge Graph**: Graphify-generated entity relationship visualization

---

## Integrated Patterns from Coolstuff

### 1. Code Review Agents (repomix)

**Source**: `repomix-main/.agents/agents/`

- **reviewer-code-quality.md**: Static analysis for bugs, edge cases, type safety
- **reviewer-holistic.md**: System impact and architectural fit review

**ROTUS Application**:
- Integrate as pre-commit hooks or CI checks
- Run before each push to catch regressions
- Holistic review before major feature merges

**Implementation**:
```bash
# Example: Run code quality review
npx repomix --output analysis.json
# Review changes against quality gates
```

---

### 2. Maestro E2E Testing (off-grid-mobile-ai)

**Source**: `off-grid-mobile-ai-main/.maestro/`

- E2E test framework for mobile apps
- P0/P1/P2 priority classification
- YAML-based test flows with element IDs

**ROTUS Application**:
- Automate mobile APK testing
- Critical flows: loading quotes, search, random, favorites, pagination
- CI integration with GitHub Actions

**Structure**:
```
maestro/
├── config.yaml
├── flows/
│   ├── p0/00-quotes-load.yaml
│   ├── p0/01-random-quote.yaml
│   ├── p1/02-search-filter.yaml
│   └── p2/03-theme-toggle.yaml
└── E2E_TESTING.md
```

---

### 3. SPARC Planning (ruflo)

**Source**: `ruflo-main/.agents/skills/agent-code-goal-planner/`

- SPARC: Specification, Pseudocode, Architecture, Refinement, Completion
- GOAP: Goal-Oriented Action Planning with state transitions
- Metrics-driven success criteria

**ROTUS Application**:
- Complex feature planning (e.g., scraper expansion, offline sync)
- Break down phases 1–6 from AGENTS.md into actionable tasks
- Track preconditions, deliverables, risks

**Usage**: Follow SPARC template in feature design documents.

---

### 4. Plugin Bootstrap (superpowers)

**Source**: `superpowers-main/.opencode/plugins/`

- Auto-discovery of skills directory
- Bootstrap context injection
- Tool mapping between frameworks

**ROTUS Application**:
- Extensibility architecture: allow adding custom skills
- Inject project-specific context into AI responses
- Plugin manifest for distribution

**Integration**: Place plugins in `.opencode/plugins/` and they auto-load.

---

### 5. Workflow Patterns (claude-code-best-practice)

**Source**: `claude-code-best-practice/`

- Command → Agent → Skill orchestration
- Research → Plan → Execute → Review → Ship
- Subagent isolation and skill preloading

**ROTUS Adaptation**:
- Use pattern for multi-step tasks (e.g., "audit then fix")
- Subagents for specialized domains (scraping, UI, DB)
- Skills for reusable knowledge snippets

**Note**: These patterns are framework agnostic; implement in OpenCode workflows.

---

## Testing Architecture

### Unit & Integration
- Existing `npm test` suite (verify all pass)
- API tests with Supertest

### E2E Mobile (Maestro)
- **P0 (Critical)**: App launches, quotes load, random works, navigation
- **P1 (Important)**: Search, filters, favorites, pagination
- **P2 (Nice-to-have)**: Theme switch, share sheet, deep links

### Quality Gates
- All tests must pass before release
- Manual QA checklist in AGENTS.md
- Data audit (no NULL platforms/categories, 100% sources)

---

## Memory & Context

ROTUS uses multiple layers for knowledge persistence:

| Layer | Purpose | Examples |
|-------|---------|----------|
| **AGENTS.md** | Project strategy & phases | This document's sibling |
| **mempalace.yaml** | OpenCode room organization | Quotes, webapp, scraper, etc. |
| **graphify skill** | Knowledge graph generation | Entity relationships, queries |
| **CLAUDE.md** | Optional: AI context memory | Project conventions |
| **.opencode/** | Plugin & configuration | Extension points |

---

## Knowledge Graph (QuotesWeb)

**Backend route**: `GET /graph` → serves `graphify-out/graph.html`

**Frontend naming**: "QuotesWeb" (friendly end-user name)

**Visibility**: Do not display link on frontend unless absolutely necessary. If a link is added, use the name "QuotesWeb".

**Generation**: Run Graphify Python pipeline to produce:
- `graph.json` – nodes & edges data
- `graph.html` – interactive visualization
- `extraction.json` – raw knowledge extraction

---

## Development Workflow

1. **Plan**: Use SPARC for complex features; consult AGENTS.md for phase goals
2. **Code**: Implement with project conventions (CSS vars, error handling)
3. **Review**: Run code quality agent + holistic review
4. **Test**: Unit → Integration → Maestro E2E
5. **Ship**: Merge after QA sign-off, then deploy

---

## Future Roadmap

Extracted from `AGENTS.md`:

| Phase | Goal | Timeline |
|-------|------|----------|
| 0 | Mobile bug fixes | 0.5 day |
| 1 | Data cleanup (130→500 quotes) | 2–3 days |
| 2 | Source expansion (8 scrapers) | 3–5 days |
| 3 | Comprehensive testing | 2–3 days |
| 4 | Mobile robustness | 1–2 days |
| 5 | Security & performance | 1–2 days |
| 6 | Release preparation | 0.5 day |

---

## References

- `AGENTS.md` – detailed quality strategy and phase plans
- `mempalace.yaml` – OpenCode memory room definitions
- `webapp/server.js` – Express API routes
- `generate-bundle.js` – Offline bundle generation
- Coolstuff archives: `repomix`, `off-grid-mobile-ai`, `ruflo`, `superpowers`
