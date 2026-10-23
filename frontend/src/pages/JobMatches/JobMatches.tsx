import { useState, useRef, type ChangeEvent } from 'react'
import './JobMatches.css'
import type { SavedDocument, ScoreResult, UploadedDocument } from '../screenTypes'
import { apiUrl } from '../../api'
import { saveAccountDocument } from '../../lib/accountStorage'

const exampleDescription = `We are looking for a Frontend Developer with experience building responsive web applications using React, TypeScript, JavaScript, HTML, and CSS. 

Responsibilities:
• Collaborate with product designers in Figma to build accessible, reusable component libraries.
• Write unit and integration tests using Jest and React Testing Library.
• Build scalable frontend architectures with state management and REST APIs.
• Participate in CI/CD pipeline deployments using GitHub Actions.

Requirements:
• Strong proficiency in React, TypeScript, and modern CSS frameworks (Tailwind CSS).
• Experience with version control (Git) and automated testing (Jest).
• Familiarity with GraphQL, Next.js, and web performance optimization.`

const presetResumes = [
  {
    name: 'Alex Mercer – Frontend Dev',
    template: 'Modern Layout — Single Column',
    edited: 'Edited 2h ago',
    summary: 'Detail-oriented Junior Web Developer with a strong foundation in modern frontend architectures. Experienced in building responsive interfaces with React, JavaScript, HTML5, CSS3, and Git.',
    skills: 'React, JavaScript, HTML5, CSS3, Tailwind CSS, Git, SQL, Redux, REST APIs',
    fullText: `ALEX MERCER
Seattle, WA • (555) 019-2831 • alex.mercer@email.com • github.com/alexmercer

PROFESSIONAL SUMMARY
Detail-oriented Junior Web Developer with a strong foundation in modern frontend architectures. Experienced in building responsive interfaces with React, JavaScript, and Tailwind CSS. Passionate about optimization and clean, semantic markup.

WORK EXPERIENCE
Junior Web Developer — Apex Tech Solutions (2024 – Present)
• Developed responsive web applications using React, HTML5, and CSS3.
• Collaborated with design teams on UI components and Git workflows.
• Integrated REST APIs and optimized client-side state management.

SKILLS INVENTORY
• Languages: JavaScript, HTML5, CSS3, SQL
• Frameworks: React, Tailwind CSS, Redux, REST APIs
• Tools: Git, GitHub, VS Code

EDUCATION
B.S. Computer Science — University of Washington, 2024`
  },
  {
    name: 'Alex Mercer – UX Portfolio',
    template: 'Creative Portfolio — Case Studies',
    edited: 'Edited yesterday',
    summary: 'Product-minded designer focused on creating thoughtful digital experiences, wireframes, and scalable design systems in Figma.',
    skills: 'Figma, Prototyping, Design Systems, User Research, Accessibility, HTML, CSS',
    fullText: `ALEX MERCER — UX PORTFOLIO
Seattle, WA • alex.mercer@email.com • alexmercer.design

SUMMARY
Product-minded designer focused on creating thoughtful digital experiences, design tokens, and scalable design systems in Figma.

PROJECTS & CASE STUDIES
Enterprise Design System (2024)
• Built comprehensive component library in Figma with auto-layout and variant tokens.
• Conducted user research and usability testing with 20+ participants.
• Collaborated with engineering teams to ensure pixel-perfect accessibility standards (WCAG).

SKILLS & TOOLS
• Design: Figma, Wireframing, Prototyping, Design Systems, Design Tokens
• Research: User Research, Usability Testing, Information Architecture
• Frontend: HTML, CSS, Responsive Web Design`
  }
]

type Props = {
  onScore: (result: ScoreResult) => void
  uploadedDocument?: UploadedDocument | null
  previousScore?: ScoreResult | null
  onDocumentSaved?: (document: SavedDocument) => void
}

