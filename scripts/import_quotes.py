#!/usr/bin/env python3
"""
Import collected quotes JSON into ROTUS database via API
"""

import json
import requests
import time
from pathlib import Path
import sys

def main():
    input_file = Path('collected_quotes.json')
    if not input_file.exists():
        print(f"Error: {input_file} not found. Run collect_quotes.py first.")
        sys.exit(1)

    quotes = json.loads(input_file.read_text())
    print(f"Loaded {len(quotes)} quotes")

    API_URL = "http://localhost:3000/api/quotes"

    success_count = 0
    error_count = 0

    for i, quote in enumerate(quotes, 1):
        try:
            response = requests.post(API_URL, json=quote)
            if response.status_code in (200, 201):
                success_count += 1
                print(f"[{i}] Imported: {quote['quote_text'][:50]}...")
            else:
                error_count += 1
                print(f"[{i}] Error {response.status_code}: {response.text[:100]}")
        except Exception as e:
            error_count += 1
            print(f"[{i}] Exception: {e}")
        time.sleep(0.05)  # be polite

    print(f"\nImport complete: {success_count} success, {error_count} errors")
    return 0 if error_count == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
