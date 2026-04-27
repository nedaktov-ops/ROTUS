#!/usr/bin/env python3
"""
ROTUS Quote Collector - aggregates quotes from multiple sources
"""

import json
import logging
from pathlib import Path

# Import collectors from the collectors package
from collectors.factcheck_collector import FactCheckCollector
from collectors.politifact_collector import PolitiFactCollector
from collectors.twitter_archive_collector import TwitterArchiveCollector
from collectors.snopes_collector import SnopesCollector

def main():
    logging.basicConfig(level=logging.INFO)
    all_quotes = []

    # Configure limits as needed
    collectors = [
        FactCheckCollector(max_articles=50),      # FactCheck.org: up to 50 articles
        PolitiFactCollector(max_statements=50),  # PolitiFact: up to 50 statements
        TwitterArchiveCollector(limit=200),      # Trump Twitter Archive: recent 200 tweets (network may limit)
        SnopesCollector(max_claims=20),          # Snopes: up to 20 claims
    ]

    for collector in collectors:
        try:
            quotes = collector.collect()
            all_quotes.extend(quotes)
            print(f"Collected {len(quotes)} quotes from {collector.source_name}")
        except Exception as e:
            print(f"Error collecting from {collector.source_name}: {e}")

    # Deduplicate based on (quote_text, date_spoken)
    seen = set()
    unique_quotes = []
    for q in all_quotes:
        key = (q['quote_text'].strip().lower(), q.get('date_spoken'))
        if key not in seen:
            seen.add(key)
            unique_quotes.append(q)

    # Write to JSON file
    output_file = Path('collected_quotes.json')
    output_file.write_text(json.dumps(unique_quotes, indent=2, ensure_ascii=False))
    print(f"Total unique quotes: {len(unique_quotes)}. Saved to {output_file}")

if __name__ == '__main__':
    main()