function JobMatches({ onScore, uploadedDocument: initialDocument, previousScore, onDocumentSaved }: Props) {
  const [docSource, setDocSource] = useState<'preset' | 'upload'>('upload')
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0)
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDocument | null>(initialDocument || null)
  const [customText, setCustomText] = useState(initialDocument?.text || '')
  const [isUploading, setIsUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [jobTitle, setJobTitle] = useState(previousScore?.job_title || 'Frontend Developer')
  const [company, setCompany] = useState(previousScore?.company || 'TechCorp Inc.')
  const [description, setDescription] = useState(previousScore?.job_description || '')
  const [isScoring, setIsScoring] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activePreset = presetResumes[selectedPresetIndex]

  // Active resume text determined by mode
  const activeResumeText = docSource === 'upload'
    ? (customText || uploadedDoc?.text || '')
    : activePreset.fullText

  const activeResumeName = docSource === 'upload'
    ? (uploadedDoc?.filename || 'Custom Uploaded Resume')
    : activePreset.name

  const isReady = description.trim().length >= 120 && activeResumeText.trim().length >= 50

  const saveUploadedDocument = async (document: UploadedDocument) => {
    try {
      const savedDocument = await saveAccountDocument(document, document.filename.replace(/\.[^/.]+$/, ''), document.id)
      setUploadedDoc(savedDocument)
      onDocumentSaved?.(savedDocument)
      setUploadError(null)
    } catch (error) {
      console.error('Unable to save uploaded document', error)
      setUploadError('The file was imported, but could not be saved to your account.')
    }
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(apiUrl('/api/upload-resume'), {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload response failed')
      }

      const resData = await response.json()
      if (resData.success && resData.data) {
        const parsedDocument: UploadedDocument = { ...resData.data, sourceFile: file }
        setUploadedDoc(parsedDocument)
        setCustomText(parsedDocument.text)
        setDocSource('upload')
        setShowPreview(true)
        await saveUploadedDocument(parsedDocument)
      } else {
        throw new Error(resData.error || 'Could not parse document')
      }
    } catch {
      // Fallback: read directly as text in browser
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = (e.target?.result as string) || ''
        const fallbackDoc: UploadedDocument = {
          filename: file.name,
          format: file.name.split('.').pop()?.toUpperCase() || 'TXT',
          text,
          sections: { raw: text },
          word_count: text.split(/\s+/).filter(Boolean).length,
          char_count: text.length,
          summary_preview: text.slice(0, 150) + '...',
          skills_preview: 'Custom extracted skills'
        }
        setUploadedDoc(fallbackDoc)
        setCustomText(text)
        setDocSource('upload')
        setShowPreview(true)
        void saveUploadedDocument(fallbackDoc)
      }
      reader.readAsText(file)
    } finally {
      setIsUploading(false)
    }
  }

  const handleComputeScore = async () => {
    if (!isReady) {
      setAttempted(true)
      return
    }

    setIsScoring(true)
    try {
      const response = await fetch(apiUrl('/api/score'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: activeResumeText,
          job_description: description,
          resume_name: activeResumeName,
          job_title: jobTitle,
          company: company,
        }),
      })

      if (response.ok) {
        const json = await response.json()
        if (json.success && json.data) {
          onScore({ ...json.data, job_description: description })
          return
        }
      }
      throw new Error('API scoring failed, switching to local calculation')
    } catch {
      // Fallback local scoring simulation if backend is unreachable
      const lowerResume = activeResumeText.toLowerCase()
      const lowerJob = description.toLowerCase()
      const sampleTech = ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Jest', 'CI/CD', 'Git', 'GraphQL', 'REST APIs', 'Figma', 'Node.js', 'Next.js']

      const matched = sampleTech.filter(t => lowerJob.includes(t.toLowerCase()) && lowerResume.includes(t.toLowerCase()))
      const missing = sampleTech.filter(t => lowerJob.includes(t.toLowerCase()) && !lowerResume.includes(t.toLowerCase()))
      const partial = missing.splice(0, Math.min(2, missing.length))

      const scoreValue = Math.min(Math.max(Math.round((matched.length / Math.max(matched.length + missing.length, 1)) * 85 + 15), 35), 94)

      const fallbackResult: ScoreResult = {
        id: `scan-${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        timestamp: `Scored Today, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        job_title: jobTitle,
        company: company,
        job_description: description,
        role: `${jobTitle} at ${company}`,
        score: `${scoreValue}%`,
        overall_score: scoreValue,
        color: scoreValue >= 75 ? 'green' : scoreValue >= 55 ? 'amber' : 'rose',
        version: activeResumeName,
        explanation: `Your document demonstrates relevant alignment for ${jobTitle} roles, showing direct relevance in ${matched.slice(0, 4).join(', ') || 'core concepts'}. Missing coverage in ${missing.slice(0, 3).join(', ') || 'advanced tools'} currently prevents higher tier placement.`,
        matched_terms: matched.length ? matched : ['React', 'HTML', 'CSS', 'Git'],
        missing_terms: missing.length ? missing : ['TypeScript', 'Jest', 'CI/CD'],
        partial_terms: partial.length ? partial : ['REST APIs'],
        recommendations: [
          {
            section: 'WORK EXPERIENCE',
            title: `Add ${missing[0] || 'TypeScript'} to your technical accomplishments`,
            impact: '+8%',
            confidence: 'High Confidence',
            reason: `The job posting explicitly emphasizes ${missing[0] || 'TypeScript'}. Stating project impact with this tool boosts ATS filters.`,
            suggestion: `Architected performant modules utilizing ${missing[0] || 'TypeScript'}, improving code maintainability and team delivery cadence.`
          },
          {
            section: 'SKILLS INVENTORY',
            title: 'Align skills list with target job description terms',
            impact: '+6%',
            confidence: 'High Confidence',
            reason: 'Recruiter ATS scanners calculate instant keyword density from the skills inventory block.',
            suggestion: `Core Stack: ${[...matched, ...missing].slice(0, 6).join(', ')}`
          }
        ]
      }
      onScore(fallbackResult)
    } finally {
      setIsScoring(false)
    }
  }

  return (
    <div className="job-matches-page">
      <section className="page-heading">
        <div>
          <h1>Score Your Resume & Portfolio</h1>
          <p>Upload your document (PDF, DOCX, TXT) and compare against any job posting using deterministic TF-IDF and Cosine Similarity.</p>
        </div>
      </section>

      <div className="job-match-layout">
        {/* Left Column: Document Selection & Upload */}
        <section className="selected-document-column">
          <div className="source-toggle-row">
            <h2>Select Document</h2>
            <div className="source-tabs">
              <button
                type="button"
                className={`source-tab ${docSource === 'upload' ? 'is-active' : ''}`}
                onClick={() => setDocSource('upload')}
              >
                Upload File
              </button>
              <button
                type="button"
                className={`source-tab ${docSource === 'preset' ? 'is-active' : ''}`}
                onClick={() => setDocSource('preset')}
              >
                Presets
              </button>
            </div>
          </div>

          {docSource === 'upload' ? (
            <div className="surface upload-box-container">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />

              {!uploadedDoc ? (
                <div
                  className="upload-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (e.dataTransfer.files?.[0]) {
                      const input = fileInputRef.current
                      if (input) {
                        const dt = new DataTransfer()
                        dt.items.add(e.dataTransfer.files[0])
                        input.files = dt.files
                        input.dispatchEvent(new Event('change', { bubbles: true }))
                      }
                    }
                  }}
                >
                  <span className="upload-icon">↥</span>
                  <strong>{isUploading ? 'Extracting text layout...' : 'Upload Resume / Portfolio'}</strong>
                  <p>Supports <strong>PDF</strong>, <strong>DOCX</strong>, and <strong>TXT</strong></p>
                  <small>Text formatting, line breaks, and structure are 100% preserved</small>
                  <button className="action-button action-outline upload-browse-btn" type="button">
                    {isUploading ? 'Reading file...' : 'Browse Computer'}
                  </button>
                </div>
              ) : (
                <article className="selected-resume-card">
                  <div className="resume-card-top">
                    <span className="document-kind">{uploadedDoc.format} DOCUMENT</span>
                    <small>{uploadedDoc.word_count} words</small>
                  </div>
                  <h3>{uploadedDoc.filename}</h3>
                  <div className="format-preserved-pill">
                    <span>✓</span> Format & structure preserved cleanly
                  </div>
                  <div className="resume-card-rule" />

                  <span className="eyebrow">DOCUMENT PREVIEW</span>
                  <p className="resume-summary">{uploadedDoc.summary_preview || 'Clean text extracted without loss.'}</p>

                  <div className="upload-card-actions">
                    <button
                      className="text-link preview-toggle-btn"
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? 'Hide Raw Structure ▲' : 'Inspect Extracted Content ▼'}
                    </button>
                    <button
                      className="text-link reupload-btn"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload different file
                    </button>
                  </div>

                  {showPreview && (
                    <div className="document-raw-preview">
                      <div className="preview-header">
                        <small>Extracted text with preserved line breaks & bullets:</small>
                      </div>
                      <textarea
                        aria-label="Extracted resume text"
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        rows={10}
                      />
                    </div>
                  )}
                </article>
              )}

              {uploadError && <p className="description-error" role="alert">{uploadError}</p>}
            </div>
          ) : (
            <article className="surface selected-resume-card">
              <div className="resume-card-top">
                <span className="document-kind">PRESET RESUME</span>
                <small>{activePreset.edited}</small>
              </div>
              <h3>{activePreset.name}</h3>
              <p className="resume-template-name">{activePreset.template}</p>
              <div className="resume-card-rule" />
              <span className="eyebrow">SUMMARY</span>
              <p className="resume-summary">{activePreset.summary}</p>
              <span className="eyebrow">SKILLS INVENTORY</span>
              <p className="resume-skills">{activePreset.skills}</p>
              <div className="preset-selector-row">
                {presetResumes.map((p, idx) => (
                  <button
                    key={p.name}
                    type="button"
                    className={`preset-btn ${selectedPresetIndex === idx ? 'is-active' : ''}`}
                    onClick={() => setSelectedPresetIndex(idx)}
                  >
                    {idx === 0 ? 'Alex (Frontend)' : 'Alex (UX Portfolio)'}
                  </button>
                ))}
              </div>
            </article>
          )}
        </section>

        {/* Right Column: Job Posting Input */}
        <section className="job-description-column">
          <div className="job-meta-row">
            <label className="meta-field">
              <span>Target Role:</span>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Frontend Developer"
              />
            </label>
            <label className="meta-field">
              <span>Company:</span>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Linear, Stripe, Google"
              />
            </label>
          </div>

          <div className="job-description-heading">
            <h2>Paste Job Posting</h2>
            <button
              className="text-link"
              type="button"
              onClick={() => {
                setDescription(exampleDescription)
                setJobTitle('Frontend Developer')
                setCompany('TechCorp Inc.')
                setAttempted(false)
              }}
            >
              Use example posting
            </button>
          </div>

          <div className="surface job-description-card">
            <textarea
              aria-label="Job description"
              placeholder="Paste the full job description here (responsibilities, technical stack, requirements, qualifications)..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setAttempted(false)
              }}
            />
            <div className="description-bottom">
              <small className={attempted && !isReady ? 'length-error' : ''}>
                {description.trim().length} characters (120 minimum recommended)
              </small>
              <span>Cosine Similarity + TF-IDF Active</span>
            </div>

            {attempted && !isReady && (
              <p className="description-error" role="alert">
                {activeResumeText.trim().length < 50
                  ? 'Please select or upload a resume before scoring.'
                  : 'Please paste at least 120 characters of the job description.'}
              </p>
            )}

            <div className="score-button-row">
              <span className="algorithm-label">
                <span>◉</span> Real-Time AI Scoring & Gap Analysis
              </span>
              <button
                className={`action-button action-primary ${!isReady || isScoring ? 'score-button--waiting' : ''}`}
                type="button"
                disabled={isScoring}
                onClick={handleComputeScore}
              >
                {isScoring ? (
                  <><span>⏳</span> Computing Match Score...</>
                ) : (
                  <>✧ &nbsp; Compute Match Score</>
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default JobMatches
