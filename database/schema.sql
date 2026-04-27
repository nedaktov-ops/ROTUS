-- ROTUS Database Schema - The Rotten Brain of POTUS
-- Verified quotes collection with full source attribution

CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_text TEXT NOT NULL,
    date_spoken DATE,
    time_spoken TIME,
    location VARCHAR(255),
    platform VARCHAR(50), -- 'Truth Social', 'X', 'Interview', 'Speech', 'Rally', etc.
    context TEXT, -- Backdrop of when/why he said it
    source_url TEXT, -- Direct link to source
    source_name VARCHAR(100), -- FactCheck.org, PolitiFact, Snopes, etc.
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'verified', 'pending', 'disputed'
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    category VARCHAR(50), -- 'funny', 'outrageous', 'lie', 'ridiculous', 'unexpected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER,
    source_type VARCHAR(50), -- 'factcheck', 'politifact', 'snopes', 'transcript', 'video'
    url TEXT NOT NULL,
    title VARCHAR(500),
    publication_date DATE,
    verified_by VARCHAR(100),
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER,
    entity_name VARCHAR(255),
    entity_type VARCHAR(50), -- 'person', 'place', 'organization', 'event'
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER,
    tag VARCHAR(50),
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_date ON quotes(date_spoken);
CREATE INDEX IF NOT EXISTS idx_quotes_platform ON quotes(platform);
CREATE INDEX IF NOT EXISTS idx_quotes_category ON quotes(category);
CREATE INDEX IF NOT EXISTS idx_quotes_verification ON quotes(verification_status);

-- Full-text search virtual table
CREATE VIRTUAL TABLE IF NOT EXISTS quotes_fts USING fts5(
    quote_text,
    context,
    content='quotes',
    content_rowid='id'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS quotes_ai AFTER INSERT ON quotes BEGIN
    INSERT INTO quotes_fts(rowid, quote_text, context) VALUES (new.id, new.quote_text, new.context);
END;

CREATE TRIGGER IF NOT EXISTS quotes_au AFTER UPDATE ON quotes BEGIN
    INSERT INTO quotes_fts(quotes_fts, rowid, quote_text, context) VALUES ('delete', old.id, old.quote_text, old.context);
    INSERT INTO quotes_fts(rowid, quote_text, context) VALUES (new.id, new.quote_text, new.context);
END;

CREATE TRIGGER IF NOT EXISTS quotes_ad AFTER DELETE ON quotes BEGIN
    INSERT INTO quotes_fts(quotes_fts, rowid, quote_text, context) VALUES ('delete', old.id, old.quote_text, old.context);
END;
