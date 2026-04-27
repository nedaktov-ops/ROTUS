---
tags: ["dashboard", "MOC", "ROTUS"]
creation_date: 2026-04-27
---

# ROTUS Dashboard - The Rotten Brain of POTUS

## 📊 Stats

```dataview
TABLE WITHOUT ID
length(rows) as "Count"
FROM "Quotes"
FLATTEN category as cat
GROUP BY cat
```

## 🔥 Recent Quotes

```dataview
TABLE without id
quote_text as "Quote", date as "Date", platform as "Platform", category as "Category"
FROM "Quotes"
SORT date DESC
LIMIT 10
```

## 🏷️ By Category

- [[Funny Quotes]]
- [[Outrageous Quotes]]
- [[Lies]]
- [[Ridiculous Quotes]]
- [[Unexpected Quotes]]

## 🔍 By Platform

- [[Truth Social Posts]]
- [[X Posts]]
- [[Interviews]]
- [[Speeches]]
- [[Rallies]]

## 📚 Sources

```dataview
TABLE without id
source_name as "Source", length(rows) as "Quote Count"
FROM "Quotes"
WHERE source_name
GROUP BY source_name
SORT length(rows) DESC
```

## 🧠 Knowledge Graph

Run the following to generate the knowledge graph:

```bash
cd /home/adrian/Desktop/NEDAILAB/ROTUS
source venv/bin/activate
/graphify obsidian-vault/ --obsidian
```

This will create:
- `graphify-out/graph.html` - Interactive graph visualization
- `graphify-out/GRAPH_REPORT.md` - Audit report
- `graphify-out/obsidian/` - Obsidian notes with graph connections

## 🤖 AI Memory (MemPalace)

MemPalace is initialized for this project. Search your project memory:

```bash
source venv/bin/activate
mempalace search "Trump quotes"
```

## 📰 Add New Quotes

1. Find verified quotes from:
   - [FactCheck.org](https://www.factcheck.org/person/donald-trump/)
   - [PolitiFact](https://www.politifact.com/factchecks/list/?speaker=donald-trump)
   - [Snopes](https://www.snopes.com/fact-check/?s=trump)

2. Add to database:
   ```bash
   cd webapp
   node add-sample-quotes.js  # Edit this file to add more
   ```

3. Create Obsidian note in `Quotes/` folder

## 📱 Mobile App

The mobile app is set up with Capacitor:

```bash
npm run cap:sync
npm run cap:open:android  # Opens Android Studio
npm run cap:open:ios      # Opens Xcode
```

---

**Last Updated:** {{date:YYYY-MM-DD}}
