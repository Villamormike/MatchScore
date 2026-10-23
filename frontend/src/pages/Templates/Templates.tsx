import { useState } from 'react'
import './Templates.css'
import type { UploadedDocument } from '../screenTypes'
import { apiUrl } from '../../api'

type Props = {
  onGenerateLayout: (document: UploadedDocument) => void
}
type Template = { name: string; type: 'Resume' | 'Portfolio'; detail: string; accent: string }

const templates: Template[] = [
  { name: 'Classic', type: 'Resume', detail: 'Traditional Layout', accent: 'blue' },
  { name: 'Minimal', type: 'Resume', detail: 'Clean & Compact', accent: 'gray' },
  { name: 'Professional', type: 'Resume', detail: 'Highly Structured', accent: 'navy' },
]

const templateContent: Record<string, { text: string; html: string }> = {
  Classic: {
    text: `YOUR NAME
Professional Title | email@example.com | Location

PROFESSIONAL SUMMARY
Experienced professional focused on delivering thoughtful, measurable results.

WORK EXPERIENCE
Job Title — Company Name
• Improved team workflows and delivered high-quality projects.
• Collaborated with cross-functional teams.

EDUCATION
Degree — University Name`,
    html: `<div class="resume-classic"><h1>YOUR NAME</h1><p>Professional Title | email@example.com | Location</p><hr><h2>PROFESSIONAL SUMMARY</h2><p>Experienced professional focused on delivering thoughtful, measurable results.</p><h2>WORK EXPERIENCE</h2><h3>Job Title — Company Name</h3><ul><li>Improved team workflows and delivered high-quality projects.</li><li>Collaborated with cross-functional teams.</li></ul><h2>EDUCATION</h2><p>Degree — University Name</p></div>`,
  },
  Minimal: {
    text: `YOUR NAME
Product Designer | email@example.com

PROFILE
Clear, concise summary of your professional strengths and goals.

EXPERIENCE
Senior Role · Company
Created simple solutions with measurable impact.

Previous Role · Company
Led projects from concept through delivery.`,
    html: `<div class="resume-minimal"><h1>YOUR NAME</h1><p>Product Designer | email@example.com</p><hr><h2>PROFILE</h2><p>Clear, concise summary of your professional strengths and goals.</p><h2>EXPERIENCE</h2><h3>Senior Role · Company</h3><p>Created simple solutions with measurable impact.</p><h3>Previous Role · Company</h3><p>Led projects from concept through delivery.</p></div>`,
  },
  Professional: {
    text: `YOUR NAME
CONTACT
email@example.com
+63 900 000 0000
Cebu City

SKILLS
Leadership
Project Management
Communication

PROFESSIONAL PROFILE
Strategic professional with a strong record of delivering high-impact work.

EXPERIENCE
Job Title — Company
• Led initiatives and improved business outcomes.
• Managed priorities and stakeholder communication.

EDUCATION
Degree · University Name`,
    html: `<div class="resume-professional"><aside><h1>YOUR<br>NAME</h1><h2>CONTACT</h2><p>email@example.com<br>+63 900 000 0000<br>Cebu City</p><h2>SKILLS</h2><p>Leadership<br>Project Management<br>Communication</p></aside><main><h2>PROFESSIONAL PROFILE</h2><p>Strategic professional with a strong record of delivering high-impact work.</p><h2>EXPERIENCE</h2><h3>Job Title — Company</h3><ul><li>Led initiatives and improved business outcomes.</li><li>Managed priorities and stakeholder communication.</li></ul><h2>EDUCATION</h2><p>Degree · University Name</p></main></div>`,
  },
}

