import os
import datetime
import re
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from document_parser import parse_document
from scoring_engine import compute_match
from ai_guidance import generate_ai_guidance, generate_ai_layout, generate_ai_resume_edit, generate_explanation, generate_recommendations

load_dotenv()

app = Flask(__name__)
# Enable CORS for frontend Vite dev server (and any origin in development)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# In-memory history store (pre-populated with initial history for rich UI experience)
scoring_history = [
    {
        "id": "hist-1",
        "date": "Oct 24, 2026",
        "role": "Frontend Developer at TechCorp",
        "job_title": "Frontend Developer",
        "company": "TechCorp Inc.",
        "score": "78%",
        "overall_score": 78,
        "color": "green",
        "version": "Alex Mercer – Frontend Dev",
        "matched_terms": ["React", "JavaScript", "CSS", "HTML", "Git"],
        "missing_terms": ["TypeScript", "GraphQL", "Jest", "CI/CD"],
        "partial_terms": ["Tailwind CSS", "Redux", "REST APIs"],
        "explanation": "Your resume demonstrates highly strong alignment with general Frontend engineering keywords such as React, JavaScript, and CSS. However, your match score is blocked from hitting the high-priority tier because of missing references to TypeScript and testing frameworks like Jest.",
        "recommendations": [
            {
                "section": "WORK EXPERIENCE",
                "title": "Add TypeScript to your apex tech solutions bullets",
                "impact": "+8%",
                "confidence": "High Confidence",
                "reason": "Recruiters searching for junior frontend developers require type safety. Modify bullet #1 to specify your concrete TypeScript load optimization.",
                "suggestion": "Developed modular, type-safe UI components using React and TypeScript, resulting in a 25% improvement in frontend load times."
            },
            {
                "section": "WORK EXPERIENCE",
                "title": "Mention Design System collaboration metrics",
                "impact": "+5%",
                "confidence": "Medium Confidence",
                "reason": "The job listing values team component alignment. Emphasize how you worked with design tokens or design departments.",
                "suggestion": "Collaborative developer integrated directly with design teams to enforce standard component libraries and design tokens across platforms."
            }
        ]
    },
    {
        "id": "hist-2",
        "date": "Oct 21, 2026",
        "role": "Junior Web Developer at Linear",
        "job_title": "Junior Web Developer",
        "company": "Linear",
        "score": "86%",
        "overall_score": 86,
        "color": "green",
        "version": "Alex Mercer – Frontend Dev",
        "matched_terms": ["React", "TypeScript", "Tailwind CSS", "Git"],
        "missing_terms": ["Next.js"],
        "partial_terms": ["CI/CD"],
        "explanation": "Outstanding keyword alignment with modern frontend stack requirements. Direct match on core workflow tools.",
        "recommendations": []
    },
    {
        "id": "hist-3",
        "date": "Oct 18, 2026",
        "role": "Frontend Engineer Intern at Vercel",
        "job_title": "Frontend Engineer Intern",
        "company": "Vercel",
        "score": "64%",
        "overall_score": 64,
        "color": "amber",
        "version": "Alex Mercer – UX Portfolio",
        "matched_terms": ["Figma", "UI/UX Design", "HTML"],
        "missing_terms": ["Next.js", "Edge Functions", "TypeScript"],
        "partial_terms": ["React"],
        "explanation": "Solid design foundation with portfolio work, but engineering requirements require deeper system architecture presence.",
        "recommendations": []
    }
]


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "matchscore-api",
        "timestamp": datetime.datetime.now().isoformat()
    })


@app.post("/api/upload-resume")
def upload_resume():
    """
    Accepts multipart file upload (PDF, DOCX, TXT) or JSON with raw text.
    Extracts text without destroying formatting, paragraph breaks, or bullet points.
    """
    if "file" in request.files:
        uploaded_file = request.files["file"]
        if not uploaded_file or uploaded_file.filename == "":
            return jsonify({"error": "No file selected"}), 400
        
        filename = uploaded_file.filename
        file_bytes = uploaded_file.read()
        
        try:
            parsed = parse_document(file_bytes, filename)
            return jsonify({
                "success": True,
                "data": parsed
            })

        except ValueError as e:
            return jsonify({"error": str(e)}), 422
        except Exception as e:
            return jsonify({
                "error": f"Failed to parse document: {str(e)}"
            }), 500

    # JSON fallback for raw text paste
    data = request.get_json(silent=True) or {}
    raw_text = data.get("text", "")
    filename = data.get("filename", "Pasted_Resume.txt")
    
    if not raw_text.strip():
        return jsonify({"error": "No file or text provided"}), 400
        
    parsed = parse_document(raw_text.encode("utf-8"), filename)
    return jsonify({
        "success": True,
        "data": parsed
    })


@app.post("/api/generate-layout")
def generate_layout():
    data = request.get_json(silent=True) or {}
    prompt = data.get("prompt", "")
    if not isinstance(prompt, str) or not prompt.strip():
        return jsonify({"error": "Describe the layout you want"}), 400

    layout = generate_ai_layout(prompt)
    return jsonify({"success": True, "data": layout})


@app.post("/api/apply-recommendations")
def apply_recommendations():
    data = request.get_json(silent=True) or {}
    resume_text = data.get("resume_text", "")
    resume_html = data.get("resume_html", "")
    recommendations = data.get("recommendations", [])
    job_title = data.get("job_title", "Target Role")

    if not isinstance(resume_text, str) or not resume_text.strip():
        return jsonify({"error": "Resume text is empty or missing"}), 400
    if not isinstance(recommendations, list) or not recommendations:
        return jsonify({"error": "At least one recommendation is required"}), 400

    edited_resume = generate_ai_resume_edit(
        resume_text=resume_text,
        resume_html=resume_html if isinstance(resume_html, str) else "",
        recommendations=recommendations,
        job_title=job_title if isinstance(job_title, str) else "Target Role",
    )
    if edited_resume is None:
        return jsonify({"error": "AI resume improvement is unavailable. Check the configured Gemini, Groq, or OpenRouter provider and try again."}), 503
    return jsonify({"success": True, "data": edited_resume})


