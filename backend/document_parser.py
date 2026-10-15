import io
import re
from typing import Dict, Any, List
import pypdf
import docx

KNOWN_SECTIONS = {
    "summary": [
        "professional summary", "summary", "profile", "objective", 
        "career objective", "about me", "about"
    ],
    "experience": [
        "work experience", "experience", "employment history", 
        "work history", "professional experience", "relevant experience"
    ],
    "skills": [
        "skills inventory", "skills", "technical skills", "core competencies", 
        "technologies", "tech stack", "tools & technologies", "skills & tools"
    ],
    "education": [
        "education", "academic background", "academic history", "qualifications"
    ],
    "projects": [
        "projects", "portfolio", "key projects", "case studies", "selected projects"
    ],
    "certifications": [
        "certifications", "certificates", "licenses & certifications", "credentials"
    ]
}


def clean_text(raw_text: str) -> str:
    """Normalize text while carefully preserving line breaks, bullets, and structure."""
    if not raw_text:
        return ""
    
    # Replace non-breaking spaces and carriage returns
    text = raw_text.replace("\r\n", "\n").replace("\r", "\n").replace("\xa0", " ")
    
    # Standardize bullet symbols while keeping their line positions
    bullet_patterns = [r"^[ \t]*[\u2022\u2023\u25E6\u2043\u2219\u25CB\u25CF\u25AA\u25A0]\s*"]
    lines = []
    for line in text.split("\n"):
        cleaned_line = line.rstrip()
        # Ensure bullet points are neatly standardized
        for pat in bullet_patterns:
            cleaned_line = re.sub(pat, "• ", cleaned_line)
        lines.append(cleaned_line)
        
    # Collapse 3+ empty lines to 2, keeping paragraph separation intact
    result = "\n".join(lines)
    result = re.sub(r"\n{3,}", "\n\n", result).strip()
    return result


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF while preserving layout and line breaks."""
    stream = io.BytesIO(file_bytes)
    reader = pypdf.PdfReader(stream)
    pages_text = []
    
    for page in reader.pages:
        try:
            # Modern pypdf supports extraction_mode="layout" to maintain multi-column and line positions
            page_text = page.extract_text(extraction_mode="layout")
        except Exception:
            page_text = page.extract_text()
        if page_text:
            pages_text.append(page_text)
            
    raw_combined = "\n\n".join(pages_text)
    return clean_text(raw_combined)


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX including paragraphs, headings, bullet lists, and tables."""
    stream = io.BytesIO(file_bytes)
    doc = docx.Document(stream)
    elements_text: List[str] = []
    
    # Extract paragraphs
    for p in doc.paragraphs:
        p_text = p.text.strip()
        if not p_text:
            continue
        
        # Check if style indicates a list/bullet item
        style_name = p.style.name.lower() if p.style else ""
        if "bullet" in style_name or "list" in style_name:
            if not p_text.startswith("•"):
                p_text = f"• {p_text}"
        elements_text.append(p_text)
        
    # Also extract any tables (resumes frequently use tables for two columns)
    for table in doc.tables:
        for row in table.rows:
            row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_cells:
                elements_text.append(" | ".join(row_cells))
                
    raw_combined = "\n".join(elements_text)
    return clean_text(raw_combined)


def extract_text_from_txt(file_bytes: bytes) -> str:
    """Extract plain text handling standard UTF-8 and legacy encodings."""
    for enc in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
        try:
            return clean_text(file_bytes.decode(enc))
        except UnicodeDecodeError:
            continue
    return clean_text(file_bytes.decode("utf-8", errors="ignore"))


def segment_resume_sections(text: str) -> Dict[str, str]:
    """
    Identifies main resume sections without destroying underlying formatting or text.
    Returns a dictionary of section names to their text content.
    """
    lines = text.split("\n")
    sections: Dict[str, List[str]] = {
        "header": [],
        "summary": [],
        "experience": [],
        "skills": [],
        "education": [],
        "projects": [],
        "certifications": [],
        "other": []
    }
    
    current_section = "header"
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if current_section:
                sections[current_section].append("")
            continue
            
        # Check if line looks like a section header
        # Section headers are usually short (under 40 chars), may be uppercase or title case
        cleaned_header_candidate = re.sub(r"[:\-_#*]", "", stripped).strip().lower()
        
        matched_section = None
        for sec_key, patterns in KNOWN_SECTIONS.items():
            if cleaned_header_candidate in patterns or any(
                re.match(rf"^{pat}\b", cleaned_header_candidate) for pat in patterns
            ):
                matched_section = sec_key
                break
                
        if matched_section and len(stripped) < 45:
            current_section = matched_section
            continue
            
        sections[current_section].append(line)
        
    result: Dict[str, str] = {}
    for sec_key, sec_lines in sections.items():
        joined = clean_text("\n".join(sec_lines))
        if joined:
            result[sec_key] = joined
            
    return result


def parse_document(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Main entry point for parsing uploaded documents.
    Preserves text structure and returns structured metadata.
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"
    
    if ext == "pdf":
        extracted_text = extract_text_from_pdf(file_bytes)
    elif ext in ["docx", "doc"]:
        extracted_text = extract_text_from_docx(file_bytes)
    else:
        extracted_text = extract_text_from_txt(file_bytes)
        
    sections = segment_resume_sections(extracted_text)
    words = len(extracted_text.split())
    chars = len(extracted_text)
    
    # Generate concise summary preview
    summary_preview = sections.get("summary") or sections.get("header") or ""
    if len(summary_preview) > 160:
        summary_preview = summary_preview[:157] + "..."
        
    # Extract preview of skills if detected
    skills_preview = sections.get("skills") or ""
    if len(skills_preview) > 120:
        skills_preview = skills_preview[:117] + "..."
        
    return {
        "filename": filename,
        "format": ext.upper(),
        "text": extracted_text,
        "sections": sections,
        "word_count": words,
        "char_count": chars,
        "summary_preview": summary_preview,
        "skills_preview": skills_preview
    }
