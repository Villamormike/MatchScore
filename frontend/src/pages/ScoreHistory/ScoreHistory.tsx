import { useState } from 'react'
import './ScoreHistory.css'
import type { ScoreResult } from '../screenTypes'

const ranges = ['Last 7 Days', 'Last 30 Days', 'Last 3 Months', 'All Time'] as const
type Range = (typeof ranges)[number]

type Props = {
  history?: ScoreResult[]
  onViewDetails: (entry?: ScoreResult) => void
  onDeleteScore: (entry: ScoreResult) => Promise<void>
}

function ScoreHistory({ history, onViewDetails, onDeleteScore }: Props) {
  const [range, setRange] = useState<Range>('Last 30 Days')
  const entries = history || []
  const [now] = useState(() => Date.now())
  const rangeDuration: Record<Range, number | null> = {
    'Last 7 Days': 7,
    'Last 30 Days': 30,
    'Last 3 Months': 90,
    'All Time': null,
  }
  const filteredEntries = entries
    .map((entry) => ({ entry, timestamp: Date.parse(entry.date) }))
    .filter(({ timestamp }) => {
      const days = rangeDuration[range]
      return days === null || Number.isNaN(timestamp) || now - timestamp <= days * 24 * 60 * 60 * 1000
    })
    .sort((left, right) => {
      if (Number.isNaN(left.timestamp) || Number.isNaN(right.timestamp)) return 0
      return left.timestamp - right.timestamp
    })
  const chartPoints = filteredEntries.map(({ entry }, index) => {
    const x = filteredEntries.length === 1 ? 470 : 22 + (index * 888) / (filteredEntries.length - 1)
    const score = Math.min(Math.max(entry.overall_score || 0, 0), 100)
    const y = 170 - score * 1.4
    return { x, y, score }
  })
  const linePath = chartPoints.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x} ${y}`).join(' ')
  const chartFillPath = chartPoints.length > 0
    ? `${linePath} L${chartPoints[chartPoints.length - 1].x} 170 L${chartPoints[0].x} 170 Z`
    : ''
  const chartLabels = filteredEntries.length > 0
    ? filteredEntries.slice(0, 5).map(({ entry }) => entry.date)
    : []

  return (
    <div className="score-history-page">
      <section className="page-heading history-heading">
        <div>
          <h1>Score History</h1>
        </div>
        <div className="history-ranges">
          {ranges.map((item) => (
            <button
              className={range === item ? 'is-active' : ''}
              key={item}
              type="button"
              onClick={() => setRange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="surface trend-card">
        <div className="trend-card-heading">
          <div>
            <h2>Score Progress Trend</h2>
            <p>Shows the overall cosine matching score growth across your historical document scans.</p>
          </div>
          <span><i /> Resume Scores</span>
        </div>
        {chartPoints.length > 0 ? <svg className="score-chart" viewBox="0 0 940 180" preserveAspectRatio="none" role="img" aria-label={`${range} resume scores trend chart`}>
          <defs>
            <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#0e9c8e" stopOpacity=".09" />
              <stop offset="1" stopColor="#0e9c8e" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[30, 65, 100, 135, 170].map((y) => (
            <line className="chart-grid-line" key={y} x1="20" x2="920" y1={y} y2={y} />
          ))}
          <path d={chartFillPath} fill="url(#chart-fill)" />
          <path d={linePath} className="chart-line" />
          {chartPoints.map(({ x, y, score }) => (
            <circle className="chart-dot" key={`${x}-${y}`} cx={x} cy={y} r="4">
              <title>{score}%</title>
            </circle>
          ))}
        </svg> : <div className="score-chart-empty">No scores in this range yet. Score a resume to build your account trend.</div>}
        <div className="chart-axis-labels">
          {chartLabels.map((label) => <span key={label}>{label}</span>)}
        </div>
      </section>

      <section className="scoring-log-section">
        <h2>Scoring Log ({entries.length} scans)</h2>
        <div className="surface table-wrap">
          <table className="scoring-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Job Posting Title</th>
                <th>Score</th>
                <th>Resume Version</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && <tr><td colSpan={5}>No scores yet. Score a resume to build your history.</td></tr>}
              {entries.map((entry) => (
                <tr key={entry.id || entry.role}>
                  <td>{entry.date}</td>
                  <td><strong>{entry.role || `${entry.job_title} at ${entry.company}`}</strong></td>
                  <td><span className={`match-pill match-pill--${entry.color}`}>{entry.score} Match</span></td>
                  <td>{entry.version}</td>
                  <td>
                    <div className="history-actions">
                      <button className="text-link" type="button" onClick={() => onViewDetails(entry)}>
                        View Details
                      </button>
                      <button
                        className="text-link text-link--danger"
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete the score history for "${entry.role}"?`)) {
                            void onDeleteScore(entry)
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default ScoreHistory
