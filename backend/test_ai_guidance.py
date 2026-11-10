import os
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request

import ai_guidance


class TestGeminiKeyRotation(unittest.TestCase):
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
