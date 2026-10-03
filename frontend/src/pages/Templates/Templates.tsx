import { useState } from 'react'
import './Templates.css'
import type { ScreenKey } from '../screenTypes'

type Props = { onNavigate: (screen: ScreenKey) => void }
type Template = { name: string; type: 'Resume' | 'Portfolio'; detail: string; accent: string }

const templates: Template[] = [
  { name: 'Modern', type: 'Resume', detail: 'Single Column', accent: 'teal' },
  { name: 'Classic', type: 'Resume', detail: 'Traditional Layout', accent: 'blue' },
  { name: 'Minimal', type: 'Resume', detail: 'Clean & Compact', accent: 'gray' },
  { name: 'Creative', type: 'Portfolio', detail: 'Dynamic Structure', accent: 'violet' },
  { name: 'Professional', type: 'Resume', detail: 'Highly Structured', accent: 'navy' },
  { name: 'Two-Column', type: 'Resume', detail: 'Side Navigation', accent: 'mint' },
  { name: 'Executive', type: 'Resume', detail: 'Elegant Traditional', accent: 'sand' },
]

function Templates({ onNavigate }: Props) {
  const [filter, setFilter] = useState<'All Layouts' | 'Resume' | 'Portfolio'>('All Layouts')
  const [generated, setGenerated] = useState(false)
  const visibleTemplates = templates.filter((template) => filter === 'All Layouts' || template.type === filter)

  return (
    <div className="templates-page">
      <section className="page-heading">
        <div><h1>Choose a Template</h1><p>Select from recruiter-approved layouts optimized for cosine similarity metrics.</p></div>
        <div className="template-filters" aria-label="Filter templates">
          {(['All Layouts', 'Resume', 'Portfolio'] as const).map((option) => <button className={filter === option ? 'is-selected' : ''} key={option} type="button" onClick={() => setFilter(option)}>{option}</button>)}
        </div>
      </section>
      <section className="template-grid">
        <button className="surface create-template-card" type="button" onClick={() => onNavigate('blankEditor')}>
          <span className="create-template-icon">＋</span><strong>Make your own template</strong><small>Start with a blank page and design it yourself</small>
        </button>
        <article className="ai-template-card">
          <span className="ai-template-icon">✧</span><h2>{generated ? 'Your layout is ready' : 'AI-Generated Layout'}</h2>
          <p>{generated ? 'A clean resume layout was prepared for your next application.' : 'Custom layout optimized dynamically for your target job description'}</p>
          <button type="button" onClick={() => generated ? onNavigate('resumeEditor') : setGenerated(true)}>{generated ? 'Open Layout' : 'Generate layout'}</button>
        </article>
        {visibleTemplates.map((template) => (
          <article className="surface template-card" key={template.name}>
            <div className={`template-preview template-preview--${template.accent}`} aria-hidden="true">
              <span className="preview-avatar" /><span className="preview-line preview-line--short" /><span className="preview-rule" />
              <span className="preview-columns"><i /><i /></span><span className="preview-columns"><i /><i /></span><span className="preview-columns"><i /><i /></span>
            </div>
            <div className="template-card-footer"><div><strong>{template.name}</strong><small>{template.type} — {template.detail}</small></div><button className="action-button action-primary" type="button" onClick={() => onNavigate('resumeEditor')}>Use Template</button></div>
          </article>
        ))}
      </section>
    </div>
  )
}

export default Templates
