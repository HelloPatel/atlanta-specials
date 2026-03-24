"""
Fetches recent Instagram posts for all restaurants in one Apify call (cost-efficient).
Returns a dict mapping instagram_handle -> list of { text, image_url, timestamp }.
"""

import os
import logging
from datetime import datetime, timezone

from apify_client import ApifyClient

logger = logging.getLogger(__name__)


def fetch_all_posts(handle_map: dict[str, str], max_posts_per_account: int = 3) -> dict[str, list[dict]]:
    """
    Fetch recent posts for all handles in a SINGLE Apify actor call.

    handle_map: { restaurant_key: instagram_handle }
    Returns: { instagram_handle: [{ text, image_url, timestamp }, ...] }
    """
    token = os.environ.get("APIFY_API_TOKEN", "")
    if not token:
        raise RuntimeError("APIFY_API_TOKEN env var is not set")

    client = ApifyClient(token)

    # Build URL list — one per handle
    handle_to_key = {v: k for k, v in handle_map.items()}
    urls = [f"https://www.instagram.com/{h}/" for h in handle_map.values()]

    run_input = {
        "directUrls": urls,
        "resultsType": "posts",
        "resultsLimit": max_posts_per_account,
    }

    # results[handle] = [post, ...]
    results: dict[str, list[dict]] = {h: [] for h in handle_map.values()}

    try:
        logger.info("Starting Apify run for %d accounts", len(urls))
        run = client.actor("apify/instagram-scraper").call(run_input=run_input)

        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            handle = item.get("ownerUsername") or item.get("username") or ""
            if not handle or handle not in results:
                continue

            if len(results[handle]) >= max_posts_per_account:
                continue

            ts_raw = item.get("timestamp") or item.get("taken_at_timestamp")
            if isinstance(ts_raw, str):
                try:
                    ts = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
                except ValueError:
                    ts = datetime.now(timezone.utc)
            elif isinstance(ts_raw, (int, float)):
                ts = datetime.fromtimestamp(ts_raw, tz=timezone.utc)
            else:
                ts = datetime.now(timezone.utc)

            results[handle].append({
                "text": item.get("caption") or item.get("alt") or "",
                "image_url": item.get("displayUrl") or item.get("thumbnailUrl"),
                "timestamp": ts,
            })

        total_posts = sum(len(v) for v in results.values())
        logger.info("Apify run complete — fetched %d posts across %d accounts", total_posts, len(urls))

    except Exception as exc:
        logger.error("Apify batch fetch failed: %s", exc)

    return results
