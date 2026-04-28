#!/usr/bin/env python3
"""
Snopes collector – parses the search results page for Trump and extracts claims from JSON-LD.
"""

import json
import logging
from datetime import datetime
from typing import List, Dict

import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent

logger = logging.getLogger(__name__)

class SnopesCollector:
    source_name = "Snopes"
    SEARCH_URL = "https://www.snopes.com/fact-check/?s=trump"

    def __init__(self, max_claims: int = 20):
        self.max_claims = max_claims
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': UserAgent().random
        })

    def fetch_search_page(self) -> BeautifulSoup | None:
        try:
            resp = self.session.get(self.SEARCH_URL, timeout=30)
            resp.raise_for_status()
            return BeautifulSoup(resp.content, 'html.parser')
        except Exception as e:
            logger.error(f"Failed to fetch Snopes search: {e}")
            return None

    def parse_date(self, date_str: str) -> str | None:
        for fmt in ('%Y-%m-%d', '%B %d, %Y', '%b %d, %Y'):
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                continue
        return None

    def collect(self) -> List[Dict]:
        quotes = []
        soup = self.fetch_search_page()
        if not soup:
            return quotes

        script_tag = soup.find('script', type='application/ld+json')
        if not script_tag:
            logger.warning("No JSON-LD script found on Snopes page")
            return []

        try:
            data = json.loads(script_tag.string)
        except Exception as e:
            logger.error(f"Failed to parse JSON-LD: {e}")
            return []

        items = data.get('mainEntity', [])
        if not items:
            items = []
        # Ensure items is a list (it can be a single dict)
        if isinstance(items, dict):
            items = [items]
        if not isinstance(items, list):
            logger.warning(f"Unexpected items type: {type(items)}")
            items = []
        items = items[:self.max_claims]
        logger.info(f"Found {len(items)} items in Snopes JSON-LD")

        for item in items:
            try:
                claim_text = item.get('name', '').strip()
                if not claim_text or len(claim_text) < 10:
                    continue
                article_url = item.get('url', '')
                date_published = item.get('datePublished', '')
                spoken_date = self.parse_date(date_published) if date_published else None

                quote_dict = {
                    "quote_text": claim_text,
                    "date_spoken": spoken_date,
                    "platform": "Various",
                    "location": None,
                    "context": "Claim attributed to Donald Trump; sourced via Snopes.",
                    "source_url": article_url,
                    "source_name": "Snopes",
                    "category": None,
                    "sources": [{
                        "url": article_url,
                        "title": "Snopes fact-check",
                        "source_type": "factcheck",
                        "publication_date": spoken_date,
                        "verified_by": "Snopes"
                    }],
                    "entities": [{"name": "Donald Trump", "type": "person"}],
                    "tags": ["trump", "snopes", "fact-check"]
                }
                quotes.append(quote_dict)
            except Exception as e:
                logger.error(f"Error processing Snopes item: {e}")
                continue

        logger.info(f"Extracted {len(quotes)} quotes from {self.source_name}")
        return quotes
