// Enhance the webapp with better UI

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const morgan = require('morgan');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize database
const db = new Database(path.join(__dirname, '../database/rotus.db'));

// Health check
app.get('/health', (req, res) => {
    try {
        // Quick DB check
        db.prepare('SELECT 1').get();
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// API Routes
app.get('/api/stats', (req, res) => {
    try {
        const total = db.prepare('SELECT COUNT(*) as count FROM quotes').get();
        const verified = db.prepare("SELECT COUNT(*) as count FROM quotes WHERE verification_status = 'verified'").get();
        const sources = db.prepare('SELECT COUNT(DISTINCT source_name) as count FROM quotes WHERE source_name IS NOT NULL').get();
        const byCategory = db.prepare('SELECT category, COUNT(*) as count FROM quotes GROUP BY category').all();
        
        res.json({
            total: total.count,
            verified: verified.count,
            sources: sources.count,
            byCategory: byCategory
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/quotes', (req, res) => {
    try {
        const { q, platform, category, limit, offset } = req.query;
        let query = 'SELECT quotes.* FROM quotes';
        const params = [];

        if (q) {
            query += ' JOIN quotes_fts ON quotes.id = quotes_fts.rowid WHERE quotes_fts MATCH ?';
            params.push(q);
        } else {
            query += ' WHERE 1=1';
        }

        if (platform) {
            query += ' AND platform = ?';
            params.push(platform);
        }
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        // Determine sorting
        const sortMap = {
            date: 'date_spoken',
            category: 'category',
            platform: 'platform',
            id: 'id'
        };
        let sort = req.query.sort || 'date';
        let order = req.query.order || (sort === 'date' ? 'desc' : 'asc');
        if (!Object.keys(sortMap).includes(sort)) sort = 'date';
        if (!['asc', 'desc'].includes(order)) order = 'asc';
        const sortColumn = sortMap[sort];
        query += ` ORDER BY ${sortColumn} ${order}`;

        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
            if (offset) {
                query += ' OFFSET ?';
                params.push(parseInt(offset));
            }
        } else if (offset) {
            // OFFSET requires LIMIT; if no limit, set a very high limit
            query += ' LIMIT 18446744073709551615 OFFSET ?';
            params.push(parseInt(offset));
        }

        const quotes = db.prepare(query).all(...params);
        res.json(quotes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/quotes/random', (req, res) => {
    try {
        const quote = db.prepare("SELECT * FROM quotes WHERE verification_status = 'verified' ORDER BY RANDOM() LIMIT 1").get();
        if (!quote) return res.status(404).json({ error: 'No verified quotes found' });
        
        const sources = db.prepare('SELECT * FROM sources WHERE quote_id = ?').all(quote.id);
        quote.sources = sources;
        res.json(quote);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/quotes/:id', (req, res) => {
    try {
        const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
        if (!quote) return res.status(404).json({ error: 'Quote not found' });
        
        const sources = db.prepare('SELECT * FROM sources WHERE quote_id = ?').all(quote.id);
        quote.sources = sources;
        res.json(quote);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/quotes', (req, res) => {
    try {
        const {
            quote_text,
            date_spoken,
            platform,
            context,
            source_url,
            source_name,
            category,
            sources = [],
            entities = [],
            tags = []
        } = req.body;

        // Insert quote (set verified by default)
        const stmt = db.prepare(`
            INSERT INTO quotes (quote_text, date_spoken, platform, context, source_url, source_name, category, verification_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'verified')
        `);
        const result = stmt.run(quote_text, date_spoken, platform, context, source_url, source_name, category);
        const quoteId = result.lastInsertRowid;

        // Insert sources: if array not provided, fall back to single source_url/source_name
        const sourcesToInsert = sources.length > 0 ? sources : (source_url ? [{ url: source_url, title: source_name, source_type: 'factcheck' }] : []);
        if (sourcesToInsert.length) {
            const srcStmt = db.prepare('INSERT INTO sources (quote_id, source_type, url, title, publication_date, verified_by) VALUES (?, ?, ?, ?, ?, ?)');
            for (const src of sourcesToInsert) {
                srcStmt.run(quoteId, src.source_type || 'web', src.url, src.title || '', src.publication_date || null, src.verified_by || null);
            }
        }

        // Insert entities
        if (entities.length) {
            const entStmt = db.prepare('INSERT INTO entities (quote_id, entity_name, entity_type) VALUES (?, ?, ?)');
            for (const ent of entities) {
                entStmt.run(quoteId, ent.name, ent.type || 'person');
            }
        }

        // Insert tags
        if (tags.length) {
            const tagStmt = db.prepare('INSERT INTO tags (quote_id, tag) VALUES (?, ?)');
            for (const tag of tags) {
                tagStmt.run(quoteId, tag);
            }
        }

        res.status(201).json({ id: quoteId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get sources for a quote
app.get('/api/quotes/:id/sources', (req, res) => {
    try {
        const sources = db.prepare('SELECT * FROM sources WHERE quote_id = ?').all(req.params.id);
        res.json(sources);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get entities for a quote
app.get('/api/quotes/:id/entities', (req, res) => {
    try {
        const entities = db.prepare('SELECT * FROM entities WHERE quote_id = ?').all(req.params.id);
        res.json(entities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get tags for a quote
app.get('/api/quotes/:id/tags', (req, res) => {
    try {
        const tags = db.prepare('SELECT * FROM tags WHERE quote_id = ?').all(req.params.id);
        res.json(tags);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all tags with counts
app.get('/api/tags', (req, res) => {
    try {
        const tags = db.prepare('SELECT tag, COUNT(*) as count FROM tags GROUP BY tag ORDER BY count DESC').all();
        res.json(tags);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve knowledge graph visualization
app.get('/graph', (req, res) => {
    const graphPath = path.join(__dirname, '../graphify-out/graph.html');
    if (fs.existsSync(graphPath)) {
        res.sendFile(graphPath);
    } else {
        res.status(404).send('Graph not generated. Run ./run-graphify.sh first.');
    }
});

app.listen(PORT, () => {
    console.log(`ROTUS server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => { db.close(); process.exit(0); });
