import { useEffect, useState, type CSSProperties } from 'react'
import './Home.css'

type Props = {
  onGetStarted: () => void
  onSignIn: () => void
}

const steps = [
  { number: '01', title: 'Upload your resume', text: 'Start with the resume you already have. MatchScore handles the rest.' },
  { number: '02', title: 'Add a job description', text: 'Paste any role to see how closely your experience matches what employers need.' },
  { number: '03', title: 'Improve with confidence', text: 'Get clear, practical recommendations that make every application stronger.' },
]

function Home({ onGetStarted, onSignIn }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const duration = 1400
    const targetScore = 78
    const startTime = performance.now()
    let animationFrame = 0

    const animateScore = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(Math.round(targetScore * easedProgress))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateScore)
      }
    }

    animationFrame = requestAnimationFrame(animateScore)
    return () => cancelAnimationFrame(animationFrame)
  }, [])

  return (
    <main className="home-page">
      <nav className="home-nav" aria-label="Marketing navigation">
        <button className="home-brand" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="brand-mark"><span /></span>
          <span>MatchScore</span>
        </button>
        <div className="home-nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#stories">Stories</a>
        </div>
        <div className="home-nav-actions">
          <button className="home-sign-in" type="button" onClick={onSignIn}>Sign in</button>
          <button className="home-nav-cta" type="button" onClick={onGetStarted}>Get started <span>→</span></button>
        </div>
      </nav>

      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-kicker"><span /> Built for your next opportunity</p>
          <h1>Build. Score.<br /><em>Improve.</em></h1>
          <p className="home-lede">Make every application count. Match your resume to the right roles, uncover what is missing, and land the work you are excited about.</p>
          <div className="home-hero-actions">
            <button className="home-primary-button" type="button" onClick={onGetStarted}>Optimize my resume <span>→</span></button>
            <button className="home-secondary-button" type="button" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>See how it works <span>↓</span></button>
          </div>
          <div className="home-proof"><span className="proof-avatars"><i>AM</i><i>JC</i><i>SK</i></span><span><strong>10,000+</strong> early-career professionals are building with MatchScore</span></div>
        </div>
        <div className="home-hero-visual" aria-label="Resume match score preview">
          <div className="score-preview">
            <div className="score-preview-top"><span className="preview-label">MATCH SCORE</span><span className="preview-dots">•••</span></div>
            <div className="score-ring" style={{ '--score-progress': `${animatedScore * 3.6}deg` } as CSSProperties}><strong>{animatedScore}<small>%</small></strong><span>Great match</span></div>
            <div className="score-preview-divider" />
            <div className="score-preview-row"><span>Resume alignment</span><strong>Excellent</strong></div>
            <div className="score-preview-row"><span>Keyword coverage</span><strong>84%</strong></div>
            <div className="score-preview-row"><span>Role fit</span><strong>Strong</strong></div>
            <button type="button" onClick={onGetStarted}>View detailed feedback <span>→</span></button>
          </div>
          <div className="floating-note floating-note--top"><span>✦</span><div><strong>Smart feedback</strong><small>3 quick wins found</small></div></div>
          <div className="floating-note floating-note--bottom"><span>✓</span><div><strong>Keywords matched</strong><small>React · TypeScript · UX</small></div></div>
        </div>
      </section>

      <section className="home-trusted">
        <span>Trusted by people heading to</span>
        <div><strong>GOOGLE</strong><strong>stripe</strong><strong>notion</strong><strong>Vercel</strong><strong>Figma</strong></div>
      </section>

      <section className="home-section home-how" id="how-it-works">
        <div className="home-section-heading"><p className="home-kicker">A clearer path forward</p><h2>Everything you need to<br /><em>move ahead.</em></h2></div>
        <div className="home-steps">
          {steps.map((step) => <article className="home-step" key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}
        </div>
      </section>

      <section className="home-feature" id="features">
        <div className="feature-visual" aria-label="Animated resume and job matching visualization">
          <span className="feature-window-dot" /><span className="feature-window-dot" /><span className="feature-window-dot" />
          <div className="match-source match-source--resume"><small>YOUR RESUME</small><strong>Alex Mercer</strong><span>React · UX · TypeScript</span><i /><i /><i /></div>
          <div className="match-source match-source--job"><small>JOB DESCRIPTION</small><strong>Frontend Engineer</strong><span>React · API · Testing</span><i /><i /><i /></div>
          <div className="match-engine"><span className="engine-pulse" /><strong>78%</strong><small>MATCH SCORE</small></div>
          <div className="match-result"><span>✓</span> 3 skills aligned</div>
        </div>
        <div className="feature-copy"><p className="home-kicker">More than a score</p><h2>Turn feedback into<br /><em>forward motion.</em></h2><p>Our matching engine helps you understand the gap between where your resume is and where it could be, so you can close it one clear step at a time.</p><ul><li><span>✓</span> See the skills employers are looking for</li><li><span>✓</span> Get recommendations written for you</li><li><span>✓</span> Track your progress across every application</li></ul><button className="home-text-button" type="button" onClick={onGetStarted}>Explore MatchScore <span>→</span></button></div>
      </section>

      <section className="home-quote" id="stories"><p>“MatchScore helped me stop guessing and start applying with confidence. The feedback is simple, specific, and actually useful.”</p><span><i>JL</i> Jordan Lee <small>• Product Designer</small></span></section>

      <section className="home-cta"><p className="home-kicker">Your next chapter starts here</p><h2>Ready to make your<br /><em>next move?</em></h2><button className="home-primary-button" type="button" onClick={onGetStarted}>Get started for free <span>→</span></button><small>No credit card required. Your first resume analysis is on us.</small></section>

      <footer className="home-footer"><span className="home-brand"><span className="brand-mark"><span /></span><span>MatchScore</span></span><span>© 2026 MatchScore Inc.</span><div><a href="#features">Privacy</a><a href="#features">Terms</a><a href="#features">Contact</a></div></footer>
    </main>
  )
}

export default Home
