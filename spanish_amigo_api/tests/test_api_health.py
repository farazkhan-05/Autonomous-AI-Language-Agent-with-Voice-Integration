import os
import sys
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")
os.environ.setdefault("GEMINI_API_KEY", "test-key")

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_db
from main import app


def _override_db():
    return object()


class TestApiHealth(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.dependency_overrides[get_db] = _override_db
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    @patch("main.check_database_health", return_value=(True, ""))
    def test_health_success(self, _mock_health):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["status"], "healthy")
        self.assertEqual(body["database"], "connected")

    @patch("main.check_database_health", return_value=(False, "db down"))
    def test_health_failure(self, _mock_health):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 503)
        body = res.json()
        self.assertEqual(body["status"], "unhealthy")
        self.assertEqual(body["database"], "disconnected")
        self.assertEqual(body["database_error"], "db down")

    def test_request_id_header_is_always_set(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("X-Request-ID", res.headers)

    def test_request_id_is_preserved_when_provided(self):
        req_id = "test-request-id-123"
        res = self.client.get("/", headers={"X-Request-ID": req_id})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("X-Request-ID"), req_id)


if __name__ == "__main__":
    unittest.main()
