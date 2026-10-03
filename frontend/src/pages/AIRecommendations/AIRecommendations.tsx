import { useState } from 'react'
import './AIRecommendations.css'

const sections = ['Work Experience', 'Skills Inventory', 'Professional Summary', 'Education']
const recommendations = [
  { section: 'WORK EXPERIENCE', title: 'Add TypeScript to your apex tech solutions bullets', impact: '+8%', confidence: 'High Confidence', reason: 'Recruiters searching for junior frontend developers require type safety. Modify bullet #1 to specify your concrete TypeScript load optimization.', suggestion: 'Developed modular, type-safe UI components using React and TypeScript, resulting in a 25% improvement in frontend load times.' },
  { section: 'WORK EXPERIENCE', title: 'Mention Design System collaboration metrics', impact: '+5%', confidence: 'Medium Confidence', reason: 'The job listing values team component alignment. Emphasize how you worked with design tokens or design departments.', suggestion: 'Collaborative developer integrated directly with design teams to enforce standard component libraries and design tokens across platforms.' },
]

function AIRecommendations() {
  const [selectedSection, setSelectedSection] = useState(sections[0])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [applied, setApplied] = useState<string[]>([])
  const visibleRecommendations = recommendations.filter((recommendation) => !dismissed.includes(recommendation.title) && (selectedSection === 'Work Experience' || recommendation.section.toLowerCase() === selectedSection.toLowerCase()))

  return (
    <div className="recommendations-page">
      <section className="page-heading recommendations-heading"><div><h1>Improvement Recommendations</h1></div><span className="ai-note">✧ AI recommendations only rephrase existing content</span></section>
      <div className="recommendations-layout">
        <aside className="surface resume-sections-card">
          <span className="eyebrow">RESUME SECTIONS</span>
          {sections.map((section, index) => <button className={selectedSection === section ? 'is-active' : ''} key={section} type="button" onClick={() => setSelectedSection(section)}><span>{section}</span>{index < 2 && <small>{index === 0 ? 2 : 1}</small>}</button>)}
        </aside>
        <section className="recommendation-list" aria-label="Recommendations">
          {visibleRecommendations.length === 0 ? <div className="surface empty-recommendations"><span>✧</span><strong>You're all caught up</strong><p>No recommendations for {selectedSection.toLowerCase()} right now.</p></div> : visibleRecommendations.map((recommendation) => (
            <article className="surface recommendation-card" key={recommendation.title}>
              <div className="recommendation-card-top"><div><span className="recommendation-category">{recommendation.section}</span><span className="impact-label">Impact Score Increase: {recommendation.impact}</span></div><span className="confidence-label">◴ &nbsp;{recommendation.confidence}</span></div>
              <h2>{recommendation.title}</h2>
              <p className="recommendation-reason">{recommendation.reason}</p>
              <div className="suggested-rephrase"><span>SUGGESTED REPHRASE</span><p>• {recommendation.suggestion}</p></div>
              <div className="recommendation-actions">{applied.includes(recommendation.title) ? <span className="applied-label">✓ Applied to resume</span> : <><button className="action-button action-outline" type="button" onClick={() => setDismissed((current) => [...current, recommendation.title])}>Dismiss</button><button className="action-button action-primary" type="button" onClick={() => setApplied((current) => [...current, recommendation.title])}>Apply Edit</button></>}</div>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}

export default AIRecommendations
