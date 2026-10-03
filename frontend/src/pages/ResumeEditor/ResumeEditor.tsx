import { useState } from 'react'
import './ResumeEditor.css'
import type { ScreenKey } from '../screenTypes'

const sections = ['Personal Info', 'Professional Summary', 'Work Experience', 'Skills Inventory', 'Education', 'Certifications']
const originalExperience = '• Developed modular UI components using React and TypeScript, resulting in a 25% improvement in load times.\n• Collaborative developer integrated directly with design teams to enforce standard component libraries and design tokens across platforms.'
const optimizedExperience = '• Developed modular, type-safe UI components using React and TypeScript, improving frontend load times by 25%.\n• Collaborated with design teams to standardize reusable component libraries and design tokens across platforms.'
type Props = { onNavigate: (screen: ScreenKey) => void }

function ResumeEditor({ onNavigate }: Props) {
  const [activeSection, setActiveSection] = useState('Work Experience')
  const [fontFamily, setFontFamily] = useState('Plus Jakarta Sans')
  const [fontSize, setFontSize] = useState('11pt')
  const [optimized, setOptimized] = useState(false)
  const [hiddenSections, setHiddenSections] = useState<string[]>([])
  const [experience, setExperience] = useState(originalExperience)

  const toggleSection = (section: string) => {
    setHiddenSections((current) => current.includes(section) ? current.filter((item) => item !== section) : [...current, section])
  }

  const toggleOptimization = () => {
    setExperience(optimized ? originalExperience : optimizedExperience)
    setOptimized(!optimized)
  }

  return (
    <div className="resume-editor-page">
      <div className="editor-toolbar">
        <button className="editor-back" type="button" onClick={() => onNavigate('templates')} aria-label="Back to templates">‹</button>
        <strong>Alex_Mercer_JuniorDev_2026.docx</strong><span className="autosave-status"><i /> Autosaved to Cloud</span>
        <div className="editor-toolbar-actions"><button className="action-button action-outline" type="button" onClick={() => window.print()}>♧ &nbsp; Export PDF</button><button className="action-button action-primary" type="button" onClick={() => onNavigate('jobMatches')}>◉ &nbsp; Score Against Job</button></div>
      </div>
      <div className="editor-workspace">
        <aside className="editor-sections-panel">
          <h2>SECTIONS STRUCTURE</h2>
          {sections.map((section) => <div className={`editor-section-row ${activeSection === section ? 'is-active' : ''}`} key={section}><button type="button" onClick={() => setActiveSection(section)}><span className="drag-handle">⠿</span>{section}</button><button className={`visibility-toggle ${hiddenSections.includes(section) ? 'is-hidden' : ''}`} type="button" aria-label={`${hiddenSections.includes(section) ? 'Show' : 'Hide'} ${section}`} onClick={() => toggleSection(section)}>{hiddenSections.includes(section) ? '◌' : '◉'}</button></div>)}
          <button className="add-section-button" type="button" onClick={() => setActiveSection('Certifications')}>＋ &nbsp; Add New Section</button>
        </aside>
        <section className="resume-canvas" aria-label="Resume preview">
          <article className="resume-paper" style={{ fontFamily: fontFamily === 'Plus Jakarta Sans' ? 'inherit' : fontFamily, fontSize }}>
            {!hiddenSections.includes('Personal Info') && <header className={`paper-personal ${activeSection === 'Personal Info' ? 'paper-section-active' : ''}`} onClick={() => setActiveSection('Personal Info')}><h1>ALEX MERCER</h1><p>Seattle, WA • (555) 019-2831 • alex.mercer@email.com • github.com/alexmercer</p></header>}
            {!hiddenSections.includes('Professional Summary') && <section className={`paper-section ${activeSection === 'Professional Summary' ? 'paper-section-active' : ''}`} onClick={() => setActiveSection('Professional Summary')}><h2>PROFESSIONAL SUMMARY</h2><p>Detail-oriented Junior Web Developer with a strong foundation in modern frontend architectures. Experienced in building responsive interfaces with React, TypeScript, and Tailwind CSS. Passionate about optimization and clean, semantic markup.</p></section>}
            {!hiddenSections.includes('Work Experience') && <section className={`paper-section ${activeSection === 'Work Experience' ? 'paper-section-active' : ''}`} onClick={() => setActiveSection('Work Experience')}><div className="paper-section-title"><h2>WORK EXPERIENCE</h2>{activeSection === 'Work Experience' && <span>EDITING</span>}</div><div className="paper-job-line"><strong>Junior Web Developer — Apex Tech Solutions</strong><span>2024 – Present</span></div><textarea aria-label="Edit work experience" value={experience} onChange={(event) => setExperience(event.target.value)} /></section>}
            {!hiddenSections.includes('Skills Inventory') && <section className={`paper-section ${activeSection === 'Skills Inventory' ? 'paper-section-active' : ''}`} onClick={() => setActiveSection('Skills Inventory')}><h2>SKILLS INVENTORY</h2><p><strong>Languages:</strong> JavaScript, TypeScript, HTML5, CSS3, SQL<br /><strong>Frameworks:</strong> React, Next.js, Tailwind CSS, Node.js, Express</p></section>}
            {!hiddenSections.includes('Education') && <section className={`paper-section paper-compact ${activeSection === 'Education' ? 'paper-section-active' : ''}`} onClick={() => setActiveSection('Education')}><h2>EDUCATION</h2><p><strong>B.S. Computer Science</strong> — University of Washington, 2024</p></section>}
            {!hiddenSections.includes('Certifications') && <section className={`paper-section paper-compact ${activeSection === 'Certifications' ? 'paper-section-active' : ''}`} onClick={() => setActiveSection('Certifications')}><h2>CERTIFICATIONS</h2><p>Responsive Web Design — freeCodeCamp</p></section>}
          </article>
        </section>
        <aside className="editor-format-panel">
          <h2>FORMATTING</h2>
          <label>Font Family<select value={fontFamily} onChange={(event) => setFontFamily(event.target.value)}><option>Plus Jakarta Sans</option><option>Arial</option><option>Georgia</option></select></label>
          <div className="format-controls"><label>Base Size<select value={fontSize} onChange={(event) => setFontSize(event.target.value)}><option>10pt</option><option>11pt</option><option>12pt</option></select></label><label>Margins<select defaultValue="Compact"><option>Compact</option><option>Normal</option><option>Wide</option></select></label></div>
          <div className="editor-ai-card"><h3>✧ AI Recommendation</h3><p>{optimized ? 'Your experience now highlights TypeScript and measurable impact for this role.' : 'We detected “APEX Solutions” contains zero active match keywords overlap against standard web development jobs. Consider adding tags like “REST APIs” or “State Management”.'}</p><button type="button" onClick={toggleOptimization}>{optimized ? 'Undo suggestion' : 'Auto-optimize line'}</button></div>
        </aside>
      </div>
    </div>
  )
}

export default ResumeEditor
