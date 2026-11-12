import { useEffect, useState, type CSSProperties } from 'react'
import BrandMark from '../../components/BrandMark'
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
    const revealItems = document.querySelectorAll<HTMLElement>('[data-home-reveal]')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.18 })

    revealItems.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])

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
          <BrandMark />
          <span className="brand-wordmark">Match<span className="brand-wordmark-accent">Score</span></span>
        </button>
        <div className="home-nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#project">About the project</a>
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
          <div className="home-proof"><BrandMark className="proof-project-mark" /><span><strong>Understand your match</strong> and improve your next application</span></div>
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

      <section className="home-trusted home-scroll-reveal" id="project" data-home-reveal>
        <span>Built using</span>
        <div><strong>React</strong><strong>TypeScript</strong><strong>Flask</strong><strong>Supabase</strong><strong>TF-IDF</strong></div>
      </section>

      <section className="home-section home-how home-scroll-reveal" id="how-it-works" data-home-reveal>
        <div className="home-section-heading"><p className="home-kicker">A clearer path forward</p><h2>Everything you need to<br /><em>move ahead.</em></h2></div>
        <div className="home-steps">
          {steps.map((step) => <article className="home-step" key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}
        </div>
      </section>

      <section className="home-feature home-scroll-reveal" id="features" data-home-reveal>
        <div className="feature-visual" aria-label="Animated resume and job matching visualization">
          <span className="feature-window-dot" /><span className="feature-window-dot" /><span className="feature-window-dot" />
          <div className="match-source match-source--resume"><small>YOUR RESUME</small><strong>Alex Mercer</strong><span>React · UX · TypeScript</span><i /><i /><i /></div>
          <div className="match-source match-source--job"><small>JOB DESCRIPTION</small><strong>Frontend Engineer</strong><span>React · API · Testing</span><i /><i /><i /></div>
          <div className="match-engine"><span className="engine-pulse" /><strong>78%</strong><small>MATCH SCORE</small></div>
          <div className="match-result"><span>✓</span> 3 skills aligned</div>
        </div>
        <div className="feature-copy"><p className="home-kicker">More than a score</p><h2>Turn feedback into<br /><em>forward motion.</em></h2><p>Our matching engine helps you understand the gap between where your resume is and where it could be, so you can close it one clear step at a time.</p><ul><li><span>✓</span> See the skills employers are looking for</li><li><span>✓</span> Get recommendations written for you</li><li><span>✓</span> Track your progress across every application</li></ul><button className="home-text-button" type="button" onClick={onGetStarted}>Explore MatchScore <span>→</span></button></div>
      </section>

      <section className="home-quote home-scroll-reveal" aria-label="Founder quote" data-home-reveal><p>“MatchScore helps me stop guessing and start applying with confidence. The feedback is simple, specific, and actually useful.”</p><span><i>MV</i> Michael Villamor <small>• Creator of MatchScore</small></span></section>

      <section className="home-cta home-scroll-reveal" data-home-reveal><p className="home-kicker">Your next chapter starts here</p><h2>Ready to make your<br /><em>next move?</em></h2><button className="home-primary-button" type="button" onClick={onGetStarted}>Get started for free <span>→</span></button><small>No credit card required. Your first resume analysis is on us.</small></section>

      <footer className="home-footer"><span className="home-brand"><BrandMark /><span className="brand-wordmark">Match<span className="brand-wordmark-accent">Score</span></span></span><span>© 2026 MatchScore</span><div><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#project">About</a></div></footer>
    </main>
  )
}

export default Home
