#!/usr/bin/env python3
"""
FactCheck.org collector using RSS feed
"""

import logging
import re
from datetime import datetime
from typing import List, Dict, Optional

import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent

logger = logging.getLogger(__name__)

class FactCheckCollector:
    source_name = "FactCheck.org"

    RSS_URL = "https://www.factcheck.org/person/donald-trump/feed/"

    def __init__(self, max_articles: int = 10):
        self.max_articles = max_articles
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': UserAgent().random
        })

    def fetch_rss(self) -> Optional[BeautifulSoup]:
        try:
            resp = self.session.get(self.RSS_URL, timeout=30)
            resp.raise_for_status()
            return BeautifulSoup(resp.content, 'xml')
        except Exception as e:
            logger.error(f"Failed to fetch RSS: {e}")
            return None

    def parse_date(self, date_str: str) -> Optional[str]:
        try:
            dt = datetime.strptime(date_str, '%a, %d %b %Y %H:%M:%S %z')
            return dt.strftime('%Y-%m-%d')
        except Exception:
            return None

    def clean_text(self, text: str) -> str:
        text = BeautifulSoup(text, 'html.parser').get_text() if '<' in text else text
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def extract_quotes_from_html(self, html: str) -> List[str]:
        """Extract blockquote texts from HTML content."""
        soup = BeautifulSoup(html, 'html.parser')
        blockquotes = soup.find_all('blockquote')
        quotes = []
        for bq in blockquotes:
            text = self.clean_text(bq.get_text())
            if len(text) >= 20:
                quotes.append(text)
        return quotes

    def collect(self) -> List[Dict]:
        quotes = []
        soup = self.fetch_rss()
        if not soup:
            return quotes

        items = soup.find_all('item')[:self.max_articles]
        logger.info(f"Processing {len(items)} articles from RSS")

        for item in items:
            try:
                title = self.clean_text(item.title.text) if item.title else ""
                link = item.link.text if item.link else ""
                pub_date = self.parse_date(item.pubDate.text) if item.pubDate else None

                # Get full content from <content:encoded>
                content_tag = item.find('content:encoded')
                if content_tag and content_tag.text:
                    content_html = content_tag.text
                else:
                    desc_tag = item.description
                    content_html = desc_tag.text if desc_tag else ""

                quote_texts = self.extract_quotes_from_html(content_html)

                for qtext in quote_texts:
                    quote_dict = {
                        "quote_text": qtext,
                        "date_spoken": pub_date,
                        "platform": None,
                        "location": None,
                        "context": title,
                        "source_url": link,
                        "source_name": self.source_name,
                        "category": None,
                        "sources": [{
                            "url": link,
                            "title": title,
                            "source_type": "factcheck",
                            "publication_date": pub_date,
                            "verified_by": self.source_name
                        }],
                        "entities": [{"name": "Donald Trump", "type": "person"}],
                        "tags": ["trump", "factcheck"]
                    }
                    quotes.append(quote_dict)
            except Exception as e:
                logger.error(f"Error processing item: {e}")
                continue

        logger.info(f"Extracted {len(quotes)} quotes from {self.source_name}")
        return quotes
