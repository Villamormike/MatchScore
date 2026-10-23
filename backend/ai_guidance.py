import json
import logging
import re
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

import os
from typing import Dict, Any, List

# Template templates for actionable suggestions by skill domain
SKILL_SUGGESTIONS = {
    "TypeScript": {
        "section": "WORK EXPERIENCE",
        "title": "Incorporate TypeScript into your frontend project bullets",
        "impact": "+8%",
        "confidence": "High Confidence",
        "reason": "Recruiters screening for modern frontend roles prioritize type safety. Adding concrete TypeScript mentions proves production reliability.",
        "suggestion": "Engineered scalable, type-safe frontend components using React and TypeScript, reducing client-side runtime errors by 30%."
    },
    "Jest": {
        "section": "WORK EXPERIENCE",
        "title": "Highlight automated unit testing with Jest",
        "impact": "+7%",
        "confidence": "High Confidence",
        "reason": "The job description emphasizes testing quality. Demonstrating test coverage elevates you above applicants who only write UI code.",
        "suggestion": "Authored comprehensive unit and integration test suites using Jest and React Testing Library, achieving 85%+ code coverage across critical user flows."
    },
    "CI/CD": {
        "section": "WORK EXPERIENCE",
        "title": "Mention continuous integration and deployment pipelines",
        "impact": "+6%",
        "confidence": "Medium Confidence",
        "reason": "Engineering teams value developers who understand deployment lifecycle automation beyond local development.",
        "suggestion": "Configured CI/CD deployment pipelines using GitHub Actions to automate linting, test execution, and preview builds on every pull request."
    },
    "GraphQL": {
        "section": "WORK EXPERIENCE",
        "title": "Detail GraphQL query integration and data fetching",
        "impact": "+5%",
        "confidence": "Medium Confidence",
        "reason": "The posting specifies GraphQL for client-server communication. Highlighting schema queries proves practical API fluency.",
        "suggestion": "Implemented performant GraphQL queries and cache management with Apollo Client, eliminating over-fetching and decreasing payload sizes."
    },
    "Tailwind CSS": {
        "section": "SKILLS INVENTORY",
        "title": "Group modern CSS utility frameworks in your skills inventory",
        "impact": "+4%",
        "confidence": "High Confidence",
        "reason": "Rapid UI styling with Tailwind CSS is explicitly listed as a desired asset in the job posting requirements.",
        "suggestion": "Frameworks: Tailwind CSS, CSS Modules, Responsive Web Design, Flexbox/Grid"
    },
    "Design Systems": {
        "section": "WORK EXPERIENCE",
        "title": "Emphasize collaboration with Design Systems and Figma",
        "impact": "+6%",
        "confidence": "High Confidence",
        "reason": "The role values alignment between product design and engineering. Mentioning component tokens shows cross-functional maturity.",
        "suggestion": "Collaborated closely with product designers in Figma to architect standard reusable UI component libraries and design tokens across platforms."
    },
    "REST APIs": {
        "section": "WORK EXPERIENCE",
        "title": "Specify asynchronous RESTful API consumption",
        "impact": "+5%",
        "confidence": "High Confidence",
        "reason": "Job requires connecting client interfaces to backend microservices. Explicitly noting API handling establishes full-stack readiness.",
        "suggestion": "Integrated asynchronous REST APIs and error-boundary handlers to deliver seamless data synchronization and resilient offline states."
    },
    "Docker": {
        "section": "WORK EXPERIENCE",
        "title": "Add containerization workflows with Docker",
        "impact": "+6%",
        "confidence": "Medium Confidence",
        "reason": "Containerization is required for consistent development and deployment environments in this team's workflow.",
        "suggestion": "Standardized local and staging development workflows using Docker containers, ensuring parity across team environments."
    },
    "Performance Optimization": {
        "section": "PROFESSIONAL SUMMARY",
        "title": "Highlight web vitals and performance optimization in your summary",
        "impact": "+5%",
        "confidence": "High Confidence",
        "reason": "The job description places strong emphasis on responsive, fast-loading user experiences.",
        "suggestion": "Performance-focused developer specializing in responsive interfaces, Core Web Vitals optimization, and clean component architectures."
    }

    }

