import firebase_admin
from firebase_admin import auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Initialize Firebase Admin App with the project ID to verify tokens cryptographically
if not firebase_admin._apps:
    firebase_admin.initialize_app(options={
        'projectId': 'spanishamigo-8016a'
    })

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    FastAPI security dependency to verify the Firebase ID token in the Authorization header.
    Returns the decoded token containing user identity details (e.g. 'uid', 'name', 'email').
    Raises a 401 Unauthorized exception if the token is missing, expired, or invalid.
    """
    token = credentials.credentials
    try:
        # Verify the ID token cryptographically against Google's public certs
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
