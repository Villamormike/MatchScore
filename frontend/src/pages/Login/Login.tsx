import { useState, type FormEvent } from 'react'
import './Login.css'

type Props = { onSignIn: () => void }

function Login({ onSignIn }: Props) {
  const [email, setEmail] = useState('hello@earlycareer.dev')
  const [password, setPassword] = useState('matchscore')
  const [message, setMessage] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSignIn()
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <button className="login-brand" type="button" onClick={onSignIn}>
          <span className="brand-mark brand-mark--light"><span /></span>
          <span>MatchScore</span>
        </button>
        <div className="login-story-center">
          <div className="overlap-card" aria-hidden="true">
            <div className="overlap-circles"><span>RESUME</span><span>JOB</span></div>
            <div className="overlap-row"><span>Term: “React”</span><strong>IDF: High</strong></div>
            <div className="overlap-row"><span>Term: “TypeScript”</span><strong>IDF: Critical</strong></div>
          </div>
          <h1>Build. Score. Improve.</h1>
          <p>Optimize your resume for applicant tracking systems using advanced similarity matching algorithms and tailored AI feedback.</p>
        </div>
        <footer className="login-story-footer"><span>© 2026 MatchScore Inc.</span><span>Version 2.4 (Cosine V2)</span></footer>
      </section>
      <section className="login-form-side">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form-heading">
            <h2>Get Started</h2>
            <p>Sign in to optimize your resume and track job applications.</p>
          </div>
          <label className="login-field">
            <span>Email Address</span>
            <span className="login-input-wrap"><span aria-hidden="true">✉</span><input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></span>
          </label>
          <label className="login-field">
            <span className="password-label">Password <button className="text-link" type="button" onClick={() => setMessage('Password reset instructions are ready to send to your email.')}>Forgot?</button></span>
            <span className="login-input-wrap"><span aria-hidden="true">♙</span><input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></span>
          </label>
          {message && <p className="login-message" role="status">{message}</p>}
          <button className="action-button action-primary login-submit" type="submit">Sign In to MatchScore</button>
          <button className="action-button action-outline login-google" type="button" onClick={onSignIn}><span aria-hidden="true">◉</span> Continue with Google</button>
          <p className="login-signup">New to MatchScore? <button className="text-link" type="button" onClick={onSignIn}>Create an account</button></p>
        </form>
      </section>
    </main>
  )
}

export default Login
