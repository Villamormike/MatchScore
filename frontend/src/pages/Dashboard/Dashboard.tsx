import './Dashboard.css'
import type { SavedDocument, ScreenKey, ScoreResult } from '../screenTypes'

type Props = {
  recentScores?: ScoreResult[]
  onNavigate: (screen: ScreenKey) => void
  onSelectScore?: (item: ScoreResult) => void
  userName?: string
  documents?: SavedDocument[]
  onSelectDocument?: (document: SavedDocument) => void
  onDeleteDocument?: (document: SavedDocument) => void
}

function Dashboard({ recentScores, onNavigate, onSelectScore, userName = 'there', documents = [], onSelectDocument, onDeleteDocument }: Props) {
  const matches = (recentScores && recentScores.length > 0)
    ? recentScores.slice(0, 4).map((s) => ({
        raw: s,
        title: s.job_title || s.role,
        company: s.company || 'Unknown company',
        date: s.date || 'Recently',
        score: s.score || `${s.overall_score}%`,
        color: s.color || 'green'
      }))
    : []

  const scoreCount = recentScores?.length || 0
  const averageScore = scoreCount
    ? Math.round((recentScores || []).reduce((total, score) => total + score.overall_score, 0) / scoreCount)
    : 0

  return (
    <div className="dashboard-page">
      <section className="page-heading dashboard-heading">
        <div>
          <h1>Welcome back, {userName}!</h1>
          <p>Optimize your resume performance. Real-time deterministic matching engine is active.</p>
        </div>
        <button className="action-button action-primary" type="button" onClick={() => onNavigate('jobMatches')}>
          <span aria-hidden="true">◉</span> Score A Resume
        </button>
      </section>

      <section className="dashboard-stats" aria-label="Resume statistics">
        <article className="surface stat-card">
          <div className="stat-label">TOTAL DOCUMENTS <span className="stat-icon">▤</span></div>
          <strong>{documents.length} Active</strong>
          <small>{documents.length ? 'Saved to your account.' : 'Your uploaded documents will appear here.'}</small>
        </article>
        <article className="surface stat-card">
          <div className="stat-label">AVG. COSINE MATCH <span className="stat-icon">◉</span></div>
          <strong>{averageScore}%</strong>
          <small>{scoreCount ? 'Based on your score history.' : 'Score a resume to see your average.'}</small>
        </article>
        <article className="surface stat-card">
          <div className="stat-label">JOB POSTINGS SCORED <span className="stat-icon">▣</span></div>
          <strong>{scoreCount} Checked</strong>
          <small>Your completed resume scans.</small>
        </article>
      </section>

      <section className="dashboard-lower">
        <div className="documents-column">
          <div className="section-title-row">
            <h2>My Documents</h2>
            <button className="text-link" type="button" onClick={() => onNavigate('templates')}>Add a document</button>
          </div>
          {documents.length ? documents.slice(0, 4).map((document) => (
            <article className="surface document-card" key={document.id}>
              <button className="document-open-button" type="button" onClick={() => onSelectDocument?.(document)}>
                <h3>{document.name}</h3>
                <p className="document-note">{document.word_count} words · Updated {new Date(document.updated_at).toLocaleDateString()}</p>
              </button>
              <button
                className="document-delete-button"
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete "${document.name}" from your account?`)) {
                    void onDeleteDocument?.(document)
                  }
                }}
              >
                Delete
              </button>
            </article>
          )) : <div className="surface document-card">
            <h3>No documents yet</h3>
            <p className="document-note">Create or upload a resume to start building your personal workspace.</p>
            <button className="action-button action-primary" type="button" onClick={() => onNavigate('templates')}>Add your first document</button>
          </div>}
          <button className="history-link" type="button" onClick={() => onNavigate('scoreHistory')}>
            View your score history <span aria-hidden="true">→</span>
          </button>
        </div>

        <aside className="recent-column">
          <div className="section-title-row"><h2>Recent Job Matches</h2></div>
          <div className="recent-match-list">
            {matches.length ? matches.map((match, i) => (
              <button
                className="surface recent-match"
                key={`${match.title}-${i}`}
                type="button"
                onClick={() => {
                  if (match.raw && onSelectScore) {
                    onSelectScore(match.raw)
                  } else {
                    onNavigate('matchResults')
                  }
                }}
              >
                <span className="recent-match-copy">
                  <strong>{match.title}</strong>
                  <small>{match.company} &nbsp;·&nbsp; {match.date}</small>
                </span>
                <span className={`match-pill match-pill--${match.color}`}>◉ {match.score} Match</span>
              </button>
            )) : <div className="surface document-card"><h3>No job matches yet</h3><p className="document-note">Score a resume against a job posting to see your results here.</p></div>}
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