const defaultTemplate: UploadedDocument = {
  filename: 'MatchScore_Default_Resume.html',
  format: 'HTML',
  text: `YOUR NAME
Professional title | email@example.com | phone | LinkedIn | Location

PROFESSIONAL SUMMARY
Write a concise summary that connects your strongest experience to the target role.

SKILLS
Add relevant technical skills, tools, certifications, and domain expertise.

WORK EXPERIENCE
Job Title — Company Name | Date – Present
• Describe an achievement, the action you took, and the measurable result.
• Highlight tools and responsibilities that match the target role.

PROJECTS
Project Name | Technologies
• Explain the problem, your contribution, and the outcome.

EDUCATION
Degree — School Name | Graduation Year`,
  html: `<h1>YOUR NAME</h1>
<p><strong>Professional title</strong> | email@example.com | phone | LinkedIn | Location</p>
<hr>
<h2>PROFESSIONAL SUMMARY</h2>
<p>Write a concise summary that connects your strongest experience to the target role.</p>
<h2>SKILLS</h2>
<p>Add relevant technical skills, tools, certifications, and domain expertise.</p>
<h2>WORK EXPERIENCE</h2>
<h3>Job Title — Company Name <span>| Date – Present</span></h3>
<ul><li>Describe an achievement, the action you took, and the measurable result.</li><li>Highlight tools and responsibilities that match the target role.</li></ul>
<h2>PROJECTS</h2>
<h3>Project Name <span>| Technologies</span></h3>
<ul><li>Explain the problem, your contribution, and the outcome.</li></ul>
<h2>EDUCATION</h2>
<p>Degree — School Name | Graduation Year</p>`,
  sections: {},
  word_count: 75,
  char_count: 600,
  summary_preview: 'Default MatchScore resume template.',
  skills_preview: 'Add relevant technical skills and tools.',
}

function createTemplateDocument(template: Template): UploadedDocument {
  const content = templateContent[template.name]
  return {
    filename: `MatchScore_${template.name}_Resume.html`,
    format: 'HTML',
    text: content.text,
    html: content.html,
    sections: {},
    word_count: content.text.split(/\s+/).filter(Boolean).length,
    char_count: content.text.length,
    summary_preview: `${template.name} resume template.`,
    skills_preview: '',
  }
}

