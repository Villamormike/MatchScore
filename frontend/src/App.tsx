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
import type { SavedDocument } from './pages/screenTypes'
import { deleteAccountDocument, loadAccountData, saveAccountScore } from './lib/accountStorage'

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
  const [documents, setDocuments] = useState<SavedDocument[]>([])
  const [activeDocument, setActiveDocument] = useState<SavedDocument | null>(null)
  const [generatedDocument, setGeneratedDocument] = useState<UploadedDocument | null>(null)
  const [accountError, setAccountError] = useState('')

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

  useEffect(() => {
    if (!user) {
      setDocuments([])
      setScoreHistory([])
      return
    }
    loadAccountData()
      .then(({ documents: loadedDocuments, scores }) => {
        setDocuments(loadedDocuments)
        setScoreHistory(scores)
      })
      .catch((error) => {
        console.error('Unable to load account data', error)
        setAccountError('Your account data could not be loaded. Please refresh and try again.')
      })
  }, [user])

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
    const matchingDocument = uploadedDocument
    saveAccountScore(result, matchingDocument?.id)
      .then((savedResult) => setScoreHistory((prev) => [savedResult, ...prev.filter((item) => item.id !== result.id && item.id !== savedResult.id)]))
      .catch((error) => {
        console.error('Unable to save score result', error)
        setAccountError('The score was shown, but could not be saved to your account.')
      })
    setScreen('matchResults')
  }

  const handleDocumentSaved = (document: SavedDocument) => {
    setUploadedDocument(document)
    setDocuments((prev) => [document, ...prev.filter((item) => item.id !== document.id)])
  }

  const handleDocumentDeleted = async (document: SavedDocument) => {
    try {
      await deleteAccountDocument(document)
      setDocuments((prev) => prev.filter((item) => item.id !== document.id))
      if (uploadedDocument?.id === document.id) {
        setUploadedDocument(null)
        setActiveDocument(null)
      }
    } catch (error) {
      console.error('Unable to delete document', error)
      setAccountError('The document could not be deleted from your account.')
    }
  }

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        return (
          <Dashboard
            recentScores={scoreHistory}
            documents={documents}
            userName={user.email?.split('@')[0] || 'there'}
            onNavigate={setScreen}
            onSelectDocument={(document) => {
              setActiveDocument(document)
              setUploadedDocument(document)
              setScreen('resumeEditor')
            }}
            onDeleteDocument={handleDocumentDeleted}
            onSelectScore={(selected) => {
              setActiveScoreResult(selected)
              setScreen('matchResults')
            }}
          />
        )
      case 'templates':
        return <Templates onGenerateLayout={(document) => {
          setGeneratedDocument(document)
          setActiveDocument(null)
          setScreen('resumeEditor')
        }} />
      case 'jobMatches':
        return (
          <JobMatches
            onScore={handleScored}
            uploadedDocument={uploadedDocument}
            previousScore={activeScoreResult}
            onDocumentSaved={handleDocumentSaved}
          />
        )
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
        return (
          <ResumeEditor
            initialDocument={activeDocument}
            initialContent={generatedDocument}
            onNavigate={setScreen}
            onDocumentUploaded={handleDocumentSaved}
          />
        )
    }
  }

  return (
    <div className="app-shell">
      <AppHeader screen={screen} user={user} onNavigate={setScreen} onSignOut={() => supabase.auth.signOut()} />
      <main className="page-content" key={screen}>{renderScreen()}</main>
      {accountError && <p role="alert" className="account-error">{accountError}</p>}
    </div>
  )
}

export default App
