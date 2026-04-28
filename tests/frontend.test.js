const fs = require('fs');
const path = require('path');

describe('Frontend Tests', () => {
  test('index.html should exist', () => {
    const indexPath = path.join(__dirname, '../webapp/index.html');
    expect(fs.existsSync(indexPath)).toBeTruthy();
  });

  test('index.html should contain share buttons', () => {
    const content = fs.readFileSync(path.join(__dirname, '../webapp/index.html'), 'utf-8');
    expect(content).toContain('shareQuote');
    expect(content).toContain('copyQuote');
  });

  test('index.html should contain favorite functionality', () => {
    const content = fs.readFileSync(path.join(__dirname, '../webapp/index.html'), 'utf-8');
    expect(content).toContain('toggleFavorite');
    expect(content).toContain('getFavorites');
  });

  test('index.html should contain timeline view', () => {
    const content = fs.readFileSync(path.join(__dirname, '../webapp/index.html'), 'utf-8');
    expect(content).toContain('timeline-mode');
    expect(content).toContain('view-timeline-btn');
  });

  test('server.js should have Helmet security', () => {
    const content = fs.readFileSync(path.join(__dirname, '../webapp/server.js'), 'utf-8');
    expect(content).toContain('helmet');
  });

  test('server.js should have PUT endpoint', () => {
    const content = fs.readFileSync(path.join(__dirname, '../webapp/server.js'), 'utf-8');
    expect(content).toContain("app.put('/api/quotes/:id'");
  });

  test('server.js should have DELETE endpoint', () => {
    const content = fs.readFileSync(path.join(__dirname, '../webapp/server.js'), 'utf-8');
    expect(content).toContain("app.delete('/api/quotes/:id'");
  });

  test('Dockerfile should exist', () => {
    const dockerfilePath = path.join(__dirname, '../Dockerfile');
    expect(fs.existsSync(dockerfilePath)).toBeTruthy();
  });

  test('docker-compose.yml should exist', () => {
    const composePath = path.join(__dirname, '../docker-compose.yml');
    expect(fs.existsSync(composePath)).toBeTruthy();
  });

  test('.env.example should exist', () => {
    const envPath = path.join(__dirname, '../.env.example');
    expect(fs.existsSync(envPath)).toBeTruthy();
  });

  test('Deployment docs should exist', () => {
    const docsPath = path.join(__dirname, '../docs/DEPLOYMENT.md');
    expect(fs.existsSync(docsPath)).toBeTruthy();
  });

  test('GitHub Actions workflows should exist', () => {
    const iosWorkflow = path.join(__dirname, '../.github/workflows/build-ios.yml');
    const androidWorkflow = path.join(__dirname, '../.github/workflows/build-android.yml');
    expect(fs.existsSync(iosWorkflow)).toBeTruthy();
    expect(fs.existsSync(androidWorkflow)).toBeTruthy();
  });
});
