import os
import io
from app import app

def test_full_flow():
    client = app.test_client()
    
    # 1. Health Check
    health_res = client.get("/api/health")
    assert health_res.status_code == 200, "Health check failed"
    print("✓ Health check OK")
    
    # 2. Upload Document Test (PDF parsing with layout preservation)
    pdf_path = "../SPMP_MatchScore_Group1_VillamorUpdate.pdf"
    if os.path.exists(pdf_path):
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()
        
        data = {
            "file": (io.BytesIO(pdf_bytes), "SPMP_Document.pdf")
        }
        upload_res = client.post("/api/upload-resume", data=data, content_type="multipart/form-data")
        assert upload_res.status_code == 200, f"Upload PDF failed: {upload_res.text}"
        upload_data = upload_res.get_json()["data"]
        print(f"✓ Upload PDF OK: {upload_data['filename']} ({upload_data['word_count']} words, format {upload_data['format']})")
        assert upload_data["word_count"] > 1000, "Extracted words should be > 1000"
        assert "\n" in upload_data["text"], "Format line breaks should be preserved"
    else:
        print("Note: SPMP PDF not found at path, skipping PDF upload step")

    # 3. Test Real Scoring Engine & AI Guidance
    sample_candidate_resume = """
JOHN DOE — SENIOR FRONTEND DEVELOPER
Seattle, WA • (555) 123-4567 • john.doe@email.com • github.com/johndoe

PROFESSIONAL SUMMARY
Experienced Frontend Engineer with 4+ years architecting performant web applications using React, JavaScript, HTML5, CSS3, and Tailwind CSS. Strong advocate for component reuse, clean state management, and accessible user experiences.

WORK EXPERIENCE
Frontend Engineer — CloudWave Software (2022 - Present)
• Built scalable single-page web applications using React, Redux, and Tailwind CSS.
• Developed REST APIs integration layers with resilient error handling.
• Mentored junior engineers and led code reviews using Git and GitHub workflows.

SKILLS INVENTORY
• Languages: JavaScript, HTML5, CSS3, SQL
• Frameworks: React, Tailwind CSS, Redux, REST APIs
• Tools: Git, GitHub, Vite, Figma
"""

    sample_job_posting = """
Senior Frontend Engineer at Stripe
We are looking for a Senior Frontend Engineer to build robust developer dashboards.

Responsibilities:
• Develop responsive web interfaces using React and TypeScript.
• Build and maintain reusable component libraries in Figma and Storybook.
• Implement automated unit and integration tests with Jest and React Testing Library.
• Manage automated deployment pipelines using CI/CD and Docker.

Requirements:
• 3+ years experience with React, TypeScript, HTML5, CSS3.
• Demonstrated proficiency with Jest, Git, and REST APIs.
• Familiarity with Next.js, CI/CD, and web performance optimization.
"""

    score_res = client.post("/api/score", json={
        "resume_text": sample_candidate_resume,
        "job_description": sample_job_posting,
        "resume_name": "John Doe – Senior Frontend Developer",
        "job_title": "Senior Frontend Engineer",
        "company": "Stripe"
    })

    assert score_res.status_code == 200, f"Score call failed: {score_res.text}"
    score_data = score_res.get_json()["data"]
    print(f"\n--- SCORING RESULTS ---")
    print(f"Role: {score_data['role']}")
    print(f"Computed Score: {score_data['score']}")
    print(f"Matched Terms ({len(score_data['matched_terms'])}): {score_data['matched_terms']}")
    print(f"Missing Terms ({len(score_data['missing_terms'])}): {score_data['missing_terms']}")
    print(f"Partial Matches ({len(score_data['partial_terms'])}): {score_data['partial_terms']}")
    print(f"\nAI Score Explanation:\n{score_data['explanation']}")
    print(f"\nAI Recommendations Generated ({len(score_data['recommendations'])}):")
    for idx, rec in enumerate(score_data['recommendations'], 1):
        print(f"  {idx}. [{rec['section']}] {rec['title']} (Impact: {rec['impact']})")
        print(f"     Reason: {rec['reason']}")
        print(f"     Rephrase: {rec['suggestion']}\n")

    # 4. Verify History Endpoint
    history_res = client.get("/api/history")
    assert history_res.status_code == 200
    hist_items = history_res.get_json()["history"]
    assert len(hist_items) > 0
    assert hist_items[0]["role"] == "Senior Frontend Engineer at Stripe"
    print(f"✓ History updated correctly (total {len(hist_items)} items)")
    print("\n✓ ALL END-TO-END VERIFICATION CHECKS PASSED!")

if __name__ == "__main__":
    test_full_flow()
