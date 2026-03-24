"""
Writes auto-detected deal data to Firestore auto_deals/{restaurantKey}.
Uses Firebase Admin SDK with a service account JSON stored in env vars.
"""

import os
import json
import logging
from datetime import datetime, timezone, timedelta

import firebase_admin
from firebase_admin import credentials, firestore

logger = logging.getLogger(__name__)

_db = None


def _get_db():
    global _db
    if _db is not None:
        return _db

    if not firebase_admin._apps:
        # Local dev: read from a file path
        sa_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "")
        if sa_path:
            # Resolve relative to this file's directory
            resolved = os.path.join(os.path.dirname(__file__), "..", sa_path)
            cred = credentials.Certificate(os.path.abspath(resolved))
        else:
            # Production: read from JSON string in env var
            sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "")
            if not sa_json:
                raise RuntimeError(
                    "Set FIREBASE_SERVICE_ACCOUNT_PATH (local) or "
                    "FIREBASE_SERVICE_ACCOUNT_JSON (production)"
                )
            cred = credentials.Certificate(json.loads(sa_json))

        firebase_admin.initialize_app(cred)

    _db = firestore.client()
    return _db


def write_deal(
    restaurant_key: str,
    restaurant_name: str,
    instagram_handle: str,
    parse_result: dict,
) -> None:
    """
    Write or update a deal document in Firestore.

    - Only updates `specials` when confidence is "high" or "medium"
    - Sets status="stale" when source post is >45 days old
    - Always updates lastChecked; only updates lastUpdated when a deal is found
    """
    db = _get_db()
    ref = db.collection("auto_deals").document(restaurant_key)

    now = datetime.now(timezone.utc)
    has_deal = parse_result.get("has_deal", False)
    confidence = parse_result.get("confidence", "low")
    specials = parse_result.get("specials", {})
    source_post = parse_result.get("source_post", "")

    # Read existing doc to check lastUpdated age
    existing = ref.get()
    existing_data = existing.to_dict() if existing.exists else {}

    last_updated = existing_data.get("lastUpdated")
    is_stale = False
    if last_updated:
        # Firestore Timestamp → datetime
        if hasattr(last_updated, "toDatetime"):
            last_updated_dt = last_updated.toDatetime()
        else:
            last_updated_dt = last_updated
        is_stale = (now - last_updated_dt.replace(tzinfo=timezone.utc)) > timedelta(days=45)

    update = {
        "restaurantName": restaurant_name,
        "instagramHandle": instagram_handle,
        "lastChecked": firestore.SERVER_TIMESTAMP,
        "status": "stale" if is_stale else "active",
    }

    if has_deal and confidence in ("high", "medium"):
        update["specials"] = specials
        update["sourcePost"] = source_post
        update["confidence"] = confidence
        update["lastUpdated"] = firestore.SERVER_TIMESTAMP
        update["status"] = "active"
        logger.info(
            "Updated deal for %s (confidence=%s)", restaurant_key, confidence
        )
    else:
        logger.info(
            "No deal written for %s (has_deal=%s, confidence=%s)",
            restaurant_key, has_deal, confidence,
        )

    ref.set(update, merge=True)
