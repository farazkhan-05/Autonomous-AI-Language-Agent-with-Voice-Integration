import os
import sys
import time
import unittest
from unittest.mock import MagicMock, patch

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ai import (
    TutorState,
    guardrails_node,
    route_after_guardrails,
    model_manager,
    invoke_with_fallback,
    tutor_node
)
from langchain_core.messages import HumanMessage, AIMessage
from app.models import SystemStatus


class TestSpanishAmigoSecurityAndRAG(unittest.TestCase):

    def setUp(self):
        self.state = {
            "messages": [],
            "user_id": "test-user-123",
            "user_name": "Test Amigo",
            "completed_lessons_count": 5,
            "guardrail_blocked": False,
            "guardrail_reason": None,
            "guardrail_category": None
        }

    def test_greetings_bypass_llm_precheck_single_word(self):
        """Standard single-word conversational greetings should bypass the LLM and pass immediately."""
        self.state["messages"].append(HumanMessage(content="Hola Lumi!"))
        
        result = guardrails_node(self.state)
        
        self.assertFalse(result.get("guardrail_blocked"))
        self.assertEqual(result.get("guardrail_reason"), "Conversational pre-check")
        self.assertEqual(result.get("guardrail_category"), "spanish_learning")

    def test_greetings_bypass_llm_precheck_multi_word(self):
        """Standard multi-word conversational greetings should bypass the LLM and pass immediately."""
        self.state["messages"].append(HumanMessage(content="Buenos dias!"))
        
        result = guardrails_node(self.state)
        
        self.assertFalse(result.get("guardrail_blocked"))
        self.assertEqual(result.get("guardrail_reason"), "Conversational pre-check")
        self.assertEqual(result.get("guardrail_category"), "spanish_learning")

    @patch("app.services.ai.get_model")
    def test_off_topic_blocked(self, mock_get_model):
        """Off-topic inputs like coding questions should be blocked and marked."""
        self.state["messages"].append(HumanMessage(content="Write a Python script to reverse a string."))
        
        # Mock LLM structured response
        mock_structured = MagicMock()
        mock_classification = MagicMock()
        mock_classification.is_safe = False
        mock_classification.category = "off_topic"
        mock_classification.reason = "User is asking for Python coding help, not Spanish."
        
        mock_structured.invoke.return_value = mock_classification
        mock_get_model.return_value.with_structured_output.return_value = mock_structured

        result = guardrails_node(self.state)
        
        self.assertTrue(result.get("guardrail_blocked"))
        self.assertEqual(result.get("guardrail_category"), "off_topic")
        self.assertIn("Python coding help", result.get("guardrail_reason"))

    def test_conditional_routing(self):
        """Routing should check explicit state flags rather than last message type."""
        # Unblocked state
        self.state["guardrail_blocked"] = False
        route = route_after_guardrails(self.state)
        self.assertEqual(route, "tutor")

        # Blocked state
        self.state["guardrail_blocked"] = True
        route = route_after_guardrails(self.state)
        self.assertEqual(route, "save_memory")

    @patch("app.services.ai.SessionLocal")
    def test_database_backed_model_fallback(self, mock_session_local):
        """Model fallback should write state to the database to sync across instances (mocked DB)."""
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        # Initially, no fallback row exists
        mock_db.get.return_value = None

        # Initially active model should be primary
        self.assertEqual(model_manager.get_active_model_name(), model_manager.primary_model)

        # Trigger fallback
        model_manager.trigger_fallback()
        self.assertTrue(mock_db.add.called or mock_db.commit.called)

        # Mock db.get returning active fallback row
        mock_row = MagicMock()
        mock_row.value = str(time.time() + 1800.0)  # active for 30 mins
        mock_db.get.return_value = mock_row

        # Now active model should be backup
        self.assertEqual(model_manager.get_active_model_name(), model_manager.backup_model)

    @patch("app.services.ai.get_model")
    def test_guardrail_edge_case_allowed(self, mock_get_model):
        """Test that translation/vocabulary questions are allowed even if they contain sensitive words."""
        self.state["messages"].append(HumanMessage(content='How do I say "doctor" in Spanish?'))
        
        mock_structured = MagicMock()
        mock_classification = MagicMock()
        mock_classification.is_safe = True
        mock_classification.category = "spanish_learning"
        mock_classification.reason = "User is asking for translation vocabulary."
        
        mock_structured.invoke.return_value = mock_classification
        mock_get_model.return_value.with_structured_output.return_value = mock_structured

        result = guardrails_node(self.state)
        self.assertFalse(result.get("guardrail_blocked"))

    @patch("app.services.ai.get_model")
    def test_guardrail_edge_case_blocked(self, mock_get_model):
        """Test that seeking actual medical advice is blocked."""
        self.state["messages"].append(HumanMessage(content="Should I take medicine for fever?"))
        
        mock_structured = MagicMock()
        mock_classification = MagicMock()
        mock_classification.is_safe = False
        mock_classification.category = "medical_advice"
        mock_classification.reason = "User is asking for actual medical treatment advice."
        
        mock_structured.invoke.return_value = mock_classification
        mock_get_model.return_value.with_structured_output.return_value = mock_structured

        result = guardrails_node(self.state)
        self.assertTrue(result.get("guardrail_blocked"))
        self.assertEqual(result.get("guardrail_category"), "medical_advice")

    @patch("app.services.ai.genai.Client")
    @patch("app.services.ai.SessionLocal")
    @patch("app.services.ai.invoke_with_fallback")
    def test_rag_formatting_query(self, mock_invoke, mock_session_local, mock_client_class):
        """Verify the query sent to Gemini Embedding 2 includes 'task: search result | query:' format."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        
        mock_emb_res = MagicMock()
        mock_emb_val = MagicMock()
        mock_emb_val.values = [0.0] * 768
        mock_emb_res.embeddings = [mock_emb_val]
        mock_client.models.embed_content.return_value = mock_emb_res

        mock_db = MagicMock()
        mock_session_local.return_value = mock_db
        # Return empty list for slide retrieval
        mock_db.execute.return_value.all.return_value = []

        mock_invoke.return_value = AIMessage(content="Test response")

        # Execute tutor_node
        self.state["messages"].append(HumanMessage(content="Hola Lumi"))
        tutor_node(self.state)

        # Assert mock_client.models.embed_content was called
        mock_client.models.embed_content.assert_called_once()
        call_kwargs = mock_client.models.embed_content.call_args[1]
        
        self.assertEqual(call_kwargs["model"], "gemini-embedding-2")
        self.assertIn("task: search result | query:", call_kwargs["contents"])
        self.assertIn("Hola Lumi", call_kwargs["contents"])


if __name__ == "__main__":
    unittest.main()
