import unittest
from app import app
import json

class TestMatchScoreAPI(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "ok")

    def test_upload_text_resume(self):
        sample_resume = """
ALEX MERCER
Seattle, WA • alex.mercer@email.com

PROFESSIONAL SUMMARY
Detail-oriented Junior Web Developer experienced in building responsive interfaces with React, JavaScript, HTML, and CSS.

WORK EXPERIENCE
Junior Web Developer — Apex Tech Solutions (2024 - Present)
• Developed responsive web applications using React, HTML5, and CSS3.
• Collaborated with design teams on UI components and Git workflows.

SKILLS INVENTORY
JavaScript, React, HTML5, CSS3, Git, SQL
"""
        res = self.client.post("/api/upload-resume", json={"text": sample_resume, "filename": "alex_resume.txt"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("React", data["data"]["text"])
        self.assertIn("summary", data["data"]["sections"])
        self.assertIn("experience", data["data"]["sections"])
        self.assertIn("skills", data["data"]["sections"])

    def test_scoring_and_recommendations(self):
        resume = "Experienced in React, JavaScript, HTML, CSS, Git, Tailwind CSS."
        job = "Seeking Frontend Developer with React, TypeScript, Jest, CI/CD, CSS, HTML."
        res = self.client.post("/api/score", json={
            "resume_text": resume,
            "job_description": job,
            "resume_name": "Alex Mercer – Frontend Dev",
            "job_title": "Frontend Developer",
            "company": "TechCorp"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]
        self.assertIn("overall_score", data)
        self.assertGreater(data["overall_score"], 0)
        self.assertIn("matched_terms", data)
        self.assertIn("missing_terms", data)
        self.assertIn("explanation", data)
        self.assertIn("recommendations", data)
        self.assertIn("React", data["matched_terms"])
        self.assertIn("Jest", data["missing_terms"])
        print("\nTest Score Result:")
        print("Score:", data["score"])
        print("Matched:", data["matched_terms"])
        print("Missing:", data["missing_terms"])
        print("Partial:", data["partial_terms"])
        print("Explanation:", data["explanation"])
        print("Recommendations count:", len(data["recommendations"]))

if __name__ == "__main__":
    unittest.main()
