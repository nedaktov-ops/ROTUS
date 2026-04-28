#!/usr/bin/env python3
"""
PolitiFact collector - scrapes Trump fact-checks from list page
"""

import logging
import re
from datetime import datetime
from typing import List, Dict, Optional

import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent

logger = logging.getLogger(__name__)

class PolitiFactCollector:
    source_name = "PolitiFact"

    LIST_URL = "https://www.politifact.com/factchecks/list/?speaker=donald-trump"

    def __init__(self, max_statements: int = 100):
        self.max_statements = max_statements
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': UserAgent().random
        })

    def fetch_list_page(self) -> Optional[BeautifulSoup]:
        try:
            resp = self.session.get(self.LIST_URL, timeout=30)
            resp.raise_for_status()
            return BeautifulSoup(resp.content, 'html.parser')
        except Exception as e:
            logger.error(f"Failed to fetch PolitiFact list: {e}")
            return None

    def parse_date(self, date_str: Optional[str]) -> Optional[str]:
        if not date_str:
            return None
        # Try to parse various formats, e.g., "April 15, 2026" or "2026-04-15"
        for fmt in ('%B %d, %Y', '%Y-%m-%d'):
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                continue
        return None

    def extract_date_from_desc(self, desc_text: str) -> Optional[str]:
        """Extract date from description like 'stated on April 15, 2026 in ...'"""
        if not desc_text:
            return None
        # Look for a date pattern after "stated on"
        match = re.search(r'stated on (\w+ \d{1,2}, \d{4})', desc_text, re.IGNORECASE)
        if match:
            return self.parse_date(match.group(1))
        # Also match "on April 15, 2026"
        match2 = re.search(r'on (\w+ \d{1,2}, \d{4})', desc_text, re.IGNORECASE)
        if match2:
            return self.parse_date(match2.group(1))
        return None

    def collect(self) -> List[Dict]:
        quotes = []
        soup = self.fetch_list_page()
        if not soup:
            return quotes

        statements = soup.find_all('article', class_='m-statement')[:self.max_statements]
        logger.info(f"Found {len(statements)} statement blocks")

        for stmt in statements:
            try:
                # Quote text: inside m-statement__quote > a
                quote_elem = stmt.find('div', class_='m-statement__quote')
                if not quote_elem:
                    continue
                quote_link = quote_elem.find('a')
                if not quote_link:
                    continue
                quote_text = quote_link.get_text(strip=True)
                if len(quote_text) < 10:
                    continue

                # Article URL
                article_url = quote_link.get('href', '')
                if article_url and not article_url.startswith('http'):
                    article_url = f"https://www.politifact.com{article_url}"

                # Context and spoken date from m-statement__desc
                context = ""
                spoken_date = None
                desc_elem = stmt.find('div', class_='m-statement__desc')
                if desc_elem:
                    desc_text = desc_elem.get_text(strip=True)
                    context = desc_text
                    spoken_date = self.extract_date_from_desc(desc_text)

                # Ruling from class m-statement--XXX
                ruling = None
                for cls in stmt.get('class', []):
                    if cls.startswith('m-statement--'):
                        ruling = cls.replace('m-statement--', '')
                        break

                quote_dict = {
                    "quote_text": quote_text,
                    "date_spoken": spoken_date,
                    "platform": None,
                    "location": None,
                    "context": context,
                    "source_url": article_url,
                    "source_name": self.source_name,
                    "category": None,
                    "sources": [{
                        "url": article_url,
                        "title": f"PolitiFact: {ruling}" if ruling else "PolitiFact",
                        "source_type": "factcheck",
                        "publication_date": None,
                        "verified_by": self.source_name
                    }],
                    "entities": [{"name": "Donald Trump", "type": "person"}],
                    "tags": ["trump", "politifact"] + ([ruling] if ruling else [])
                }
                quotes.append(quote_dict)
            except Exception as e:
                logger.error(f"Error extracting statement: {e}")
                continue

        logger.info(f"Extracted {len(quotes)} quotes from {self.source_name}")
        return quotes
