import './Dashboard.css'
import type { ScreenKey } from '../screenTypes'

type Props = { onNavigate: (screen: ScreenKey) => void }

const documents = [
  { kind: 'RESUME', name: 'Alex Mercer - Frontend Dev', detail: 'Edited 2 hours ago', score: '89%', color: 'green', note: 'Modern Layout — Single Column' },
  { kind: 'PORTFOLIO', name: 'Alex Mercer - UX Portfolio', detail: 'Edited Yesterday', score: '72%', color: 'amber', note: 'Creative Portfolio — Case Studies' },
]

const matches = [
  { title: 'Junior Web Developer', company: 'Linear', date: 'Today', score: '86%', color: 'green' },
  { title: 'Frontend Engineer Intern', company: 'Vercel', date: 'Yesterday', score: '79%', color: 'amber' },
  { title: 'Associate Software Engineer', company: 'Figma', date: '3 days ago', score: '64%', color: 'rose' },
]

function Dashboard({ onNavigate }: Props) {
  return (
    <div className="dashboard-page">
      <section className="page-heading dashboard-heading">
        <div>
          <h1>Welcome back, Alex!</h1>
          <p>Optimize your resume performance. Your average match score is up 4% this week.</p>
        </div>
        <button className="action-button action-primary" type="button" onClick={() => onNavigate('templates')}>
          <span aria-hidden="true">＋</span> Create New Resume
        </button>
      </section>

      <section className="dashboard-stats" aria-label="Resume statistics">
        <article className="surface stat-card">
          <div className="stat-label">TOTAL DOCUMENTS <span className="stat-icon">▤</span></div>
          <strong>8 Active</strong>
          <small>5 Resumes, 3 Portfolios</small>
        </article>
        <article className="surface stat-card">
          <div className="stat-label">AVG. COSINE MATCH <span className="stat-icon">◉</span></div>
          <strong>81.4%</strong>
          <small>Top score: 92% against Figma</small>
        </article>
        <article className="surface stat-card">
          <div className="stat-label">JOB POSTINGS SCORED <span className="stat-icon">▣</span></div>
          <strong>14 Checked</strong>
          <small>4 added this week</small>
        </article>
      </section>

      <section className="dashboard-lower">
        <div className="documents-column">
          <div className="section-title-row">
            <h2>My Documents</h2>
            <button className="text-link" type="button" onClick={() => onNavigate('templates')}>View all (8)</button>
          </div>
          <div className="document-grid">
            {documents.map((document) => (
              <article className="surface document-card" key={document.name}>
                <div className="document-card-top">
                  <span className="document-kind">{document.kind}</span>
                  <span className={`match-pill match-pill--${document.color}`}>◉ {document.score} Match</span>
                </div>
                <h3>{document.name}</h3>
                <p className="document-note">{document.note}</p>
                <p className="document-time">{document.detail}</p>
                <div className="document-actions">
                  <button className="action-button action-outline" type="button" onClick={() => onNavigate('resumeEditor')}>⌁ &nbsp; Edit</button>
                  <button className="action-button action-soft" type="button" onClick={() => onNavigate('jobMatches')}>◉ &nbsp; Score</button>
                  <button className="more-button" type="button" aria-label={`More options for ${document.name}`} onClick={() => onNavigate('scoreHistory')}>···</button>
                </div>
              </article>
            ))}
          </div>
          <button className="history-link" type="button" onClick={() => onNavigate('scoreHistory')}>
            View your score history <span aria-hidden="true">→</span>
          </button>
        </div>

        <aside className="recent-column">
          <div className="section-title-row"><h2>Recent Job Matches</h2></div>
          <div className="recent-match-list">
            {matches.map((match) => (
              <button className="surface recent-match" key={match.title} type="button" onClick={() => onNavigate('matchResults')}>
                <span className="recent-match-copy"><strong>{match.title}</strong><small>{match.company} &nbsp;·&nbsp; {match.date}</small></span>
                <span className={`match-pill match-pill--${match.color}`}>◉ {match.score} Match</span>
              </button>
            ))}
          </div>
          <button className="feedback-banner" type="button" onClick={() => onNavigate('recommendations')}>
            <span className="feedback-spark" aria-hidden="true">✧</span>
            <span><strong>Want customized AI feedback?</strong><small>Get line-by-line recommendations instantly.</small></span>
            <span className="banner-arrow" aria-hidden="true">→</span>
          </button>
        </aside>
      </section>
    </div>
  )
}

export default Dashboard
