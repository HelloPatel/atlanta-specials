"""
Local test runner — runs the deal scraper for a single restaurant
without needing the Azure Functions runtime.

Usage:
  cd azure-functions
  python test_run.py
"""

import os
import sys
import json
from pathlib import Path

# Load local.settings.json into env vars
settings_path = Path(__file__).parent / "local.settings.json"
with settings_path.open() as f:
    settings = json.load(f)
for key, value in settings.get("Values", {}).items():
    os.environ.setdefault(key, value)

sys.path.insert(0, str(Path(__file__).parent))

from deal_scraper.instagram_fetcher import fetch_all_posts
from deal_scraper.deal_parser import parse_posts_for_deals
from deal_scraper.firestore_writer import write_deal

# ── Test a single restaurant ─────────────────────────────────────────────────
TEST_RESTAURANT_KEY = "red-pepper-taqueria"
TEST_INSTAGRAM_HANDLE = "redpepperatl"
TEST_RESTAURANT_NAME = "Red Pepper Taqueria"
# ─────────────────────────────────────────────────────────────────────────────

print(f"Fetching posts for @{TEST_INSTAGRAM_HANDLE} (batched call)...")
all_posts = fetch_all_posts({TEST_RESTAURANT_KEY: TEST_INSTAGRAM_HANDLE}, max_posts_per_account=3)
posts = all_posts.get(TEST_INSTAGRAM_HANDLE, [])
print(f"  Got {len(posts)} posts")

if not posts:
    print("No posts found — check the Instagram handle.")
    sys.exit(1)

for i, p in enumerate(posts, 1):
    print(f"\n  Post {i} ({p['timestamp'].strftime('%Y-%m-%d')}):")
    print(f"  {p['text'][:200]}")

print("\nParsing with Gemini...")
result = parse_posts_for_deals(TEST_RESTAURANT_NAME, posts)
print(f"  Result: {json.dumps(result, indent=2, ensure_ascii=False)}")

if result and result["has_deal"] and result["confidence"] in ("high", "medium"):
    print("\nWriting to Firestore...")
    write_deal(TEST_RESTAURANT_KEY, TEST_RESTAURANT_NAME, TEST_INSTAGRAM_HANDLE, result)
    print("  Done — check Firebase Console → auto_deals collection")
else:
    print("\nNo high/medium confidence deal found — nothing written to Firestore.")
