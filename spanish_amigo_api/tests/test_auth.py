import os
import sys
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")
os.environ.setdefault("GEMINI_API_KEY", "test-key")

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services import auth as auth_service


class TestAuthVerification(unittest.TestCase):
    def test_dev_insecure_token_flags_still_require_firebase_verification(self):
        forged_token = "header.eyJ1aWQiOiAiYXR0YWNrZXIifQ.signature"
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=forged_token)

        with patch.object(auth_service.settings, "ENV", "development"), patch.object(
            auth_service.settings,
            "AUTH_ALLOW_INSECURE_DEV_TOKENS",
            True,
        ), patch.object(
            auth_service.auth,
            "verify_id_token",
            side_effect=ValueError("invalid signature"),
        ) as mock_verify:
            with self.assertRaises(HTTPException) as exc:
                auth_service.get_current_user(credentials)

        mock_verify.assert_called_once_with(forged_token)
        self.assertEqual(exc.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()
