import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import './App.css'
import { supabase } from './supabaseClient'
import AIRecommendations from './pages/AIRecommendations/AIRecommendations'
import Dashboard from './pages/Dashboard/Dashboard'
import Home from './pages/Home/Home'
import JobMatches from './pages/JobMatches/JobMatches'
import Login from './pages/Login/Login'
import MatchResults from './pages/MatchResults/MatchResults'
import ResumeEditor from './pages/ResumeEditor/ResumeEditor'
import ScoreHistory from './pages/ScoreHistory/ScoreHistory'
import Templates from './pages/Templates/Templates'
import type { ScreenKey, ScoreResult, UploadedDocument } from './pages/screenTypes'

const navigation: { label: string; screen: ScreenKey }[] = [
  { label: 'Dashboard', screen: 'dashboard' },
  { label: 'Templates', screen: 'templates' },
  { label: 'Job Matches', screen: 'jobMatches' },
  { label: 'Feedback', screen: 'recommendations' },
]

function AppHeader({ screen, user, onNavigate, onSignOut }: { screen: ScreenKey; user: User; onNavigate: (screen: ScreenKey) => void; onSignOut: () => void }) {
  const activeNav = screen === 'resumeEditor' ? 'templates' : screen === 'matchResults' ? 'jobMatches' : screen === 'scoreHistory' ? 'dashboard' : screen
  const email = user.email || 'Account'
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <header className="app-header">
      <button className="brand" type="button" onClick={() => onNavigate('dashboard')} aria-label="MatchScore dashboard">
        <span className="brand-mark" aria-hidden="true"><span /></span>
        <span>MatchScore</span>
      </button>
      <nav className="main-navigation" aria-label="Main navigation">
        {navigation.map((item) => (
          <button
            className={`nav-link ${activeNav === item.screen ? 'is-active' : ''}`}
            key={item.screen}
            type="button"
            onClick={() => onNavigate(item.screen)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="header-tools">
        <label className="header-search">
          <span aria-hidden="true">⌕</span>
          <input aria-label="Search documents" placeholder="Search documents..." />
        </label>
        <button className="icon-button notification-button" type="button" aria-label="Notifications">
          <span aria-hidden="true">♧</span>
          <i />
        </button>
        <button className="profile-button" type="button" onClick={onSignOut} aria-label={`Sign out ${email}`}>
          <span className="avatar">{initials}</span>
          <span className="profile-name">{email}</span>
        </button>
      </div>
    </header>
  )
}

function App() {
  const [screen, setScreen] = useState<ScreenKey>('home')
  const [user, setUser] = useState<User | null>(null)
  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocument | null>(null)
  const [activeScoreResult, setActiveScoreResult] = useState<ScoreResult | null>(null)
  const [scoreHistory, setScoreHistory] = useState<ScoreResult[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
      if (data.session) setScreen('dashboard')
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (!session) setScreen('home')
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  if (screen === 'home') {
    return <Home onGetStarted={() => setScreen('login')} onSignIn={() => setScreen('login')} />
  }
  if (screen === 'login') {
    return <Login onSignIn={() => setScreen('dashboard')} />
  }

  if (!user) {
    return <Home onGetStarted={() => setScreen('login')} onSignIn={() => setScreen('login')} />
  }

  const handleScored = (result: ScoreResult) => {
    setActiveScoreResult(result)
    setScoreHistory((prev) => [result, ...prev.filter((item) => item.id !== result.id)])
    setScreen('matchResults')
  }

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        return (
          <Dashboard
            recentScores={scoreHistory}
            userName={user.email?.split('@')[0] || 'there'}
            onNavigate={setScreen}
            onSelectScore={(selected) => {
              setActiveScoreResult(selected)
              setScreen('matchResults')
            }}
          />
        )
      case 'templates':
        return <Templates onNavigate={setScreen} />
      case 'jobMatches':
        return <JobMatches onScore={handleScored} uploadedDocument={uploadedDocument} />
      case 'matchResults':
        return <MatchResults result={activeScoreResult} onNavigate={setScreen} />
      case 'recommendations':
        return <AIRecommendations recommendations={activeScoreResult?.recommendations} />
      case 'scoreHistory':
        return (
          <ScoreHistory
            history={scoreHistory}
            onViewDetails={(entry) => {
              if (entry) setActiveScoreResult(entry)
              setScreen('matchResults')
            }}
          />
        )
      case 'resumeEditor':
        return <ResumeEditor onNavigate={setScreen} onDocumentUploaded={setUploadedDocument} />
    }
  }

  return (
    <div className="app-shell">
      <AppHeader screen={screen} user={user} onNavigate={setScreen} onSignOut={() => supabase.auth.signOut()} />
      <main className="page-content" key={screen}>{renderScreen()}</main>
    </div>
  )
}

export default App
