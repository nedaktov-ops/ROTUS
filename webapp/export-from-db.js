// Export quotes from SQLite to Obsidian markdown notes

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const db = new Database(path.join(__dirname, '../database/rotus.db'));

const quotes = db.prepare('SELECT * FROM quotes ORDER BY date_spoken DESC').all();

console.log(`Exporting ${quotes.length} quotes to Obsidian vault...`);

// Create Quotes directory if not exists (in Obsidian vault)
const quotesDir = path.join(__dirname, '../obsidian-vault/Quotes');
if (!fs.existsSync(quotesDir)) {
    fs.mkdirSync(quotesDir, { recursive: true });
}

// Export each quote
quotes.forEach(quote => {
    const filename = `Quote-${String(quote.id).padStart(3, '0')}-${quote.category || 'general'}.md`;
    const filepath = path.join(quotesDir, filename);

    // Fetch all sources for this quote
    const sources = db.prepare('SELECT * FROM sources WHERE quote_id = ?').all(quote.id);

    // Build sources markdown list
    let sourcesMarkdown = '';
    if (sources.length > 0) {
        sourcesMarkdown = '## Sources\n\n';
        sources.forEach((src, idx) => {
            const title = src.title || src.source_name || 'Source';
            const url = src.url || '#';
            const verifiedBy = src.verified_by ? ` - Verified by ${src.verified_by}` : '';
            sourcesMarkdown += `${idx+1}. [${title}](${url})${verifiedBy}\n`;
        });
    } else {
        // Fallback to single source fields (legacy)
        sourcesMarkdown = `## Sources\n\n1. ${quote.source_name || 'Source'}${quote.source_url ? ` - [${quote.source_url}](${quote.source_url})` : ''}\n`;
    }

     // Fetch entities for this quote (if any)
    const entities = db.prepare('SELECT * FROM entities WHERE quote_id = ?').all(quote.id);
    let entitiesMarkdown = '';
    if (entities.length > 0) {
        entitiesMarkdown = '## Entities\n\n';
        entities.forEach(entity => {
            const entityLink = `[[${entity.entity_name}]]`;
            const entityType = entity.entity_type || 'unknown';
            entitiesMarkdown += `- ${entityLink} (${entityType})\n`;
        });
    }

    // Fetch tags for this quote (if any)
    const tagsRows = db.prepare('SELECT tag FROM tags WHERE quote_id = ?').all(quote.id);
    const tagList = tagsRows.map(r => r.tag);
    let tagsYaml = '';
    if (tagList.length > 0) {
        tagsYaml = tagList.map(t => `  - ${t}`).join('\n');
    } else {
        tagsYaml = `  - ${quote.category || 'general'}\n  - trump\n  - quote`;
    }

    const content = `---
id: ${quote.id}
date: ${quote.date_spoken || ''}
time: "${quote.time_spoken || ''}"
location: "${quote.location || ''}"
platform: "${quote.platform || ''}"
context: "${quote.context || ''}"
source_url: "${quote.source_url || ''}"
source_name: "${quote.source_name || ''}"
verification_status: "${quote.verification_status || 'pending'}"
confidence_score: ${quote.confidence_score || 0}
category: "${quote.category || ''}"
tags:
${tagsYaml}
---

# "${quote.quote_text}"

**Date:** ${quote.date_spoken || 'Unknown'}  
**Location:** ${quote.location || 'Unknown'}  
**Platform:** ${quote.platform || 'Unknown'}  
**Context:** ${quote.context || 'No context provided'}

## Full Quote

> "${quote.quote_text}"

## Verification

- ${quote.verification_status === 'verified' ? '✅ **Verified**' : '⏳ **Pending**'} by ${quote.source_name || 'Unknown source'}
 - **Confidence:** ${(quote.confidence_score * 100).toFixed(0)}%

 ${sourcesMarkdown}${entitiesMarkdown}## Related People

- [[Donald-Trump]]

## Topics

- #${quote.category || 'general'}-quotes
- #trump-quotes
`;

    fs.writeFileSync(filepath, content);
    console.log(`Created: ${filename}`);
});

console.log('\nExport complete!');
db.close();