def extract_job_metadata(job_text: str, supplied_title: str, supplied_company: str) -> tuple[str, str]:
    """Extract role and company labels from a job post when the form fields are empty."""
    title = supplied_title.strip()
    company = supplied_company.strip()
    lines = [re.sub(r"\s+", " ", line).strip(" -*\t") for line in job_text.splitlines()]
    lines = [line for line in lines if line]

    def labeled_value(labels: str) -> str:
        pattern = rf"^(?:{labels})\s*[:\-]\s*(.+)$"
        for line in lines[:12]:
            match = re.match(pattern, line, re.IGNORECASE)
            if match:
                return match.group(1).strip(" .")
        return ""

    if not title:
        title = labeled_value(r"job title|position|role|hiring for")
    if not company:
        company = labeled_value(r"company|employer|organization")

    for line in lines[:8]:
        if not title or not company:
            match = re.match(r"^(.{3,70}?)\s+(?:at|[@|])\s+(.{2,70})$", line, re.IGNORECASE)
            if match:
                title = title or match.group(1).strip(" -:")
                company = company or match.group(2).strip(" -:")
                break
        if not title or not company:
            match = re.match(r"^(.{3,70}?)\s+-\s+(.{2,70})$", line)
            if match and not re.search(r"\b(remote|hybrid|full[- ]?time|part[- ]?time)\b", line, re.IGNORECASE):
                title = title or match.group(1).strip()
                company = company or match.group(2).strip()
                break

    if not title:
        for line in lines[:8]:
            if 5 <= len(line) <= 70 and not re.search(r"(@|:|\b(company|about|responsibilities|requirements)\b)", line, re.IGNORECASE):
                title = line
                break

    return title or "Target Role", company or "Target Company"


@app.post("/api/score")
def score_match():
    """
    Computes deterministic match between resume and job posting:
    - TF-IDF & Cosine Similarity
    - Matched, Missing, and Partial skill terms
    - Plain-language AI Score Explanation
    - Section-targeted Actionable Recommendations
    """
    data = request.get_json(silent=True) or {}
    resume_text = data.get("resume_text", "")
    job_text = data.get("job_description", "")
    resume_name = data.get("resume_name", "My Resume")
    job_title = data.get("job_title", "")
    company = data.get("company", "")

    if not resume_text.strip():
        return jsonify({"error": "Resume text is empty or missing"}), 400
    if not job_text.strip():
        return jsonify({"error": "Job description is empty or missing"}), 400

    job_title, company = extract_job_metadata(
        job_text,
        job_title if isinstance(job_title, str) else "",
        company if isinstance(company, str) else "",
    )

    # 1. Deterministic Match Computation
    match_result = compute_match(resume_text, job_text)
    overall_score = match_result["overall_score"]
    matched_terms = match_result["matched_terms"]
    missing_terms = match_result["missing_terms"]
    partial_terms = match_result["partial_terms"]

    # 2. AI Guidance Layer
    explanation = generate_explanation(
        score=overall_score,
        matched_terms=matched_terms,
        missing_terms=missing_terms,
        partial_terms=partial_terms,
        job_title=job_title
    )

    recommendations = generate_recommendations(
        matched_terms=matched_terms,
        missing_terms=missing_terms,
        partial_terms=partial_terms
    )

    ai_guidance = generate_ai_guidance(
        resume_text=resume_text,
        job_text=job_text,
        score=overall_score,
        matched_terms=matched_terms,
        missing_terms=missing_terms,
        partial_terms=partial_terms,
        job_title=job_title,
    )
    if ai_guidance:
        explanation = ai_guidance["explanation"]
        recommendations = ai_guidance["recommendations"]

    # 3. Format result
    color = "green" if overall_score >= 75 else ("amber" if overall_score >= 55 else "rose")
    now = datetime.datetime.now()
    timestamp_str = f"Scored Today, {now.strftime('%I:%M %p')}"
    date_str = now.strftime("%b %d, %Y")

    result = {
        "id": f"scan-{int(now.timestamp())}",
        "date": date_str,
        "timestamp": timestamp_str,
        "job_title": job_title,
        "company": company,
        "job_description": job_text,
        "role": f"{job_title} at {company}",
        "score": f"{overall_score}%",
        "overall_score": overall_score,
        "color": color,
        "version": resume_name,
        "explanation": explanation,
        "matched_terms": matched_terms,
        "missing_terms": missing_terms,
        "partial_terms": partial_terms,
        "recommendations": recommendations,
        "ai_guidance_used": ai_guidance is not None,
        "breakdown": match_result["breakdown"]
    }

    # Automatically prepend to scoring history
    scoring_history.insert(0, result)
    if len(scoring_history) > 20:
        scoring_history.pop()

    return jsonify({
        "success": True,
        "data": result
    })


@app.get("/api/history")
def get_history():
    return jsonify({
        "success": True,
        "history": scoring_history
    })


@app.post("/api/history")
def save_history_entry():
    data = request.get_json(silent=True) or {}
    if data:
        scoring_history.insert(0, data)
    return jsonify({"success": True, "count": len(scoring_history)})


if __name__ == "__main__":
    app.run(debug=True, port=5000)