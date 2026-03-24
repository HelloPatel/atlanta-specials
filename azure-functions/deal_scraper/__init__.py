"""
Azure Function — Timer Trigger
Runs daily at 8:00 AM ET (12:00 UTC).

Orchestrates: Instagram fetch (1 batched Apify call) → Gemini parse → Firestore write
for every restaurant in restaurant_config.json.
"""

import json
import logging
from pathlib import Path

import azure.functions as func

from .instagram_fetcher import fetch_all_posts
from .deal_parser import parse_posts_for_deals
from .firestore_writer import write_deal

logger = logging.getLogger(__name__)

CONFIG_PATH = Path(__file__).parent / "restaurant_config.json"
with CONFIG_PATH.open() as f:
    RESTAURANT_CONFIG: dict[str, str] = json.load(f)


def main(mytimer: func.TimerRequest) -> None:
    if mytimer.past_due:
        logger.warning("Timer is past due — running now anyway")

    logger.info("Deal scraper starting. %d restaurants configured.", len(RESTAURANT_CONFIG))

    # 1. Fetch all posts in a single Apify call
    all_posts = fetch_all_posts(RESTAURANT_CONFIG, max_posts_per_account=3)

    success_count = 0
    error_count = 0

    for restaurant_key, instagram_handle in RESTAURANT_CONFIG.items():
        restaurant_name = _key_to_display_name(restaurant_key)
        posts = all_posts.get(instagram_handle, [])

        if not posts:
            logger.info("No posts for %s (@%s) — skipping", restaurant_name, instagram_handle)
            continue

        logger.info("Parsing %d posts for %s", len(posts), restaurant_name)

        try:
            # 2. Parse with Gemini
            parse_result = parse_posts_for_deals(restaurant_name, posts)

            if parse_result is None:
                logger.warning("Gemini parse failed for %s — skipping", restaurant_name)
                error_count += 1
                continue

            # 3. Write to Firestore
            write_deal(
                restaurant_key=restaurant_key,
                restaurant_name=restaurant_name,
                instagram_handle=instagram_handle,
                parse_result=parse_result,
            )
            success_count += 1

        except Exception as exc:
            logger.error("Unexpected error for %s: %s", restaurant_key, exc, exc_info=True)
            error_count += 1

    logger.info("Deal scraper done. success=%d errors=%d", success_count, error_count)


def _key_to_display_name(key: str) -> str:
    return key.replace("-", " ").title()
