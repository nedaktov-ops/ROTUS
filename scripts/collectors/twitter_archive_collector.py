#!/usr/bin/env python3
"""
Trump Twitter Archive collector.
Downloads the CSV of all Trump tweets from https://www.thetrumptwitterarchive.com/static/trump_tweets.csv
"""

import csv
import io
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict

import requests
from fake_useragent import UserAgent

logger = logging.getLogger(__name__)

class TwitterArchiveCollector:
    source_name = "Trump Twitter Archive"
    CSV_URL = "https://www.thetrumptwitterarchive.com/static/trump_tweets.csv"

    def __init__(self, limit: int = 500):
        self.limit = limit
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': UserAgent().random
        })

    def fetch_csv(self) -> List[Dict]:
        try:
            resp = self.session.get(self.CSV_URL, timeout=60)
            resp.raise_for_status()
        except Exception as e:
            logger.error(f"Failed to fetch CSV from {self.CSV_URL}: {e}")
            return []
        content = resp.content.decode('utf-8', errors='ignore')
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)[:self.limit]
        logger.info(f"Fetched {len(rows)} rows from CSV")
        return rows

    def parse_date(self, date_str: str) -> str:
        # Expected format: "Sat Jan 21 19:27:00 +0000 2017"
        for fmt in ('%a %b %d %H:%M:%S %z %Y', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d'):
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                continue
        # If parsing fails, return original string
        return date_str

    def collect(self) -> List[Dict]:
        quotes = []
        rows = self.fetch_csv()
        for row in rows:
            try:
                tweet_id = row.get('id') or row.get('status_id') or row.get('tweet_id')
                text = row.get('text') or row.get('content') or ''
                text = text.strip()
                if not text or len(text) < 5:
                    continue
                date_str = row.get('created_at') or row.get('date') or ''
                spoken_date = self.parse_date(date_str) if date_str else None
                source = row.get('source', '').strip()
                if tweet_id:
                    source_url = f"https://twitter.com/realDonaldTrump/status/{tweet_id}"
                else:
                    source_url = ""
                quote_dict = {
                    "quote_text": text,
                    "date_spoken": spoken_date,
                    "platform": "X",
                    "location": None,
                    "context": f"Source: {source}" if source else "",
                    "source_url": source_url,
                    "source_name": "Trump Twitter Archive",
                    "category": None,
                    "sources": [{
                        "url": source_url,
                        "title": "Tweet from @realDonaldTrump",
                        "source_type": "social",
                        "publication_date": spoken_date,
                        "verified_by": "Trump Twitter Archive"
                    }],
                    "entities": [{"name": "Donald Trump", "type": "person"}],
                    "tags": ["trump", "tweet", "archive"]
                }
                quotes.append(quote_dict)
            except Exception as e:
                logger.error(f"Error processing tweet row: {e}")
                continue
        logger.info(f"Extracted {len(quotes)} tweets from {self.source_name}")
        return quotes
