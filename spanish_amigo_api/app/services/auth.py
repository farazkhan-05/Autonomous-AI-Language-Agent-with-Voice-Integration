import base64
import json
import logging
from typing import Any, Optional, cast

import firebase_admin
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth

from app.config import get_settings

logger = logging.getLogger("spanish-amigo-ai")
settings = get_settings()

# Initialize Firebase Admin app once for token verification.
if not firebase_admin._apps:
    firebase_admin.initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID})

security = HTTPBearer()


def decode_unverified_token(token: str) -> Optional[dict[str, Any]]:
    """
    Decode JWT payload without verifying signature.
    Used only for explicit local-development fallback.
    """
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        payload_b64 = parts[1]
        padding = len(payload_b64) % 4
        if padding:
            payload_b64 += "=" * (4 - padding)
        payload_json = base64.urlsafe_b64decode(payload_b64).decode("utf-8")
        return cast(dict[str, Any], json.loads(payload_json))
    except Exception as exc:
        logger.warning("Failed to decode unverified token: %s", exc)
        return None


def _http_401(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict[str, Any]:
    """
    Verify Firebase ID token and return decoded identity claims.

    In non-production environments, token signature verification can be bypassed only
    when AUTH_ALLOW_INSECURE_DEV_TOKENS is explicitly enabled.
    """
    token = credentials.credentials

    # Local fallback path is opt-in and never active in production.
    if settings.ENV != "production" and settings.AUTH_ALLOW_INSECURE_DEV_TOKENS:
        decoded = decode_unverified_token(token)
        if decoded:
            decoded.setdefault("uid", decoded.get("user_id") or decoded.get("sub", ""))
            if decoded.get("uid"):
                logger.debug("Auth dev fallback decode used for uid=%s", decoded["uid"])
                return decoded
        logger.warning("Auth dev fallback decode failed; attempting full Firebase verification.")

    try:
        return cast(dict[str, Any], auth.verify_id_token(token))
    except auth.ExpiredIdTokenError:
        logger.warning("Auth token expired")
        raise _http_401("Authentication failed. Please sign in again.")
    except auth.InvalidIdTokenError:
        logger.warning("Auth token invalid")
        raise _http_401("Authentication failed. Please sign in again.")
    except Exception as exc:
        logger.error("Auth verification error: %s", exc, exc_info=True)
        raise _http_401("Authentication failed. Please try again.")
