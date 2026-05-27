import os
import sys
import unittest
from unittest.mock import MagicMock

from sqlalchemy.exc import IntegrityError

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")
os.environ.setdefault("GEMINI_API_KEY", "test-key")

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.routers.progress import complete_lesson
from app.schemas import ProgressCreate


class TestProgressSync(unittest.TestCase):
    def test_complete_lesson_handles_user_create_race(self):
        db = MagicMock()
        db.get.return_value = None
        db.commit.side_effect = [
            IntegrityError("insert users", {}, Exception("duplicate user")),
            None,
        ]

        result = complete_lesson(
            ProgressCreate(user_id="user-a", lesson_id="1"),
            db=db,
            current_user={"uid": "user-a"},
        )

        self.assertEqual(result.lesson_id, "1")
        db.rollback.assert_called_once()
        self.assertEqual(db.commit.call_count, 2)


if __name__ == "__main__":
    unittest.main()
