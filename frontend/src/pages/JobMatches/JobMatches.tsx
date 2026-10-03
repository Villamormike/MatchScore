import { useState } from 'react'
import './JobMatches.css'

const exampleDescription = 'We are looking for a Frontend Developer with experience building responsive web applications using React, TypeScript, JavaScript, HTML, and CSS. You will collaborate with product designers, contribute to accessible design systems, write tested components, and help improve performance across our application.'

function JobMatches({ onScore }: { onScore: () => void }) {
  const [description, setDescription] = useState('')
  const [selectedResume, setSelectedResume] = useState(0)
  const [showResumeOptions, setShowResumeOptions] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const resumes = [
    { name: 'Alex Mercer – Frontend Dev', template: 'Modern Layout — Single Column', edited: 'Edited 2h ago', summary: 'Detail-oriented Junior Web Developer with a strong foundation in modern frontend architectures. React, TypeScript...', skills: 'React, Next.js, TypeScript, JavaScript, HTML5, CSS3, SQL' },
    { name: 'Alex Mercer – UX Portfolio', template: 'Creative Portfolio — Case Studies', edited: 'Edited yesterday', summary: 'Product-minded designer focused on creating thoughtful digital experiences and scalable design systems.', skills: 'Figma, Prototyping, Design Systems, Research, Accessibility' },
  ]
  const resume = resumes[selectedResume]
  const isReady = description.trim().length >= 150

  return (
    <div className="job-matches-page">
      <section className="page-heading"><div><h1>Score Your Resume</h1><p>Compare your document against any real job description using advanced cosine similarity matching.</p></div></section>
      <div className="job-match-layout">
        <section className="selected-document-column">
          <h2>Selected Document</h2>
          <article className="surface selected-resume-card">
            <div className="resume-card-top"><span className="document-kind">RESUME</span><small>{resume.edited}</small></div>
            <h3>{resume.name}</h3>
            <p className="resume-template-name">{resume.template}</p>
            <div className="resume-card-rule" />
            <span className="eyebrow">SUMMARY</span>
            <p className="resume-summary">{resume.summary}</p>
            <span className="eyebrow">SKILLS INVENTORY</span>
            <p className="resume-skills">{resume.skills}</p>
            <button className="action-button action-outline change-document-button" type="button" onClick={() => setShowResumeOptions(!showResumeOptions)}>{showResumeOptions ? 'Close documents' : '⌁  Change Document'}</button>
            {showResumeOptions && <div className="resume-options">{resumes.map((item, index) => <button key={item.name} className={selectedResume === index ? 'is-current' : ''} type="button" onClick={() => { setSelectedResume(index); setShowResumeOptions(false) }}>{item.name}</button>)}</div>}
          </article>
        </section>
        <section className="job-description-column">
          <div className="job-description-heading"><h2>Paste Job Posting</h2><button className="text-link" type="button" onClick={() => { setDescription(exampleDescription); setAttempted(false) }}>Use example</button></div>
          <div className="surface job-description-card">
            <textarea aria-label="Job description" placeholder="Paste the full job description here (responsibilities, requirements, technical stack)..." value={description} onChange={(event) => { setDescription(event.target.value); setAttempted(false) }} />
            <div className="description-bottom"><small className={attempted && !isReady ? 'length-error' : ''}>{description.trim().length}/150 minimum characters</small><span>Cosine Similarity V2 Algorithm Active</span></div>
            {attempted && !isReady && <p className="description-error" role="alert">Add at least 150 characters to score this resume.</p>}
            <div className="score-button-row"><span className="algorithm-label"><span>◉</span> Cosine Similarity V2 Algorithm Active</span><button className={`action-button action-primary ${!isReady ? 'score-button--waiting' : ''}`} type="button" onClick={() => isReady ? onScore() : setAttempted(true)}>✧ &nbsp; Compute Match Score</button></div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default JobMatches
