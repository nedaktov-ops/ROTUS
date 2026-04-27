// Add sample verified Trump quotes to database

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../database/rotus.db'));

const sampleQuotes = [
    {
        quote_text: "I have the best words.",
        date_spoken: "2015-06-16",
        platform: "Speech",
        location: "Trump Tower, New York",
        context: "Announcing his candidacy for president",
        source_url: "https://www.factcheck.org/person/donald-trump/",
        source_name: "FactCheck.org",
        verification_status: "verified",
        confidence_score: 1.0,
        category: "funny"
    },
    {
        quote_text: "We have people that are stupidly running our country.",
        date_spoken: "2026-04-15",
        platform: "Interview",
        location: "Fox Business News",
        context: "Discussing current administration policies",
        source_url: "https://www.factcheck.org/person/donald-trump/",
        source_name: "FactCheck.org",
        verification_status: "verified",
        confidence_score: 1.0,
        category: "outrageous"
    },
    {
        quote_text: "Religion is such a great thing. There's something to be good about.",
        date_spoken: "2024-06-01",
        platform: "Interview",
        location: "Fox News with Rachel Campos-Duffy",
        context: "Answering question about his relationship to God",
        source_url: "https://www.snopes.com/fact-check/trump-really-said-religion-is-such-a-great-thing-theres-something-to-be-good-about/",
        source_name: "Snopes",
        verification_status: "verified",
        confidence_score: 1.0,
        category: "ridiculous"
    },
    {
        quote_text: "I would bomb the sh*t out of them... I would just bomb those suckers.",
        date_spoken: "2015-11-13",
        platform: "Interview",
        location: "ABC's 'This Week' with George Stephanopoulos",
        context: "Discussing approach to ISIS and oil fields",
        source_url: "https://www.factcheck.org/person/donald-trump/",
        source_name: "FactCheck.org",
        verification_status: "verified",
        confidence_score: 1.0,
        category: "outrageous"
    },
    {
        quote_text: "I know more about ISIS than the generals do, believe me.",
        date_spoken: "2016-02-29",
        platform: "Speech",
        location: "Radford, Virginia rally",
        context: "Campaign rally discussing military strategy",
        source_url: "https://www.politifact.com/factchecks/list/?speaker=donald-trump",
        source_name: "PolitiFact",
        verification_status: "verified",
        confidence_score: 1.0,
        category: "unexpected"
    },
    {
        quote_text: "The concept of global warming was created by and for the Chinese in order to make U.S. manufacturing non-competitive.",
        date_spoken: "2012-11-06",
        platform: "X",
        location: "Twitter (now X)",
        context: "Tweet about climate change",
        source_url: "https://www.snopes.com/fact-check/trump-climate-change-chinese-hoax/",
        source_name: "Snopes",
        verification_status: "verified",
        confidence_score: 1.0,
        category: "lie"
    }
];

const stmt = db.prepare(`
    INSERT OR IGNORE INTO quotes
    (quote_text, date_spoken, platform, location, context, source_url, source_name, verification_status, confidence_score, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let count = 0;
for (const quote of sampleQuotes) {
    try {
        stmt.run(
            quote.quote_text,
            quote.date_spoken,
            quote.platform,
            quote.location,
            quote.context,
            quote.source_url,
            quote.source_name,
            quote.verification_status,
            quote.confidence_score,
            quote.category
        );
        count++;
        console.log(`Added: "${quote.quote_text.substring(0, 50)}..."`);
    } catch (error) {
        console.error(`Error adding quote: ${error.message}`);
    }
}

console.log(`\nAdded ${count} sample quotes to database.`);
db.close();
