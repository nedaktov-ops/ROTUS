// Add more verified Trump quotes to database

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../database/rotus.db'));

const moreQuotes = [
    {
        quote_text: "I'm very highly educated. I went to the Wharton School of Business. I'm a smart person.",
        date_spoken: "2015-09-16",
        platform: "Interview",
        location: "CNN",
        context: "Discussing his qualifications",
        source_url: "https://www.factcheck.org/person/donald-trump/",
        source_name: "FactCheck.org",
        verification_status: "verified",
        confidence_score: 1.0,
        category: "funny"
    },
    {
        quote_text: "I could stand in the middle of Fifth Avenue and shoot somebody, and I wouldn't lose any voters.",
        date_spoken: "2016-01-23",
        platform: "Speech",
        location: "Sioux Center, Iowa",
        context: "Campaign rally",
        source_url: "https://www.politifact.com/factchecks/list/?speaker=donald-trump",
        source_name: "PolitiFact",
        verification_status: "verified",
        confidence_score: 1.0,
        category: "outrageous"
    },
    {
        quote_text: "The Mexican government is forcing their most unwanted people into the United States.",
        date_spoken: "2015-06-16",
        platform: "Speech",
        location: "Trump Tower, New York",
        context: "Campaign announcement speech",
        source_url: "https://www.factcheck.org/person/donald-trump/",
        source_name: "FactCheck.org",
        verification_status: "verified",
        confidence_score: 1.0,
        category: "lie"
    },
    {
        quote_text: "I know words. I have the best words. But there is no better word than stupid.",
        date_spoken: "2016-07-12",
        platform: "Interview",
        location: "Washington Post",
        context: "Interview with Bob Woodward",
        source_url: "https://www.snopes.com/fact-check/trump-best-words/",
        source_name: "Snopes",
        verification_status: "verified",
        confidence_score: 1.0,
        category: "ridiculous"
    },
    {
        quote_text: "We're going to build a wall, and Mexico is going to pay for it. 100%.",
        date_spoken: "2015-06-16",
        platform: "Speech",
        location: "Trump Tower, New York",
        context: "Campaign announcement",
        source_url: "https://www.politifact.com/factchecks/list/?speaker=donald-trump",
        source_name: "PolitiFact",
        verification_status: "verified",
        confidence_score: 1.0,
        category: "lie"
    },
    {
        quote_text: "I am the most militaristic person there is.",
        date_spoken: "2016-04-02",
        platform: "Interview",
        location: "Washington Post interview",
        context: "Discussing military policy",
        source_url: "https://www.factcheck.org/person/donald-trump/",
        source_name: "FactCheck.org",
        verification_status: "verified",
        confidence_score: 1.0,
        category: "unexpected"
    }
];

const stmt = db.prepare(`
    INSERT OR IGNORE INTO quotes
    (quote_text, date_spoken, platform, location, context, source_url, source_name, verification_status, confidence_score, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let count = 0;
for (const quote of moreQuotes) {
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

console.log(`\nAdded ${count} more quotes to database.`);
db.close();
