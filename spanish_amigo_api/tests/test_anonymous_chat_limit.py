import os
import sys
import unittest
from unittest.mock import MagicMock

from fastapi import HTTPException

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")
os.environ.setdefault("GEMINI_API_KEY", "test-key")

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.routers.chat import _consume_anonymous_global_chat_message


class TestAnonymousChatLimit(unittest.TestCase):
    def test_allows_first_three_anonymous_messages(self):
        db = MagicMock()
        usage_row = MagicMock()
        usage_row.value = "2"
        db.get.return_value = usage_row
        current_user = {"firebase": {"sign_in_provider": "anonymous"}}

        _consume_anonymous_global_chat_message(db, "anon-user", current_user)

        self.assertEqual(usage_row.value, "3")
        db.commit.assert_called_once()

    def test_blocks_fourth_anonymous_message(self):
        db = MagicMock()
        usage_row = MagicMock()
        usage_row.value = "3"
        db.get.return_value = usage_row
        current_user = {"firebase": {"sign_in_provider": "anonymous"}}

        with self.assertRaises(HTTPException) as exc_info:
            _consume_anonymous_global_chat_message(db, "anon-user", current_user)

        self.assertEqual(exc_info.exception.status_code, 403)
        self.assertEqual(exc_info.exception.detail["code"], "ANONYMOUS_CHAT_LIMIT_REACHED")
        db.commit.assert_not_called()

    def test_does_not_limit_google_users(self):
        db = MagicMock()
        current_user = {"firebase": {"sign_in_provider": "google.com"}}

        _consume_anonymous_global_chat_message(db, "google-user", current_user)

        db.get.assert_not_called()
        db.commit.assert_not_called()


if __name__ == "__main__":
    unittest.main()
