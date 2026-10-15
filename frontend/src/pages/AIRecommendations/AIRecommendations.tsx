import { useState } from 'react'
import './AIRecommendations.css'
import type { Recommendation } from '../screenTypes'

const defaultSections = ['Work Experience', 'Skills Inventory', 'Professional Summary', 'Education']

const fallbackRecommendations: Recommendation[] = [
  {
    section: 'WORK EXPERIENCE',
    title: 'Add TypeScript to your apex tech solutions bullets',
    impact: '+8%',
    confidence: 'High Confidence',
    reason: 'Recruiters searching for junior frontend developers require type safety. Modify bullet #1 to specify your concrete TypeScript load optimization.',
    suggestion: 'Developed modular, type-safe UI components using React and TypeScript, resulting in a 25% improvement in frontend load times.'
  },
  {
    section: 'WORK EXPERIENCE',
    title: 'Mention Design System collaboration metrics',
    impact: '+5%',
    confidence: 'Medium Confidence',
    reason: 'The job listing values team component alignment. Emphasize how you worked with design tokens or design departments.',
    suggestion: 'Collaborative developer integrated directly with design teams to enforce standard component libraries and design tokens across platforms.'
  },
  {
    section: 'SKILLS INVENTORY',
    title: 'Update Skills Inventory with target job posting keywords',
    impact: '+6%',
    confidence: 'High Confidence',
    reason: 'Recruiter ATS scanners parse the skills section directly to calculate keyword density scores.',
    suggestion: 'Technical Skills: React, TypeScript, Tailwind CSS, Jest, CI/CD, Git, REST APIs'
  },
  {
    section: 'PROFESSIONAL SUMMARY',
    title: 'Highlight web performance optimization in your summary',
    impact: '+4%',
    confidence: 'Medium Confidence',
    reason: 'Aligning your summary with the employer\'s core mission builds immediate engagement during the initial 6-second recruiter review.',
    suggestion: 'Results-driven frontend developer dedicated to architecting clean, maintainable, and high-performance digital solutions with React and TypeScript.'
  }
]

type Props = {
  recommendations?: Recommendation[]
}

function AIRecommendations({ recommendations }: Props) {
  const activeRecs = (recommendations && recommendations.length > 0)
    ? recommendations
    : fallbackRecommendations

  const [selectedSection, setSelectedSection] = useState(defaultSections[0])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [applied, setApplied] = useState<string[]>([])

  const getSectionCount = (sectionName: string) => {
    return activeRecs.filter(
      (r) => !dismissed.includes(r.title) && r.section.toLowerCase() === sectionName.toLowerCase()
    ).length
  }

  const visibleRecommendations = activeRecs.filter(
    (recommendation) =>
      !dismissed.includes(recommendation.title) &&
      (recommendation.section.toLowerCase() === selectedSection.toLowerCase())
  )

  return (
    <div className="recommendations-page">
      <section className="page-heading recommendations-heading">
        <div>
          <h1>Improvement Recommendations & Feedback</h1>
        </div>
        <span className="ai-note">✧ AI recommendations tailored directly to your target job</span>
      </section>
      <div className="recommendations-layout">
        <aside className="surface resume-sections-card">
          <span className="eyebrow">RESUME SECTIONS</span>
          {defaultSections.map((section) => {
            const count = getSectionCount(section)
            return (
              <button
                className={selectedSection === section ? 'is-active' : ''}
                key={section}
                type="button"
                onClick={() => setSelectedSection(section)}
              >
                <span>{section}</span>
                {count > 0 && <small>{count}</small>}
              </button>
            )
          })}
        </aside>

        <section className="recommendation-list" aria-label="Recommendations">
          {visibleRecommendations.length === 0 ? (
            <div className="surface empty-recommendations">
              <span>✧</span>
              <strong>You're all caught up</strong>
              <p>No open recommendations for {selectedSection.toLowerCase()} right now.</p>
            </div>
          ) : (
            visibleRecommendations.map((recommendation) => (
              <article className="surface recommendation-card" key={recommendation.title}>
                <div className="recommendation-card-top">
                  <div>
                    <span className="recommendation-category">{recommendation.section}</span>
                    <span className="impact-label">Impact Score Increase: {recommendation.impact}</span>
                  </div>
                  <span className="confidence-label">◴ &nbsp;{recommendation.confidence}</span>
                </div>
                <h2>{recommendation.title}</h2>
                <p className="recommendation-reason">{recommendation.reason}</p>
                <div className="suggested-rephrase">
                  <span>SUGGESTED REPHRASE</span>
                  <p>• {recommendation.suggestion}</p>
                </div>
                <div className="recommendation-actions">
                  {applied.includes(recommendation.title) ? (
                    <span className="applied-label">✓ Applied to resume</span>
                  ) : (
                    <>
                      <button
                        className="action-button action-outline"
                        type="button"
                        onClick={() => setDismissed((current) => [...current, recommendation.title])}
                      >
                        Dismiss
                      </button>
                      <button
                        className="action-button action-primary"
                        type="button"
                        onClick={() => setApplied((current) => [...current, recommendation.title])}
                      >
                        Apply Edit
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  )
}

export default AIRecommendations
