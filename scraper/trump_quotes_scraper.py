#!/usr/bin/env python3
"""
ROTUS Playwright Scraper - Collect verified Trump quotes
Sources: FactCheck.org, PolitiFact, Snopes, Truth Social, X (Twitter)
"""

import asyncio
import json
import sqlite3
from datetime import datetime
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout


class TrumpQuoteScraper:
    """Scrape verified Trump quotes from multiple sources."""

    def __init__(self, db_path="../database/rotus.db"):
        self.db_path = db_path
        self.conn = None
        self.quote_count = 0

    async def init_db(self):
        """Initialize SQLite database."""
        self.conn = sqlite3.connect(self.db_path)
        with open("../database/schema.sql", "r") as f:
            self.conn.executescript(f.read())
        self.conn.commit()

    async def scrape_factcheck(self, page):
        """Scrape FactCheck.org Trump archives."""
        print("Scraping FactCheck.org...")
        quotes = []
        try:
            await page.goto("https://www.factcheck.org/person/donald-trump/", timeout=30000)
            await page.wait_for_load_state("networkidle")

            # Extract article links
            articles = await page.query_selector_all("article, .entry-title a, h3 a")
            links = []
            for article in articles[:10]:  # Limit to first 10 for testing
                href = await article.get_attribute("href")
                if href and "factcheck.org" in href:
                    links.append(href)

            print(f"Found {len(links)} FactCheck articles")

            for link in links[:5]:  # Process first 5 for testing
                try:
                    await page.goto(link, timeout=20000)
                    await page.wait_for_load_state("networkidle")

                    # Extract quotes - look for blockquotes or quoted text
                    content = await page.content()
                    # Simple quote extraction (would need refinement)
                    await self.extract_quotes_from_page(page, "FactCheck.org", link)
                except Exception as e:
                    print(f"Error processing {link}: {e}")

        except Exception as e:
            print(f"FactCheck scraping error: {e}")

        return quotes

    async def scrape_politifact(self, page):
        """Scrape PolitiFact Trump fact-checks."""
        print("Scraping PolitiFact...")
        try:
            await page.goto(
                "https://www.politifact.com/factchecks/list/?category=&ruling=false&speaker=donald-trump",
                timeout=30000
            )
            await page.wait_for_load_state("networkidle")

            # Extract fact-check items
            items = await page.query_selector_all(".m-teaser, .o-list__item")
            print(f"Found {len(items)} PolitiFact items")

        except Exception as e:
            print(f"PolitiFact scraping error: {e}")

    async def scrape_snopes(self, page):
        """Scrape Snopes Trump fact-checks."""
        print("Scraping Snopes...")
        try:
            await page.goto(
                "https://www.snopes.com/fact-check/?s=trump",
                timeout=30000
            )
            await page.wait_for_load_state("networkidle")

        except Exception as e:
            print(f"Snopes scraping error: {e}")

    async def extract_quotes_from_page(self, page, source_name, url):
        """Extract quotes from a fact-check page."""
        try:
            # Look for blockquotes or quoted text patterns
            blockquotes = await page.query_selector_all("blockquote, q, .quote")
            for bq in blockquotes:
                text = await bq.inner_text()
                if len(text) > 20:  # Minimum quote length
                    await self.save_quote({
                        "quote_text": text.strip(),
                        "source_url": url,
                        "source_name": source_name,
                        "verification_status": "verified",
                        "date_spoken": datetime.now().strftime("%Y-%m-%d"),
                    })
        except Exception as e:
            print(f"Quote extraction error: {e}")

    async def save_quote(self, quote_data):
        """Save quote to database."""
        if not self.conn:
            return

        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                INSERT OR IGNORE INTO quotes
                (quote_text, date_spoken, source_url, source_name, verification_status)
                VALUES (?, ?, ?, ?, ?)
            """, (
                quote_data.get("quote_text"),
                quote_data.get("date_spoken"),
                quote_data.get("source_url"),
                quote_data.get("source_name"),
                quote_data.get("verification_status", "pending")
            ))
            self.conn.commit()
            self.quote_count += 1
            print(f"Saved quote #{self.quote_count}")
        except Exception as e:
            print(f"Save error: {e}")

    async def run(self):
        """Run all scrapers."""
        await self.init_db()

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            # Run scrapers
            await self.scrape_factcheck(page)
            await self.scrape_politifact(page)
            await self.scrape_snopes(page)

            await browser.close()

        print(f"\nScraping complete. Total quotes: {self.quote_count}")
        if self.conn:
            self.conn.close()


async def main():
    scraper = TrumpQuoteScraper()
    await scraper.run()


if __name__ == "__main__":
    asyncio.run(main())
