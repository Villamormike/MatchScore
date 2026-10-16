import io
import re
import base64
import html
from typing import Dict, Any, List
import pypdf
import docx
from docx.enum.text import WD_ALIGN_PARAGRAPH

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


def _docx_run_html(run: Any, image_lookup: Dict[str, str], text_override: str | None = None) -> str:
    """Convert a DOCX run into editable HTML while retaining common formatting."""
    text = html.escape(run.text if text_override is None else text_override).replace("\n", "<br>")
    if not text:
        return ""
    if run.bold:
        text = f"<strong>{text}</strong>"
    if run.italic:
        text = f"<em>{text}</em>"
    if run.underline:
        text = f"<u>{text}</u>"
    if run.font.strike:
        text = f"<s>{text}</s>"
    styles = []
    if run.font.name:
        styles.append(f"font-family:{html.escape(run.font.name)}")
    if run.font.size:
        styles.append(f"font-size:{run.font.size.pt:g}pt")
    if run.font.color and run.font.color.rgb:
        styles.append(f"color:#{run.font.color.rgb}")
    if run.font.highlight_color:
        styles.append("background-color:#fff59d")
    if styles:
        text = f'<span style="{";".join(styles)}">{text}</span>'
    return text


def docx_to_html(file_bytes: bytes) -> Dict[str, Any]:
    """Convert common DOCX layout features to editable, self-contained HTML."""
    document = docx.Document(io.BytesIO(file_bytes))
    relationships = document.part.rels
    image_lookup: Dict[str, str] = {}
    for relationship in relationships.values():
        if "image" not in relationship.reltype:
            continue
        image_part = relationship.target_part
        content_type = image_part.content_type
        encoded = base64.b64encode(image_part.blob).decode("ascii")
        image_lookup[relationship.rId] = f"data:{content_type};base64,{encoded}"

    def paragraph_html(paragraph: Any) -> str:
        has_tab = any("\t" in (run.text or "") for run in paragraph.runs)
        if has_tab:
            columns: List[str] = [""]
            for run in paragraph.runs:
                run_parts = (run.text or "").split("\t")
                for index, run_part in enumerate(run_parts):
                    if run_part:
                        columns[-1] += _docx_run_html(run, image_lookup, run_part)
                    if index < len(run_parts) - 1:
                        columns.append("")
            content = (
                '<div class="docx-tab-row">'
                + "".join(f'<div class="docx-tab-cell">{column or "<br>"}</div>' for column in columns)
                + "</div>"
            )
        else:
            content = "".join(_docx_run_html(run, image_lookup) for run in paragraph.runs)
        for drawing in paragraph._p.xpath(".//a:blip/@r:embed"):
            if drawing in image_lookup:
                content += f'<img src="{image_lookup[drawing]}" alt="Document image">'
        if not content:
            content = "<br>"
        style = []
        paragraph_style = paragraph.style
        if paragraph_style and paragraph_style.font:
            if paragraph_style.font.name:
                style.append(f"font-family:{html.escape(paragraph_style.font.name)}")
            if paragraph_style.font.size:
                style.append(f"font-size:{paragraph_style.font.size.pt:g}pt")
            if paragraph_style.font.color and paragraph_style.font.color.rgb:
                style.append(f"color:#{paragraph_style.font.color.rgb}")
            if paragraph_style.font.bold:
                style.append("font-weight:700")
            if paragraph_style.font.italic:
                style.append("font-style:italic")
        if paragraph.alignment == WD_ALIGN_PARAGRAPH.CENTER:
            style.append("text-align:center")
        elif paragraph.alignment == WD_ALIGN_PARAGRAPH.RIGHT:
            style.append("text-align:right")
        elif paragraph.alignment == WD_ALIGN_PARAGRAPH.JUSTIFY:
            style.append("text-align:justify")
        if paragraph.paragraph_format.space_after:
            style.append(f"margin-bottom:{paragraph.paragraph_format.space_after.pt:g}pt")
        if paragraph.paragraph_format.space_before:
            style.append(f"margin-top:{paragraph.paragraph_format.space_before.pt:g}pt")
        if paragraph.paragraph_format.line_spacing:
            spacing = paragraph.paragraph_format.line_spacing
            style.append(f"line-height:{spacing.pt:g}pt" if hasattr(spacing, "pt") else f"line-height:{spacing}")
        if paragraph.paragraph_format.left_indent and not has_tab:
            style.append(f"margin-left:{paragraph.paragraph_format.left_indent.pt:g}pt")
        if paragraph.paragraph_format.right_indent and not has_tab:
            style.append(f"margin-right:{paragraph.paragraph_format.right_indent.pt:g}pt")
        if paragraph.paragraph_format.first_line_indent and not has_tab:
            style.append(f"text-indent:{paragraph.paragraph_format.first_line_indent.pt:g}pt")
        if paragraph.paragraph_format.keep_with_next:
            style.append("break-after:avoid")
        style_attr = f' style="{";".join(style)}"' if style else ""
        return f"<p{style_attr}>{content}</p>"

    blocks: List[str] = [paragraph_html(paragraph) for paragraph in document.paragraphs]
    for table in document.tables:
        rows = []
        for row in table.rows:
            cells = []
            for cell in row.cells:
                cell_html = "".join(paragraph_html(paragraph) for paragraph in cell.paragraphs)
                cells.append(f"<td>{cell_html}</td>")
            rows.append(f"<tr>{''.join(cells)}</tr>")
        blocks.append(f'<table style="border-collapse:collapse;width:100%"><tbody>{"".join(rows)}</tbody></table>')
    section = document.sections[0]
    page_style = {
        "width": f"{section.page_width.pt:g}pt",
        "minHeight": f"{section.page_height.pt:g}pt",
        "paddingTop": f"{section.top_margin.pt:g}pt",
        "paddingRight": f"{section.right_margin.pt:g}pt",
        "paddingBottom": f"{section.bottom_margin.pt:g}pt",
        "paddingLeft": f"{section.left_margin.pt:g}pt",
    }
    return {"html": "".join(blocks), "page_style": page_style}


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
    
    formatted_html = ""
    formatted_document: Dict[str, Any] = {}
    if ext == "pdf":
        extracted_text = extract_text_from_pdf(file_bytes)
    elif ext in ["docx", "doc"]:
        extracted_text = extract_text_from_docx(file_bytes)
        if ext == "docx":
            formatted_document = docx_to_html(file_bytes)
            formatted_html = formatted_document["html"]
        else:
            formatted_document = {}
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
        "html": formatted_html,
        "page_style": formatted_document.get("page_style", {}),
        "sections": sections,
        "word_count": words,
        "char_count": chars,
        "summary_preview": summary_preview,
        "skills_preview": skills_preview
    }
