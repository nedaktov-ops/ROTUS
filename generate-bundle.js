const fs = require('fs');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, 'database/rotus.db'));

// Ensure the output directory exists
const bundleDir = path.join(__dirname, 'webapp/public');
if (!fs.existsSync(bundleDir)) {
    fs.mkdirSync(bundleDir, { recursive: true });
}

// Export all verified quotes
const quotes = db.prepare('SELECT * FROM quotes WHERE verification_status = ?').all('verified');
const bundlePath = path.join(bundleDir, 'quotes-bundle.json');
fs.writeFileSync(bundlePath, JSON.stringify(quotes, null, 2));
console.log(`Generated bundle with ${quotes.length} verified quotes at ${bundlePath}`);

// Also copy to Android assets directory for mobile builds
const androidAssets = path.join(__dirname, 'android/app/src/main/assets/public');
if (fs.existsSync(androidAssets)) {
    fs.copyFileSync(bundlePath, path.join(androidAssets, 'quotes-bundle.json'));
    console.log(`Copied bundle to Android assets: ${androidAssets}`);
} else {
    console.warn(`Android assets directory not found: ${androidAssets}. Run npx cap sync android after building.`);
}
