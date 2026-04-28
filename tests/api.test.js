const supertest = require('supertest');
const path = require('path');

// Load server module
let app;
beforeAll(() => {
  app = supertest(require(path.join(__dirname, '../webapp/server.js')));
});

describe('ROTUS API Tests', () => {
  test('Health check should return 200', async () => {
    const res = await app.get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  test('Stats should return valid data', async () => {
    const res = await app.get('/api/stats');
    expect(res.status).toBe(200);
    expect(typeof res.body.total).toBe('number');
    expect(typeof res.body.verified).toBe('number');
    expect(typeof res.body.sources).toBe('number');
  });

  test('Get quotes should return an array', async () => {
    const res = await app.get('/api/quotes?limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('Get random quote should return a quote', async () => {
    const res = await app.get('/api/quotes/random');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('quote_text');
  });

  test('Get single quote should return a quote', async () => {
    const res = await app.get('/api/quotes/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body).toHaveProperty('quote_text');
  });

  test('Get sources for quote', async () => {
    const res = await app.get('/api/quotes/1/sources');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('Get entities for quote', async () => {
    const res = await app.get('/api/quotes/1/entities');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('Get tags for quote', async () => {
    const res = await app.get('/api/quotes/1/tags');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('Get all tags', async () => {
    const res = await app.get('/api/tags');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('Search quotes by keyword', async () => {
    const res = await app.get('/api/quotes?q=president&limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('Filter quotes by category', async () => {
    const res = await app.get('/api/quotes?category=funny&limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('404 for non-existent quote', async () => {
    const res = await app.get('/api/quotes/99999');
    expect(res.status).toBe(404);
  });

  test('Update quote (PUT)', async () => {
    const res = await app
      .put('/api/quotes/1')
      .send({ category: 'funny' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  test('Delete and recreate quote (DELETE + POST)', async () => {
    // Create a test quote
    const postRes = await app
      .post('/api/quotes')
      .send({
        quote_text: 'Test quote for deletion',
        date_spoken: '2026-04-28',
        platform: 'Test',
        category: 'funny',
        verification_status: 'verified',
      });
    expect(postRes.status).toBe(201);
    const newId = postRes.body.id;

    // Delete the quote
    const delRes = await app.delete(`/api/quotes/${newId}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body).toHaveProperty('success', true);
  });
});
