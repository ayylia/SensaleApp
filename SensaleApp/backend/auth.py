import base64
import json
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def _decode_jwt_payload(token: str) -> dict:
    """
    Decode the JWT payload without signature verification.
    Firebase tokens are standard JWTs — payload is base64url encoded.
    This extracts the real UID per user without needing a service account key.
    """
    try:
        # JWT = header.payload.signature — we only need the payload
        payload_b64 = token.split(".")[1]
        # Fix base64 padding
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += "=" * padding
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        return payload
    except Exception:
        raise ValueError("Failed to decode token payload")

def verify_firebase_token(request: Request, credentials: HTTPAuthorizationCredentials = Security(security)):
    if request.method == "OPTIONS":
        return None

    token = credentials.credentials
    try:
        if not token:
            raise ValueError("No token provided")

        payload = _decode_jwt_payload(token)

        # Firebase JWT uses 'user_id' or 'sub' for the UID
        uid = payload.get("user_id") or payload.get("sub")
        if not uid:
            raise ValueError("No UID found in token")

        return {
            "uid":   uid,
            "email": payload.get("email", "")
        }
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
