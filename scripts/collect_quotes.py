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

    # Configure limits for 5x expansion (target 890+ total)
    collectors = [
        FactCheckCollector(max_articles=1000),     # FactCheck.org: up to 1000 articles (RSS limited, but safe)
        PolitiFactCollector(max_statements=1000), # PolitiFact: up to 1000 statements (list page may paginate)
        TwitterArchiveCollector(limit=5000),       # Trump Twitter Archive: up to 5000 tweets (large dataset)
        SnopesCollector(max_claims=1000),          # Snopes: up to 1000 claims (pagination)
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
