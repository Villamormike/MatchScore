import { useState } from 'react'
import './ScoreHistory.css'

const ranges = ['Last 7 Days', 'Last 30 Days', 'Last 3 Months', 'All Time'] as const
type Range = (typeof ranges)[number]
const entries = [
  { date: 'Oct 24, 2026', role: 'Frontend Developer at TechCorp', score: '78%', color: 'green', version: 'Alex Mercer - Frontend Dev (v3)' },
  { date: 'Oct 21, 2026', role: 'Junior Web Developer at Linear', score: '86%', color: 'green', version: 'Alex Mercer - Frontend Dev (v3)' },
  { date: 'Oct 18, 2026', role: 'Frontend Engineer Intern at Vercel', score: '64%', color: 'amber', version: 'Alex Mercer - Frontend Dev (v2)' },
  { date: 'Oct 15, 2026', role: 'Associate Software Engineer at Figma', score: '48%', color: 'rose', version: 'Alex Mercer - Frontend Dev (v2)' },
]
const lineByRange: Record<Range, string> = {
  'Last 7 Days': 'M22 150 L170 126 L318 115 L466 83 L614 98 L762 51 L910 27',
  'Last 30 Days': 'M22 145 L170 117 L318 90 L466 68 L614 91 L762 42 L910 18',
  'Last 3 Months': 'M22 153 L170 127 L318 105 L466 111 L614 72 L762 50 L910 31',
  'All Time': 'M22 160 L170 139 L318 129 L466 82 L614 91 L762 44 L910 21',
}

function ScoreHistory({ onViewDetails }: { onViewDetails: () => void }) {
  const [range, setRange] = useState<Range>('Last 30 Days')

  return (
    <div className="score-history-page">
      <section className="page-heading history-heading"><div><h1>Score History</h1></div><div className="history-ranges">{ranges.map((item) => <button className={range === item ? 'is-active' : ''} key={item} type="button" onClick={() => setRange(item)}>{item}</button>)}</div></section>
      <section className="surface trend-card">
        <div className="trend-card-heading"><div><h2>Score Progress Trend</h2><p>Shows the overall cosine matching score growth across your historical document scans.</p></div><span><i /> Resume Scores</span></div>
        <svg className="score-chart" viewBox="0 0 940 180" preserveAspectRatio="none" role="img" aria-label={`${range} resume scores trend chart`}>
          <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0e9c8e" stopOpacity=".09" /><stop offset="1" stopColor="#0e9c8e" stopOpacity="0" /></linearGradient></defs>
          {[30, 65, 100, 135, 170].map((y) => <line className="chart-grid-line" key={y} x1="20" x2="920" y1={y} y2={y} />)}
          <path d={`${lineByRange[range]} L910 170 L22 170 Z`} fill="url(#chart-fill)" />
          <path d={lineByRange[range]} className="chart-line" />
          {lineByRange[range].match(/\d+ \d+/g)?.map((point, index) => { const [cx, cy] = point.split(' ').map(Number); return <circle className="chart-dot" key={`${cx}-${cy}-${index}`} cx={cx} cy={cy} r="3" /> })}
        </svg>
        <div className="chart-axis-labels"><span>Oct 1</span><span>Oct 7</span><span>Oct 14</span><span>Oct 21</span><span>Oct 28</span></div>
      </section>
      <section className="scoring-log-section"><h2>Scoring Log</h2><div className="surface table-wrap"><table className="scoring-table"><thead><tr><th>Date</th><th>Job Posting Title</th><th>Score</th><th>Resume Version</th><th>Action</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.role}><td>{entry.date}</td><td><strong>{entry.role}</strong></td><td><span className={`match-pill match-pill--${entry.color}`}>{entry.score} Match</span></td><td>{entry.version}</td><td><button className="text-link" type="button" onClick={onViewDetails}>View Details</button></td></tr>)}</tbody></table></div></section>
    </div>
  )
}

export default ScoreHistory
