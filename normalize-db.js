const db = require('better-sqlite3')('database/rotus.db');
const { argv } = require('process');

// Try to enable WAL mode for better performance
try {
  db.pragma('journal_mode = WAL');
} catch (e) {
  console.warn('Could not enable WAL mode:', e.message);
}

// Start transaction
const transaction = db.transaction(() => {
  console.log('=== Normalizing platform values ===');

  // Define mapping rules with case-insensitive matching
  // We'll normalize by converting to lowercase for comparison, but store proper case
  const platformUpdates = [
    // Preserve Interview as-is
    { from: 'interview', to: 'Interview' },
    // Preserve Speech as-is
    { from: 'speech', to: 'Speech' },
    // Debate -> Speech
    { from: 'debate', to: 'Speech' },
    // Rally -> Rally
    { from: 'rally', to: 'Rally' },
    // Social Media variants -> Social Media
    { from: 'social media', to: 'Social Media' },
    { from: 'socialmedia', to: 'Social Media' },
    // Twitter/X -> Social Media
    { from: 'twitter', to: 'Social Media' },
    { from: 'x', to: 'Social Media' },
    { from: 'truth social', to: 'Social Media' },
    // Press variants -> Press
    { from: 'press conference', to: 'Press' },
    { from: 'press conference', to: 'Press' },
    { from: 'press', to: 'Press' },
    { from: 'statement', to: 'Press' },
    { from: 'television', to: 'Press' },
    { from: 'tv', to: 'Press' },
    // All others -> Speech
  ];

  // Get all distinct platforms first to understand what we have
  const distinctPlatforms = db.prepare('SELECT DISTINCT platform FROM quotes').all();
  console.log('Current platforms:', distinctPlatforms.map(p => p.platform));

  // Process each quote
  const stmt = db.prepare('UPDATE quotes SET platform = ? WHERE LOWER(TRIM(platform)) = ?');
  let updateCount = 0;

  distinctPlatforms.forEach(row => {
    const original = row.platform;
    if (!original) {
      // NULL platform - will handle later
      return;
    }

    const normalized = normalizePlatform(original);
    if (normalized !== original) {
      stmt.run(normalized, original.toLowerCase().trim());
      updateCount += db.changes;
    }
  });

  console.log(`Updated ${updateCount} rows for platform normalization`);

  // Set NULL platforms to 'Speech'
  const nullPlatformStmt = db.prepare("UPDATE quotes SET platform = 'Speech' WHERE platform IS NULL OR TRIM(platform) = ''");
  const nullPlatformCount = nullPlatformStmt.run();
  console.log(`Set ${nullPlatformCount.changes} NULL/empty platforms to 'Speech'`);

  console.log('\n=== Normalizing category values ===');

  // Set NULL/empty categories to 'unexpected'
  const nullCategoryStmt = db.prepare("UPDATE quotes SET category = 'unexpected' WHERE category IS NULL OR TRIM(category) = ''");
  const nullCategoryCount = nullCategoryStmt.run();
  console.log(`Set ${nullCategoryCount.changes} NULL/empty categories to 'unexpected'`);

  // Add indexes if they don't exist
  console.log('\n=== Creating indexes ===');
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_quotes_platform ON quotes(platform)`);
    console.log('Created index on platform');
  } catch (e) {
    console.warn('Index may already exist:', e.message);
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_quotes_category ON quotes(category)`);
    console.log('Created index on category');
  } catch (e) {
    console.warn('Index may already exist:', e.message);
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_quotes_verification_status ON quotes(verification_status)`);
    console.log('Created index on verification_status');
  } catch (e) {
    console.warn('Index may already exist:', e.message);
  }

  // Verification queries
  console.log('\n=== Verification ===');

  // Count distinct platforms
  const distinctAfter = db.prepare('SELECT DISTINCT platform FROM quotes WHERE platform IS NOT NULL ORDER BY platform').all();
  console.log('Distinct platforms after normalization:', distinctAfter.map(p => p.platform));
  console.log(`Total distinct non-NULL platforms: ${distinctAfter.length}`);

  // Check for any remaining NULLs
  const nullPlatformCheck = db.prepare("SELECT COUNT(*) as count FROM quotes WHERE platform IS NULL OR TRIM(platform) = ''").get();
  const nullCategoryCheck = db.prepare("SELECT COUNT(*) as count FROM quotes WHERE category IS NULL OR TRIM(category) = ''").get();

  console.log('\n=== Final Check ===');
  console.log(`NULL platform count: ${nullPlatformCheck.count}`);
  console.log(`NULL category count: ${nullCategoryCheck.count}`);

  // List any platforms that are not in the approved list
  const approvedPlatforms = ['Interview', 'Speech', 'Rally', 'Social Media', 'Press'];
  const unexpectedPlatforms = distinctAfter.filter(p => !approvedPlatforms.includes(p.platform));
  if (unexpectedPlatforms.length > 0) {
    console.warn(`Unexpected platforms found: ${unexpectedPlatforms.map(p => p.platform).join(', ')}`);
  } else {
    console.log('✅ All platforms are in the approved list');
  }

  // List categories to verify they're all in approved list
  const approvedCategories = ['funny', 'outrageous', 'lie', 'ridiculous', 'unexpected', 'insightful', 'confusing'];
  const distinctCategories = db.prepare('SELECT DISTINCT category FROM quotes WHERE category IS NOT NULL ORDER BY category').all();
  const unexpectedCategories = distinctCategories.filter(c => !approvedCategories.includes(c.category));
  if (unexpectedCategories.length > 0) {
    console.warn(`Unexpected categories found: ${unexpectedCategories.map(c => c.category).join(', ')}`);
  } else {
    console.log('✅ All categories are in the approved list');
  }

  console.log('\n=== Summary ===');
  console.log('Normalization complete!');
  console.log(`Total quotes in database: ${db.prepare('SELECT COUNT(*) as count FROM quotes').get().count}`);
});

function normalizePlatform(input) {
  if (!input) return 'Speech';

  const normalized = input.toLowerCase().trim();

  // Exact matches
  if (normalized === 'interview') return 'Interview';
  if (normalized === 'speech') return 'Speech';
  if (normalized === 'rally') return 'Rally';
  if (normalized === 'social media' || normalized === 'socialmedia') return 'Social Media';
  if (normalized === 'press conference' || normalized === 'press') return 'Press';
  if (normalized === 'statement') return 'Press';
  if (normalized === 'television' || normalized === 'tv') return 'Press';
  if (normalized === 'debate') return 'Speech';

  // Social media variants (Twitter, X, Truth Social)
  if (['twitter', 'x', 'truth social'].includes(normalized)) return 'Social Media';

  // Any other value defaults to Speech
  return 'Speech';
}

// Run the transaction
transaction();

// Close database
db.close();
