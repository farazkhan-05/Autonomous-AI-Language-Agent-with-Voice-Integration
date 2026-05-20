import base64
import json
import logging
import firebase_admin
from firebase_admin import auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import get_settings

logger = logging.getLogger("spanish-amigo-ai")

# Initialize Firebase Admin App with the project ID to verify tokens cryptographically
if not firebase_admin._apps:
    firebase_admin.initialize_app(options={
        'projectId': 'spanishamigo-8016a'
    })

security = HTTPBearer()

def decode_unverified_token(token: str) -> dict:
    """
    Decodes the payload of a JWT token without verifying its signature.
    Only used in local development to prevent blocking the developer on expired/stale tokens.
    """
    try:
        parts = token.split('.')
        if len(parts) == 3:
            payload_b64 = parts[1]
            # Add base64 padding
            rem = len(payload_b64) % 4
            if rem > 0:
                payload_b64 += '=' * (4 - rem)
            payload_json = base64.urlsafe_b64decode(payload_b64).decode('utf-8')
            return json.loads(payload_json)
    except Exception as e:
        logger.warning(f"Failed to decode unverified token: {e}")
    return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    FastAPI security dependency to verify the Firebase ID token in the Authorization header.
    Returns the decoded token containing user identity details (e.g. 'uid', 'name', 'email').
    Raises a 401 Unauthorized exception if the token is missing, expired, or invalid.
    """
    token = credentials.credentials
    settings = get_settings()
    try:
        # Verify the ID token cryptographically against Google's public certs
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        # Development fallback: decode token payload without signature verification if in development mode
        if settings.ENV == "development":
            logger.info("Firebase verification failed. Attempting unverified payload decode for local development.")
            decoded = decode_unverified_token(token)
            if decoded:
                if "uid" not in decoded and "user_id" in decoded:
                    decoded["uid"] = decoded["user_id"]
                elif "uid" not in decoded and "sub" in decoded:
                    decoded["uid"] = decoded["sub"]
                if "uid" in decoded:
                    return decoded

        # Production error handling
        if isinstance(e, auth.ExpiredIdTokenError):
            logger.warning(f"Firebase token expired: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        elif isinstance(e, auth.InvalidIdTokenError):
            logger.warning(f"Firebase token invalid: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        else:
            logger.error(f"Firebase verification unexpected error: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Authentication failed: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
