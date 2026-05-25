import os
import sys
import unittest

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")
os.environ.setdefault("GEMINI_API_KEY", "test-key")

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import Settings


class TestSettings(unittest.TestCase):
    def test_plain_postgresql_url_uses_psycopg_driver(self):
        settings = Settings(
            DATABASE_URL="postgresql://user:pass@host/db",
            GEMINI_API_KEY="test-key",
        )
        self.assertEqual(settings.sqlalchemy_database_url, "postgresql+psycopg://user:pass@host/db")

    def test_neon_postgres_url_alias_uses_psycopg_driver(self):
        settings = Settings(
            DATABASE_URL="postgres://user:pass@host/db",
            GEMINI_API_KEY="test-key",
        )
        self.assertEqual(settings.sqlalchemy_database_url, "postgresql+psycopg://user:pass@host/db")

    def test_explicit_driver_url_is_unchanged(self):
        settings = Settings(
            DATABASE_URL="postgresql+psycopg://user:pass@host/db",
            GEMINI_API_KEY="test-key",
        )
        self.assertEqual(settings.sqlalchemy_database_url, "postgresql+psycopg://user:pass@host/db")


if __name__ == "__main__":
    unittest.main()
