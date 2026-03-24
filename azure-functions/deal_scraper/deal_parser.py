"""
Parses Instagram posts for restaurant deal info using the Google Gemini API (free tier).
Returns structured JSON or None if no deal is detected.
"""

import os
import json
import logging
import urllib.request
from datetime import datetime, timezone

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

SYSTEM_PROMPT = """You are a restaurant deal extractor. Given Instagram post text (and optionally an image),
identify ANY deal, special, or promotion — whether recurring weekly OR a current/ongoing promotion.

Return ONLY valid JSON in this exact format:
{
  "has_deal": true,
  "confidence": "high",
  "specials": {
    "Monday": "...",
    "Tuesday": "...",
    "Wednesday": "...",
    "Thursday": "...",
    "Friday": "...",
    "Saturday": "...",
    "Sunday": "..."
  }
}

Rules:
- "has_deal" is true if ANY deal, special, discount, or promotion is mentioned
- This includes: happy hours, weekly specials, monthly promos, event-based deals (e.g. March Madness), limited-time offers
- "confidence": "high" = explicit prices and days, "medium" = deal mentioned but details vague, "low" = very unclear
- "specials": map deals to the specific days they apply; if a deal runs all week write it on every day; if day is unknown leave it as ""
- Keep deal descriptions concise (under 120 chars per day)
- If truly no deal is mentioned at all, return { "has_deal": false, "confidence": "low", "specials": {} }
- Return ONLY JSON, no markdown, no explanation"""


def _get_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY env var is not set")
    return genai.Client(api_key=api_key)


def _fetch_image_bytes(url: str) -> bytes | None:
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            return resp.read()
    except Exception as exc:
        logger.warning("Could not fetch image %s: %s", url, exc)
        return None


def parse_posts_for_deals(restaurant_name: str, posts: list[dict]) -> dict | None:
    """
    Given a list of recent posts, ask Gemini to extract recurring deal info.

    Returns a dict with keys: has_deal, confidence, specials, source_post
    or None if the API call fails entirely.
    """
    if not posts:
        return None

    client = _get_client()

    # Build combined context from all posts
    post_texts = []
    for i, post in enumerate(posts, 1):
        ts = post["timestamp"]
        if isinstance(ts, datetime):
            date_str = ts.strftime("%Y-%m-%d")
            age_days = (datetime.now(timezone.utc) - ts.replace(tzinfo=timezone.utc)).days
        else:
            date_str = "unknown"
            age_days = 999
        post_texts.append(f"[Post {i} — {date_str}, {age_days} days ago]\n{post['text']}")

    combined_text = "\n\n".join(post_texts)
    source_post = posts[0]["text"][:500] if posts else ""

    prompt = f"Restaurant: {restaurant_name}\n\nRecent Instagram posts:\n\n{combined_text}\n\nExtract any recurring weekly deals."

    # Build content parts — add image if first post has one and a short caption
    contents: list = []
    first_post = posts[0]
    if first_post.get("image_url") and len(first_post.get("text", "")) < 100:
        img_bytes = _fetch_image_bytes(first_post["image_url"])
        if img_bytes:
            contents.append(types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"))

    contents.append(prompt)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
        )
        raw = response.text.strip()

        # Strip markdown code fences if Gemini wraps in ```json
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        result = json.loads(raw.strip())

        specials = result.get("specials", {})
        for day in DAYS_OF_WEEK:
            specials.setdefault(day, "")

        return {
            "has_deal": result.get("has_deal", False),
            "confidence": result.get("confidence", "low"),
            "specials": specials,
            "source_post": source_post,
        }

    except json.JSONDecodeError as exc:
        logger.error("Gemini returned invalid JSON for %s: %s", restaurant_name, exc)
        return None
    except Exception as exc:
        logger.error("Gemini API error for %s: %s", restaurant_name, exc)
        return None
