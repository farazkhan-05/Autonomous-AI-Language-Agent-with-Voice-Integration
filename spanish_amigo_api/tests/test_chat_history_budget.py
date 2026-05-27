import os
import sys
import unittest
from types import SimpleNamespace

from langchain_core.messages import AIMessage, HumanMessage

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")
os.environ.setdefault("GEMINI_API_KEY", "test-key")

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.routers.chat import MAX_HISTORY_CHARS, _build_history_messages_with_budget


class TestChatHistoryBudget(unittest.TestCase):
    def test_history_budget_keeps_newest_messages_in_chronological_order(self):
        newest_first_history = [
            SimpleNamespace(role="assistant", content="new assistant"),
            SimpleNamespace(role="user", content="new user"),
            SimpleNamespace(role="assistant", content="x" * MAX_HISTORY_CHARS),
        ]

        history_messages = _build_history_messages_with_budget(newest_first_history)

        self.assertEqual(len(history_messages), 2)
        self.assertIsInstance(history_messages[0], HumanMessage)
        self.assertEqual(history_messages[0].content, "new user")
        self.assertIsInstance(history_messages[1], AIMessage)
        self.assertEqual(history_messages[1].content, "new assistant")

    def test_history_budget_drops_oversized_newest_message(self):
        newest_first_history = [
            SimpleNamespace(role="user", content="x" * (MAX_HISTORY_CHARS + 1)),
            SimpleNamespace(role="assistant", content="older assistant"),
        ]

        self.assertEqual(_build_history_messages_with_budget(newest_first_history), [])


if __name__ == "__main__":
    unittest.main()
