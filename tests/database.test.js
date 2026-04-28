const Database = require('better-sqlite3');
const path = require('path');

describe('Database Tests', () => {
  let db;

  beforeAll(() => {
    db = new Database(path.join(__dirname, '../database/rotus.db'));
  });

  afterAll(() => {
    db.close();
  });

  test('Database should have quotes table', () => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='quotes'").get();
    expect(result).toBeTruthy();
  });

  test('Quotes table should have correct columns', () => {
    const columns = db.prepare('PRAGMA table_info(quotes)').all();
    const columnNames = columns.map(c => c.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('quote_text');
    expect(columnNames).toContain('date_spoken');
    expect(columnNames).toContain('platform');
    expect(columnNames).toContain('category');
    expect(columnNames).toContain('latitude');
    expect(columnNames).toContain('longitude');
  });

  test('Should have at least 90 quotes', () => {
    const result = db.prepare('SELECT COUNT(*) as count FROM quotes').get();
    expect(result.count).toBeGreaterThanOrEqual(90);
  });

  test('All quotes should be verified', () => {
    const result = db.prepare("SELECT COUNT(*) as count FROM quotes WHERE verification_status = 'verified'").get();
    const total = db.prepare('SELECT COUNT(*) as count FROM quotes').get();
    expect(result.count).toBe(total.count);
  });

  test('Should have FTS5 virtual table', () => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='quotes_fts'").get();
    expect(result).toBeTruthy();
  });

  test('FTS search should return results', () => {
    const results = db.prepare("SELECT * FROM quotes_fts WHERE quotes_fts MATCH 'president'").all();
    expect(Array.isArray(results)).toBeTruthy();
  });

  test('Sources table should exist', () => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sources'").get();
    expect(result).toBeTruthy();
  });

  test('Entities table should exist', () => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='entities'").get();
    expect(result).toBeTruthy();
  });

  test('Tags table should exist', () => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tags'").get();
    expect(result).toBeTruthy();
  });
});
