import os
import json
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request

import ai_guidance


class TestGeminiKeyRotation(unittest.TestCase):
    def test_groq_request_uses_openai_compatible_response(self):
        response = type(
            "Response",
            (),
            {
                "__enter__": lambda self: self,
                "__exit__": lambda self, *args: None,
                "read": lambda self: b'{"choices":[{"message":{"content":"{\\"ok\\": true}"}}]}',
            },
        )()

        with patch.dict(
            os.environ,
            {"GROQ_API_KEY": "groq-test-key", "GROQ_MODEL": "test-model"},
            clear=True,
        ), patch.object(ai_guidance, "urlopen", return_value=response) as urlopen:
            result = ai_guidance._request_groq_json("test", timeout=1)

        self.assertEqual(result, {"ok": True})
        request = urlopen.call_args.args[0]
        self.assertEqual(request.full_url, "https://api.groq.com/openai/v1/chat/completions")
        self.assertEqual(request.get_header("Authorization"), "Bearer groq-test-key")

    def test_openrouter_request_uses_configured_model(self):
        response = type(
            "Response",
            (),
            {
                "__enter__": lambda self: self,
                "__exit__": lambda self, *args: None,
                "read": lambda self: b'{"choices":[{"message":{"content":"{\\"ok\\": true}"}}]}',
            },
        )()

        with patch.dict(
            os.environ,
            {
                "OPENROUTER_API_KEY": "openrouter-test-key",
                "OPENROUTER_MODEL": "liquid/lfm-3.1-7b:free",
            },
            clear=True,
        ), patch.object(ai_guidance, "urlopen", return_value=response) as urlopen:
            result = ai_guidance._request_openrouter_json("test", timeout=1)

        self.assertEqual(result, {"ok": True})
        request = urlopen.call_args.args[0]
        self.assertEqual(request.full_url, "https://openrouter.ai/api/v1/chat/completions")
        self.assertEqual(request.get_header("Authorization"), "Bearer openrouter-test-key")
        self.assertEqual(
            json.loads(request.data.decode("utf-8"))["model"],
            "liquid/lfm-3.1-7b:free",
        )

    def test_ai_request_falls_back_to_groq(self):
        with patch.object(ai_guidance, "_request_gemini_json", return_value=None), \
                patch.object(ai_guidance, "_request_groq_json", return_value={"provider": "groq"}), \
                patch.object(ai_guidance, "_request_openrouter_json") as openrouter:
            self.assertEqual(
                ai_guidance._request_ai_json("test", timeout=1),
                {"provider": "groq"},
            )
            openrouter.assert_not_called()

    def test_retired_models_are_mapped_to_current_models(self):
        with patch.dict(
            os.environ,
            {
                "GEMINI_MODEL": "gemini-2.5-flash",
                "GEMINI_FALLBACK_MODEL": "gemini-2.5-flash-lite",
            },
            clear=True,
        ), patch.object(
            ai_guidance,
            "_get_gemini_api_keys",
            return_value=["test-key"],
        ):
            self.assertEqual(
                ai_guidance._configured_gemini_models(),
                ["gemini-3.6-flash", "gemini-3.5-flash-lite"],
            )

    def test_key_file_ignores_headings_and_preserves_order(self):
        key_file = """
Main account api keys
Gemini MatchScoreApiKey:
Primary: first-key-with-enough-length
Secondary: first-key-with-enough-length
Next account
Gemini: second-key-with-enough-length
"""
        with patch.object(ai_guidance.Path, "read_text", return_value=key_file), \
                patch.dict(os.environ, {}, clear=True):
            keys = ai_guidance._get_gemini_api_keys()

        self.assertEqual(
            keys,
            ["first-key-with-enough-length", "second-key-with-enough-length"],
        )

    def test_quota_failure_uses_next_key(self):
        responses = [
            HTTPError(
                "https://example.test",
                429,
                "quota exhausted",
                {},
                None,
            ),
            type(
                "Response",
                (),
                {
                    "__enter__": lambda self: self,
                    "__exit__": lambda self, *args: None,
                    "read": lambda self: b'{"candidates":[{"content":{"parts":[{"text":"{\\"ok\\": true}"}]}}]}',
                },
            )(),
        ]

        def fake_urlopen(request: Request, timeout: int):
            result = responses.pop(0)
            if isinstance(result, Exception):
                raise result
            return result

        with patch.object(
            ai_guidance,
            "_get_gemini_api_keys",
            return_value=["first-key-with-enough-length", "second-key-with-enough-length"],
        ), patch.object(ai_guidance, "urlopen", side_effect=fake_urlopen):
            result = ai_guidance._request_gemini_json("test", timeout=1)

        self.assertEqual(result, {"ok": True})
        self.assertEqual(len(responses), 0)

    def test_model_unavailable_uses_next_key(self):
        responses = [
            HTTPError("https://example.test", 503, "model unavailable", {}, None),
            type(
                "Response",
                (),
                {
                    "__enter__": lambda self: self,
                    "__exit__": lambda self, *args: None,
                    "read": lambda self: b'{"candidates":[{"content":{"parts":[{"text":"{\\"ok\\": true}"}]}}]}',
                },
            )(),
        ]

        def fake_urlopen(request: Request, timeout: int):
            result = responses.pop(0)
            if isinstance(result, Exception):
                raise result
            return result

        with patch.object(
            ai_guidance,
            "_get_gemini_api_keys",
            return_value=["first-key-with-enough-length", "second-key-with-enough-length"],
        ), patch.object(ai_guidance, "urlopen", side_effect=fake_urlopen):
            result = ai_guidance._request_gemini_json("test", timeout=1)

        self.assertEqual(result, {"ok": True})
        self.assertEqual(len(responses), 0)


if __name__ == "__main__":
    unittest.main()