function Templates({ onGenerateLayout }: Props) {
  const [filter, setFilter] = useState<'All Layouts' | 'Resume'>('All Layouts')
  const [isGenerating, setIsGenerating] = useState(false)
  const [layoutPrompt, setLayoutPrompt] = useState('')
  const [promptOpen, setPromptOpen] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const visibleTemplates = templates.filter((template) => filter === 'All Layouts' || template.type === filter)

  const generateLayout = async () => {
    if (!layoutPrompt.trim()) {
      setGenerationError('Describe the resume layout you want.')
      return
    }
    setIsGenerating(true)
    setGenerationError('')
    try {
      const response = await fetch(apiUrl('/api/generate-layout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: layoutPrompt }),
      })
      const result = await response.json()
      if (!response.ok || !result.success || !result.data?.html || !result.data?.text) {
        throw new Error(result.error || 'The AI layout could not be generated.')
      }
      const { title, text, html } = result.data
      onGenerateLayout({
        filename: `${title || 'AI_Generated_Resume'}.html`,
        format: 'HTML',
        text,
        html,
        sections: {},
        word_count: text.split(/\s+/).filter(Boolean).length,
        char_count: text.length,
        summary_preview: text.slice(0, 150),
        skills_preview: '',
      })
      setPromptOpen(false)
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'The AI layout could not be generated.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="templates-page">
      <section className="page-heading">
        <div><h1>Choose a Template</h1><p>Select from recruiter-approved layouts optimized for cosine similarity metrics.</p></div>
        <div className="template-filters" aria-label="Filter templates">
          {(['All Layouts', 'Resume'] as const).map((option) => <button className={filter === option ? 'is-selected' : ''} key={option} type="button" onClick={() => setFilter(option)}>{option}</button>)}
        </div>
      </section>
      <section className="template-grid">
        <button className="surface create-template-card" type="button" onClick={() => onGenerateLayout(defaultTemplate)}>
          <span className="create-template-icon">＋</span><strong>Create Custom Template</strong><small>Build your own structure from scratch</small>
        </button>
        <article className="ai-template-card">
          <span className="ai-template-icon">✧</span><h2>AI-Generated Layout</h2>
          <p>Describe the role and visual style, then AI will create an editable layout for you.</p>
          <button type="button" onClick={() => setPromptOpen(true)} disabled={isGenerating}>Generate layout</button>
        </article>
        {visibleTemplates.map((template) => (
          <article className="surface template-card" key={template.name}>
            <div className={`template-preview template-preview--${template.accent} template-preview--${template.name.toLowerCase()}`} aria-hidden="true">
              {template.name === 'Classic' && <>
                <div className="resume-thumb resume-thumb--classic">
                  <strong>YOUR NAME</strong><small>Professional Title · email@example.com · Location</small><hr />
                  <b>PROFESSIONAL SUMMARY</b><p>Experienced professional focused on delivering thoughtful, measurable results.</p>
                  <b>WORK EXPERIENCE</b><h4>Job Title — Company Name</h4><p>• Improved team workflows and delivered high-quality projects.</p><p>• Collaborated with cross-functional teams.</p>
                  <b>EDUCATION</b><p>Degree — University Name</p>
                </div>
              </>}
              {template.name === 'Minimal' && <>
                <div className="resume-thumb resume-thumb--minimal">
                  <strong>YOUR NAME</strong><small>Product Designer · email@example.com</small><hr />
                  <b>PROFILE</b><p>Clear, concise summary of your professional strengths and goals.</p>
                  <b>EXPERIENCE</b><h4>Senior Role · Company</h4><p>Created simple solutions with measurable impact.</p><h4>Previous Role · Company</h4><p>Led projects from concept through delivery.</p>
                </div>
              </>}
              {template.name === 'Professional' && <>
                <div className="resume-thumb resume-thumb--professional">
                  <aside><strong>YOUR<br />NAME</strong><b>CONTACT</b><small>email@example.com<br />+63 900 000 0000<br />Cebu City</small><b>SKILLS</b><small>Leadership<br />Project Management<br />Communication</small></aside>
                  <main><h3>PROFESSIONAL PROFILE</h3><p>Strategic professional with a strong record of delivering high-impact work.</p><h3>EXPERIENCE</h3><h4>Job Title — Company</h4><p>• Led initiatives and improved business outcomes.</p><p>• Managed priorities and stakeholder communication.</p><h3>EDUCATION</h3><p>Degree · University Name</p></main>
                </div>
              </>}
            </div>
            <div className="template-card-footer"><div><strong>{template.name}</strong><small>{template.type} — {template.detail}</small></div><button className="action-button action-primary" type="button" onClick={() => onGenerateLayout(createTemplateDocument(template))}>Use Template</button></div>
          </article>
        ))}
      </section>
      {promptOpen && <div className="layout-prompt-backdrop" role="presentation">
        <form className="layout-prompt-dialog" onSubmit={(event) => { event.preventDefault(); void generateLayout() }}>
          <h2>Describe your layout</h2>
          <p>Tell AI what role, sections, style, and layout you want. It will create an editable template without inventing your experience.</p>
          <textarea
            autoFocus
            value={layoutPrompt}
            onChange={(event) => setLayoutPrompt(event.target.value)}
            placeholder="Example: Create a clean two-column resume for a junior frontend developer. Put skills and tools in a narrow left column, with experience and projects on the right."
            rows={6}
          />
          {generationError && <p className="layout-prompt-error" role="alert">{generationError}</p>}
          <div className="layout-prompt-actions">
            <button type="button" onClick={() => setPromptOpen(false)}>Cancel</button>
            <button className="action-button action-primary" type="submit" disabled={isGenerating}>{isGenerating ? 'Generating...' : 'Generate with AI'}</button>
          </div>
        </form>
      </div>}
    </div>
  )
}

export default Templates
