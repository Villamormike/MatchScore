import './MatchResults.css'
import type { CSSProperties } from 'react'
import type { ScreenKey, ScoreResult } from '../screenTypes'

type Props = {
  result?: ScoreResult | null
  onNavigate: (screen: ScreenKey) => void
}

const defaultResult: ScoreResult = {
  id: 'default-1',
  date: 'Today',
  timestamp: 'Scored Today, 10:42 AM',
  job_title: 'Frontend Developer',
  company: 'TechCorp Inc.',
  role: 'Frontend Developer at TechCorp Inc.',
  score: '78%',
  overall_score: 78,
  color: 'green',
  version: 'Alex Mercer – Frontend Dev',
  explanation: 'Your resume demonstrates highly strong alignment with general Frontend engineering keywords such as React, JavaScript, and CSS. However, your match score is blocked from hitting the high-priority tier because of missing references to TypeScript and testing frameworks like Jest. The similarity index indicates your work experience phrasing has improved substantially since your last attempt.',
  matched_terms: ['React', 'JavaScript', 'CSS', 'HTML', 'Git'],
  missing_terms: ['TypeScript', 'GraphQL', 'Jest', 'CI/CD'],
  partial_terms: ['Tailwind CSS', 'Redux', 'REST APIs'],
  recommendations: []
}

function MatchResults({ result, onNavigate }: Props) {
  const current = result || defaultResult
  const scoreNum = Math.min(Math.max(current.overall_score || 78, 0), 100)
  const color = current.color || (scoreNum >= 75 ? 'green' : scoreNum >= 55 ? 'amber' : 'rose')
  const gaugeHex = color === 'green' ? '#0e9c8e' : (color === 'amber' ? '#d97706' : '#e11d48')

  const gaugeStyle: CSSProperties = {
    background: `conic-gradient(${gaugeHex} 0% ${scoreNum}%, #e2e8f0 ${scoreNum}% 100%)`
  }

  return (
    <div className="match-results-page">
      <section className="page-heading result-heading">
        <div>
          <h1>{current.job_title}</h1>
          <p>{current.company} &nbsp;·&nbsp; {current.timestamp} &nbsp;·&nbsp; <small>Document: {current.version}</small></p>
        </div>
        <div className="result-actions">
          <button className="action-button action-outline" type="button" onClick={() => onNavigate('jobMatches')}>
            ↻ &nbsp; Re-score
          </button>
          <button className="action-button action-outline" type="button" onClick={() => onNavigate('scoreHistory')}>
            ▣ &nbsp; Score History
          </button>
          <button className="action-button action-primary" type="button" onClick={() => onNavigate('recommendations')}>
            ✧ &nbsp; View Recommendations
          </button>
        </div>
      </section>

      <section className="surface result-summary-card">
        <div className={`score-gauge score-gauge--${color}`} style={gaugeStyle}>
          <div className="score-gauge-inner">
            <strong style={{ color: gaugeHex }}>{current.score || `${scoreNum}%`}</strong>
            <span>Match Score</span>
          </div>
        </div>
        <div className="score-explanation">
          <div className="explanation-header">
            <span className="explanation-label">
              ✧ &nbsp; {current.ai_guidance_used === false ? 'Score Explanation & Breakdown' : 'AI Score Explanation & Breakdown'}
            </span>
            <span className={`match-pill match-pill--${color}`}>
              {scoreNum >= 75 ? 'Strong Alignment' : scoreNum >= 55 ? 'Moderate Alignment' : 'Needs Optimization'}
            </span>
          </div>
          <p>{current.explanation}</p>
        </div>
      </section>

      <section className="keyword-groups" aria-label="Matched and missing keywords">
        <article className="surface keyword-card">
          <div className="keyword-card-heading">
            <h2>Matched Terms</h2>
            <span className="match-pill match-pill--green">{current.matched_terms.length} Keywords</span>
          </div>
          <div className="keyword-list keyword-list--green">
            {current.matched_terms.length === 0 ? (
              <span className="no-terms-note">No direct keyword matches found.</span>
            ) : (
              current.matched_terms.map((term) => <span key={term}>✓ {term}</span>)
            )}
          </div>
        </article>

        <article className="surface keyword-card">
          <div className="keyword-card-heading">
            <h2>Missing Terms</h2>
            <span className="match-pill match-pill--amber">{current.missing_terms.length} Keywords</span>
          </div>
          <div className="keyword-list keyword-list--amber">
            {current.missing_terms.length === 0 ? (
              <span className="no-terms-note">No critical missing keywords! All required terms present.</span>
            ) : (
              current.missing_terms.map((term) => <span key={term}>✕ {term}</span>)
            )}
          </div>
        </article>

        <article className="surface keyword-card">
          <div className="keyword-card-heading">
            <h2>Partial Matches</h2>
            <span className="match-pill match-pill--teal">{current.partial_terms.length} Keywords</span>
          </div>
          <div className="keyword-list keyword-list--teal">
            {current.partial_terms.length === 0 ? (
              <span className="no-terms-note">No partial skill overlaps detected.</span>
            ) : (
              current.partial_terms.map((term) => <span key={term}>◐ {term}</span>)
            )}
          </div>
        </article>
      </section>
    </div>
  )
}

export default MatchResults