logger = logging.getLogger(__name__)


def _fallback_ai_layout(prompt: str) -> Dict[str, str]:
    """Return a usable editable layout when the external model is unavailable."""
    requested_style = prompt.strip().split(".", 1)[0][:80] or "Custom resume"
    text = f"""YOUR NAME
Professional title | email@example.com | phone | LinkedIn | Location

PROFESSIONAL SUMMARY
Add a concise summary tailored to your target role.

SKILLS
Add skills, tools, certifications, and technologies relevant to the role.

WORK EXPERIENCE
Job Title — Company Name | Dates
• Describe an achievement, the action you took, and the measurable result.
• Add responsibilities and tools relevant to the target role.

PROJECTS
Project Name | Technologies
• Explain the problem, your contribution, and the outcome.

EDUCATION
Degree — School Name | Graduation Year"""
    html = f"""<h1>YOUR NAME</h1>
<p><strong>Professional title</strong> | email@example.com | phone | LinkedIn | Location</p>
<hr><h2>PROFESSIONAL SUMMARY</h2>
<p>Add a concise summary tailored to your target role.</p>
<h2>SKILLS</h2><p>Add skills, tools, certifications, and technologies relevant to the role.</p>
<h2>WORK EXPERIENCE</h2><h3>Job Title — Company Name <span>| Dates</span></h3>
<ul><li>Describe an achievement, the action you took, and the measurable result.</li>
<li>Add responsibilities and tools relevant to the target role.</li></ul>
<h2>PROJECTS</h2><h3>Project Name <span>| Technologies</span></h3>
<ul><li>Explain the problem, your contribution, and the outcome.</li></ul>
<h2>EDUCATION</h2><p>Degree — School Name | Graduation Year</p>"""
    return {"title": requested_style, "text": text, "html": html}


def _get_gemini_api_key() -> str:
    """Read the provider key from the environment or the local key file."""
    configured_key = os.getenv("GEMINI_API_KEY", "").strip()
    if configured_key:
        return configured_key

    key_path = Path(__file__).with_name("api_key")
    try:
        key_value = key_path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return ""
    except OSError as exc:
        logger.warning("Unable to read Gemini API key file: %s", exc)
        return ""

    if ":" in key_value:
        key_value = key_value.split(":", 1)[1].strip()
    return key_value


def _parse_json_response(text: str) -> Dict[str, Any]:
    """Parse JSON returned by the model, including fenced JSON responses."""
    cleaned = text.strip()
    fenced_match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, re.DOTALL | re.IGNORECASE)
    if fenced_match:
        cleaned = fenced_match.group(1).strip()
    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise ValueError("Gemini response must be a JSON object")
    return parsed


