import './MatchResults.css'
import type { ScreenKey } from '../screenTypes'

type Props = { onNavigate: (screen: ScreenKey) => void }

function MatchResults({ onNavigate }: Props) {
  return (
    <div className="match-results-page">
      <section className="page-heading result-heading">
        <div><h1>Frontend Developer</h1><p>TechCorp Inc. &nbsp;·&nbsp; Scored Today, 10:42 AM</p></div>
        <div className="result-actions">
          <button className="action-button action-outline" type="button" onClick={() => onNavigate('jobMatches')}>↻ &nbsp; Re-score</button>
          <button className="action-button action-outline" type="button" onClick={() => onNavigate('scoreHistory')}>▣ &nbsp; Save Result</button>
          <button className="action-button action-primary" type="button" onClick={() => onNavigate('recommendations')}>✧ &nbsp; View Recommendations</button>
        </div>
      </section>
      <section className="surface result-summary-card">
        <div className="score-gauge"><div className="score-gauge-inner"><strong>78%</strong><span>Match Score</span></div></div>
        <div className="score-explanation">
          <span className="explanation-label">✧ &nbsp; AI Score Explanation</span>
          <p>Your resume demonstrates highly strong alignment with general Frontend engineering keywords such as React, JavaScript, and CSS. However, your match score is blocked from hitting the high-priority tier because of missing references to TypeScript and testing frameworks like Jest. The similarity index indicates your work experience phrasing has improved substantially since your last attempt.</p>
        </div>
      </section>
      <section className="keyword-groups" aria-label="Matched and missing keywords">
        <article className="surface keyword-card"><div className="keyword-card-heading"><h2>Matched Terms</h2><span className="match-pill match-pill--green">5 Keywords</span></div><div className="keyword-list keyword-list--green">{['React', 'JavaScript', 'CSS', 'HTML', 'Git'].map((term) => <span key={term}>{term}</span>)}</div></article>
        <article className="surface keyword-card"><div className="keyword-card-heading"><h2>Missing Terms</h2><span className="match-pill match-pill--amber">4 Keywords</span></div><div className="keyword-list keyword-list--amber">{['TypeScript', 'GraphQL', 'Jest', 'CI/CD'].map((term) => <span key={term}>{term}</span>)}</div></article>
        <article className="surface keyword-card"><div className="keyword-card-heading"><h2>Partial Matches</h2><span className="match-pill match-pill--green">3 Keywords</span></div><div className="keyword-list keyword-list--teal">{['Tailwind CSS', 'Redux', 'REST APIs'].map((term) => <span key={term}>{term}</span>)}</div></article>
      </section>
    </div>
  )
}

export default MatchResults
