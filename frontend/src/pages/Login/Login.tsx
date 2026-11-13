import { useState, type FormEvent } from 'react'
import BrandMark from '../../components/BrandMark'
import { supabase } from '../../supabaseClient'
import './Login.css'

type Props = { onSignIn: () => void }

function getAuthErrorMessage(authError: unknown) {
  const message = authError instanceof Error ? authError.message : ''
  if (message.toLowerCase().includes('rate limit')) {
    return 'Too many authentication emails were requested recently. Please wait a few minutes before trying again. You can still sign in with your password once the limit clears.'
  }
  return message || 'Unable to complete authentication.'
}

function Login({ onSignIn }: Props) {
  const [email, setEmail] = useState(() => localStorage.getItem('matchscore-remembered-email') || '')
  const [password, setPassword] = useState('')
  const [rememberEmail, setRememberEmail] = useState(() => Boolean(localStorage.getItem('matchscore-remembered-email')))
  const [verificationCode, setVerificationCode] = useState('')
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    setError('')

    try {
      if (isVerifying) {
        const { error: verificationError } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: verificationCode.trim(),
          type: 'signup',
        })
        if (verificationError) throw verificationError
        onSignIn()
        return
      }

      if (isCreatingAccount) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        })
        if (signUpError) throw signUpError
        if (data.session) {
          onSignIn()
        } else {
          setIsVerifying(true)
          setMessage('Check your email for the verification code.')
        }
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (signInError) throw signInError
      if (rememberEmail) {
        localStorage.setItem('matchscore-remembered-email', email.trim().toLowerCase())
      } else {
        localStorage.removeItem('matchscore-remembered-email')
      }
      onSignIn()
    } catch (authError) {
      setError(getAuthErrorMessage(authError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const switchMode = () => {
    setIsCreatingAccount((current) => !current)
    setIsVerifying(false)
    setMessage('')
    setError('')
  }

  const handlePasswordReset = async () => {
    setMessage('')
    setError('')
    if (!email.trim()) {
      setError('Enter your email address first.')
      return
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin,
    })
    if (resetError) {
      setError(resetError.message)
    } else {
      setMessage('Password reset instructions are ready to send to your email.')
    }
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <button className="login-brand" type="button" onClick={onSignIn}>
          <BrandMark variant="light" />
          <span className="brand-wordmark">Match<span className="brand-wordmark-accent">Score</span></span>
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
        <footer className="login-story-footer"><span>© 2026 MatchScore</span><span>Resume matching platform</span></footer>
      </section>
      <section className="login-form-side">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form-heading">
            <h2>{isVerifying ? 'Verify your email' : isCreatingAccount ? 'Create your account' : 'Welcome back'}</h2>
            <p>{isVerifying ? `Enter the verification code sent to ${email}.` : 'Sign in to optimize your resume and track job applications.'}</p>
          </div>
          {!isVerifying && <label className="login-field">
            <span>Email Address</span>
            <span className="login-input-wrap"><span aria-hidden="true">✉</span><input autoComplete="email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} required /></span>
          </label>}
          {!isVerifying && <label className="login-field">
            <span className="password-label">Password {!isCreatingAccount && <button className="text-link" type="button" onClick={handlePasswordReset}>Forgot?</button>}</span>
            <span className="login-input-wrap">
              <span aria-hidden="true">♙</span>
              <input autoComplete={isCreatingAccount ? 'new-password' : 'current-password'} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} minLength={6} required />
              <button className="password-toggle" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>}
          {!isVerifying && !isCreatingAccount && <label className="login-remember">
            <input type="checkbox" checked={rememberEmail} onChange={(event) => setRememberEmail(event.target.checked)} />
            <span>Remember my email</span>
          </label>}
          {isVerifying && <label className="login-field">
            <span>Verification Code</span>
            <span className="login-input-wrap"><span aria-hidden="true">#</span><input inputMode="numeric" autoComplete="one-time-code" value={verificationCode} onChange={(event) => { setVerificationCode(event.target.value); setError('') }} required /></span>
          </label>}
          {message && <p className="login-message" role="status">{message}</p>}
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="action-button action-primary login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait...' : isVerifying ? 'Verify Email' : isCreatingAccount ? 'Create Account' : 'Sign In to MatchScore'}</button>
          <p className="login-signup">{isVerifying ? <button className="text-link" type="button" onClick={switchMode}>Back to sign in</button> : <>{isCreatingAccount ? 'Already have an account?' : 'New to MatchScore?'} <button className="text-link" type="button" onClick={switchMode}>{isCreatingAccount ? 'Sign in' : 'Create an account'}</button></>}</p>
        </form>
      </section>
    </main>
  )
}

export default Login