def _request_gemini_json(prompt: str, timeout: int) -> Dict[str, Any] | None:
    """Request JSON from Gemini with bounded generation and transient retries."""
    api_key = _get_gemini_api_key()
    if not api_key:
        return None

    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json",
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }).encode("utf-8")

    configured_model = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview").strip()
    configured_fallback = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.6-flash").strip()
    models = list(dict.fromkeys(model for model in (configured_model, configured_fallback) if model))

    for model in models:
        endpoint = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{quote(model, safe='')}:generateContent"
        )
        try:
            request = Request(
                f"{endpoint}?key={quote(api_key)}",
                data=body,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urlopen(request, timeout=timeout) as response:
                response_data = json.loads(response.read().decode("utf-8"))
            model_text = response_data["candidates"][0]["content"]["parts"][0]["text"]
            return _parse_json_response(model_text)
        except HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            logger.warning("Gemini model %s returned HTTP %s: %s", model, exc.code, error_body[:300])
            continue
        except (URLError, TimeoutError, KeyError, IndexError, TypeError, ValueError) as exc:
            logger.warning("Gemini model %s failed: %s", model, exc)
            continue
    return None


def _validate_ai_guidance(payload: Dict[str, Any]) -> Dict[str, Any]:
    explanation = payload.get("explanation")
    recommendations = payload.get("recommendations")
    if not isinstance(explanation, str) or not explanation.strip():
        raise ValueError("Gemini response is missing an explanation")
    if not isinstance(recommendations, list):
        raise ValueError("Gemini response is missing recommendations")

    normalized_recommendations: List[Dict[str, str]] = []
    for recommendation in recommendations[:6]:
        if not isinstance(recommendation, dict):
            continue
        fields = ("section", "title", "impact", "confidence", "reason", "suggestion")
        if not all(isinstance(recommendation.get(field), str) for field in fields):
            continue
        normalized_recommendations.append({
            field: recommendation[field].strip() for field in fields
        })

    if not normalized_recommendations:
        raise ValueError("Gemini response contains no valid recommendations")
    return {
        "explanation": explanation.strip(),
        "recommendations": normalized_recommendations,
    }


def generate_ai_guidance(
    resume_text: str,
    job_text: str,
    score: int,
    matched_terms: List[str],
    missing_terms: List[str],
    partial_terms: List[str],
    job_title: str,
) -> Dict[str, Any] | None:
    """Ask Gemini for tailored guidance, returning None when it cannot be used."""
    api_key = _get_gemini_api_key()
    if not api_key:
        return None

    prompt = f"""
You are a resume and hiring expert. Analyze the resume against the job posting.
The numeric match score is calculated by a separate deterministic engine and must
not be changed: {score}/100.

Return ONLY valid JSON with this exact shape:
{{
  "explanation": "A concise, evidence-based explanation of the score.",
  "recommendations": [
    {{
      "section": "WORK EXPERIENCE|SKILLS INVENTORY|PROFESSIONAL SUMMARY|EDUCATION",
      "title": "Short actionable title",
      "impact": "+N%",
      "confidence": "High Confidence|Medium Confidence|Low Confidence",
      "reason": "Why this change helps this application",
      "suggestion": "A truthful example edit; never invent experience or metrics"
    }}
  ]
}}

Provide 2 to 6 recommendations. Use only information supported by the resume.
Role: {job_title}
Matched terms: {", ".join(matched_terms) or "None"}
Missing terms: {", ".join(missing_terms) or "None"}
Partial terms: {", ".join(partial_terms) or "None"}

RESUME:
{resume_text[:12000]}

JOB POSTING:
{job_text[:12000]}
"""
    response = _request_gemini_json(prompt, timeout=45)
    if response is None:
        logger.warning("Gemini guidance unavailable; using deterministic guidance")
        return None
    try:
        return _validate_ai_guidance(response)
    except ValueError as exc:
        logger.warning("Gemini guidance response was invalid; using deterministic guidance: %s", exc)
        return None


def generate_ai_layout(prompt: str) -> Dict[str, str] | None:
    """Generate an editable resume layout from a user's design request."""
    api_key = _get_gemini_api_key()
    if not api_key:
        logger.warning("Gemini layout unavailable; using local layout fallback because no API key is configured")
        return _fallback_ai_layout(prompt)

    layout_prompt = f"""
Create an editable resume layout based on this request:
{prompt[:4000]}

Return ONLY valid JSON with this exact shape:
{{
  "title": "A short document title",
  "text": "Plain text version with clear section line breaks",
  "html": "Self-contained editable HTML using only h1, h2, h3, p, ul, ol, li, strong, em, hr, and span elements"
}}

Use placeholders where the user has not supplied personal information. Do not
invent employment history, education, metrics, or skills. Make the layout
professional, readable, and appropriate for the requested role or style.
"""
    response = _request_gemini_json(layout_prompt, timeout=45)
    if response is None:
        logger.warning("Gemini layout unavailable; using local layout fallback")
        return _fallback_ai_layout(prompt)
    title = response.get("title")
    text = response.get("text")
    html = response.get("html")
    if not all(isinstance(value, str) and value.strip() for value in (title, text, html)):
        logger.warning("Gemini layout response was incomplete; using local layout fallback")
        return _fallback_ai_layout(prompt)
    return {"title": title.strip(), "text": text.strip(), "html": html.strip()}


def generate_explanation(
    score: int,
    matched_terms: List[str],
    missing_terms: List[str],
    partial_terms: List[str],
    job_title: str = "Target Role"
) -> str:
    """Generates an insightful, human-readable AI score explanation."""
    matched_str = ", ".join(matched_terms[:5]) if matched_terms else "core technical competencies"
    missing_str = ", ".join(missing_terms[:4]) if missing_terms else None
    partial_str = ", ".join(partial_terms[:3]) if partial_terms else None

    if score >= 80:
        tier_text = f"demonstrates exceptionally strong alignment for {job_title} positions"
        action_text = "With minor keyword additions and test coverage emphasis, this resume is in prime shape for interview shortlists."
    elif score >= 65:
        tier_text = f"demonstrates solid foundational alignment for {job_title} positions"
        action_text = "Your match score is currently in the competitive tier, but closing key missing requirements will boost you into top priority."
    else:
        tier_text = f"shows emerging potential for {job_title} requirements"
        action_text = "To pass automated recruiter filters, prioritizing the high-impact missing skills below will significantly raise your match percentage."

    explanation = (
        f"Your document {tier_text}, showing strong relevance in {matched_str}. "
    )

    if missing_str:
        explanation += (
            f"However, your match score is prevented from reaching the top tier due to unverified references to {missing_str}. "
        )

    if partial_str:
        explanation += (
            f"You have related background corresponding to {partial_str}, which our algorithm credited as partial matches. "
        )

    explanation += action_text
    return explanation


def generate_recommendations(
    matched_terms: List[str],
    missing_terms: List[str],
    partial_terms: List[str],
    resume_sections: Dict[str, str] = None
) -> List[Dict[str, Any]]:
    """
    Generates section-by-section actionable improvement suggestions.
    Guarantees recommendations for Work Experience, Skills, and Summary.
    """
    recommendations: List[Dict[str, Any]] = []
    applied_skills = set()

    # Priority 1: Missing critical terms
    for term in missing_terms:
        if term in SKILL_SUGGESTIONS and term not in applied_skills:
            recommendations.append(SKILL_SUGGESTIONS[term])
            applied_skills.add(term)

    # Priority 2: Partial match terms (turn partial into full direct matches!)
    for term in partial_terms:
        if term in SKILL_SUGGESTIONS and term not in applied_skills:
            rec = dict(SKILL_SUGGESTIONS[term])
            rec["title"] = f"Explicitly specify {term} to convert partial match to direct match"
            rec["reason"] = f"Our engine detected related background, but explicitly naming {term} ensures 100% keyword match."
            recommendations.append(rec)
            applied_skills.add(term)

    # Generic high-value recommendations if specific matches were limited
    for term in missing_terms:
        if term not in applied_skills and len(recommendations) < 4:
            recommendations.append({
                "section": "WORK EXPERIENCE",
                "title": f"Integrate {term} into recent project achievements",
                "impact": "+5%",
                "confidence": "High Confidence",
                "reason": f"The job posting explicitly requires {term}. Linking this tool with quantifiable outcomes will elevate ATS scoring.",
                "suggestion": f"Leveraged {term} to optimize workflow delivery and enhance feature reliability across core application modules."
            })
            applied_skills.add(term)

    # Always ensure at least one recommendation for Professional Summary and Skills Inventory
    has_skills_rec = any(r["section"] == "SKILLS INVENTORY" for r in recommendations)
    if not has_skills_rec and (missing_terms or partial_terms):
        missing_sample = ", ".join((missing_terms + partial_terms)[:4])
        recommendations.append({
            "section": "SKILLS INVENTORY",
            "title": "Update Skills Inventory with target job posting keywords",
            "impact": "+6%",
            "confidence": "High Confidence",
            "reason": "Recruiter ATS scanners parse the skills section directly to calculate keyword density scores.",
            "suggestion": f"Technical Skills: {missing_sample}"
        })

    has_summary_rec = any(r["section"] == "PROFESSIONAL SUMMARY" for r in recommendations)
    if not has_summary_rec:
        recommendations.append({
            "section": "PROFESSIONAL SUMMARY",
            "title": "Tailor professional summary to emphasize role-specific impact",
            "impact": "+4%",
            "confidence": "Medium Confidence",
            "reason": "Aligning your summary with the employer's core mission builds immediate engagement during the initial 6-second recruiter review.",
            "suggestion": "Results-driven developer dedicated to architecting clean, maintainable, and high-performance digital solutions."
        })

    return recommendations[:6]
