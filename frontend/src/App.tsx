import { useState, useEffect, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import './App.css'
import BrandMark from './components/BrandMark'
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
import { deleteAccountDocument, deleteAccountScore, loadAccountData, saveAccountDocument, saveAccountScore } from './lib/accountStorage'
import { apiUrl } from './api'

const navigation: { label: string; screen: ScreenKey }[] = [
  { label: 'Dashboard', screen: 'dashboard' },
  { label: 'Templates', screen: 'templates' },
  { label: 'Job Matches', screen: 'jobMatches' },
  { label: 'Feedback', screen: 'recommendations' },
]

type AppNotification = {
  id: string
  message: string
  actionLabel: string
  action: () => void
}

function AppHeader({
  screen,
  user,
  documents,
  onNavigate,
  onSelectDocument,
  onSignOut,
  darkMode,
  onToggleDarkMode,
  notifications,
  onClearNotifications,
}: {
  screen: ScreenKey
  user: User
  documents: SavedDocument[]
  onNavigate: (screen: ScreenKey) => void
  onSelectDocument: (document: SavedDocument) => void
  onSignOut: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
  notifications: AppNotification[]
  onClearNotifications: () => void
}) {
  const activeNav = screen === 'resumeEditor' ? 'templates' : screen === 'matchResults' ? 'jobMatches' : screen === 'scoreHistory' ? 'dashboard' : screen
  const email = user.email || 'Account'
  const nickname = email.split('@')[0] || 'Account'
  const initials = nickname.slice(0, 2).toUpperCase()
  const [query, setQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const matchingDocuments = query.trim()
    ? documents.filter((document) => `${document.name} ${document.filename}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 5)
    : []

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', closeMenus)
    return () => document.removeEventListener('mousedown', closeMenus)
  }, [])

  return (
    <header className="app-header">
      <button className="brand" type="button" onClick={() => onNavigate('dashboard')} aria-label="MatchScore dashboard">
        <BrandMark />
        <span className="brand-wordmark">Match<span className="brand-wordmark-accent">Score</span></span>
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
        <div className="header-search-wrap">
          <label className="header-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Search documents"
            placeholder="Search documents..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          </label>
          {query.trim() && (
            <div className="search-results" role="listbox" aria-label="Matching documents">
              {matchingDocuments.length ? matchingDocuments.map((document) => (
                <button
                  type="button"
                  key={document.id}
                  onClick={() => {
                    onSelectDocument(document)
                    setQuery('')
                  }}
                >
                  <strong>{document.name}</strong>
                  <small>{document.word_count} words</small>
                </button>
              )) : <p>No matching documents</p>}
            </div>
          )}
        </div>
        <div className="notification-wrap">
          <button
            className="icon-button notification-button"
            type="button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => {
              setNotificationsOpen((open) => !open)
              setProfileOpen(false)
            }}
          >
          <span aria-hidden="true">♧</span>
          {notifications.length > 0 && <i />}
          </button>
          {notificationsOpen && (
            <div className="notification-popover">
              {notifications.length === 0 ? <p>No new notifications</p> : (
                <>
                  <div className="notification-popover-header">
                    <strong>Notifications</strong>
                    <button type="button" onClick={onClearNotifications}>Clear all</button>
                  </div>
                  {notifications.map((notification) => (
                    <div className="notification-item" key={notification.id}>
                      <span>{notification.message}</span>
                      <button type="button" onClick={notification.action}>{notification.actionLabel}</button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        <div className="profile-menu-wrap" ref={profileRef}>
          <button
            className="profile-button"
            type="button"
            onClick={() => {
              setProfileOpen((open) => !open)
              setNotificationsOpen(false)
            }}
            aria-label={`Open account menu for ${nickname}`}
            aria-expanded={profileOpen}
          >
            <span className="avatar">{initials}</span>
            <span className="profile-name">{nickname}</span>
            <span className="profile-chevron" aria-hidden="true">⌄</span>
          </button>
          {profileOpen && (
            <div className="profile-menu">
              <p className="profile-email">{email}</p>
              <button type="button" onClick={() => onSignOut()}>Switch account</button>
              <label className="dark-mode-toggle">
                <span>Dark mode</span>
                <input type="checkbox" checked={darkMode} onChange={onToggleDarkMode} />
                <span className="toggle-track" aria-hidden="true"><span /></span>
              </label>
              <button className="logout-button" type="button" onClick={onSignOut}>Log out</button>
            </div>
          )}
        </div>
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
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('matchscore-dark-mode') === 'true')
  const [notifications, setNotifications] = useState<AppNotification[]>([])

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
      setActiveScoreResult(null)
      setActiveDocument(null)
      setUploadedDocument(null)
      return
    }
    loadAccountData()
      .then(({ documents: loadedDocuments, scores }) => {
        setDocuments(loadedDocuments)
        setScoreHistory(scores)
        const latestScore = scores[0]
        const linkedDocument = latestScore?.document_id
          ? loadedDocuments.find((document) => document.id === latestScore.document_id) || null
          : null
        setActiveScoreResult(latestScore || null)
        setActiveDocument(linkedDocument)
        setUploadedDocument(linkedDocument)
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
    const scoredDocumentId = result.document_id || uploadedDocument?.id
    const scoredResult = scoredDocumentId ? { ...result, document_id: scoredDocumentId } : result
    setActiveScoreResult(scoredResult)
    const matchingSavedDocument = scoredDocumentId
      ? documents.find((document) => document.id === scoredDocumentId)
      : undefined
    if (matchingSavedDocument) {
      setActiveDocument(matchingSavedDocument)
      setUploadedDocument(matchingSavedDocument)
    }
    setScoreHistory((prev) => [scoredResult, ...prev.filter((item) => item.id !== result.id)])
    setNotifications((current) => [{
      id: `score-${result.id}`,
      message: `Scoring finished for ${result.job_title} at ${result.company}.`,
      actionLabel: 'View score',
      action: () => {
        setScreen('matchResults')
        setNotifications((items) => items.filter((item) => item.id !== `score-${result.id}`))
      },
    }, ...current.filter((item) => item.id !== `score-${result.id}`)])
    if (result.ai_guidance_used === false) {
      setNotifications((current) => [{
        id: `ai-score-unavailable-${result.id}`,
        message: 'AI scoring was unavailable, so a local score was used instead.',
        actionLabel: 'View score',
        action: () => {
          setScreen('matchResults')
          setNotifications((items) => items.filter((item) => item.id !== `ai-score-unavailable-${result.id}`))
        },
      }, ...current.filter((item) => item.id !== `ai-score-unavailable-${result.id}`)])
    }
    saveAccountScore(scoredResult, matchingSavedDocument?.id || uploadedDocument?.id)
      .then((savedResult) => setScoreHistory((prev) => [savedResult, ...prev.filter((item) => item.id !== result.id && item.id !== savedResult.id)]))
      .catch((error) => {
        console.error('Unable to save score result', error)
        setAccountError('The score was shown, but could not be saved to your account.')
      })
    setScreen('matchResults')
  }

  const handleDocumentSaved = (document: SavedDocument) => {
    setUploadedDocument(document)
    setActiveDocument(document)
    setDocuments((prev) => [document, ...prev.filter((item) => item.id !== document.id)])
  }

  const handleApplyRecommendation = async (recommendation: ScoreResult['recommendations'][number]) => {
    const document = activeDocument || generatedDocument || uploadedDocument
    if (!document || !activeScoreResult) {
      throw new Error('Open or upload a resume before applying a recommendation.')
    }

    const response = await fetch(apiUrl('/api/apply-recommendations'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_text: document.text,
        resume_html: document.html || '',
        recommendations: [recommendation],
        job_title: activeScoreResult.job_title,
      }),
    })
    const result = await response.json()
    if (!response.ok || !result.success || !result.data?.text || !result.data?.html) {
      const errorMessage = result.error || 'AI recommendation application failed.'
      setNotifications((current) => [{
        id: `ai-recommendation-failed-${Date.now()}`,
        message: `AI recommendation could not be applied: ${errorMessage}`,
        actionLabel: 'View feedback',
        action: () => setScreen('recommendations'),
      }, ...current])
      throw new Error(errorMessage)
    }

    const updatedDocument: UploadedDocument = {
      ...document,
      text: result.data.text,
      html: result.data.html,
      format: 'HTML',
      word_count: result.data.text.split(/\s+/).filter(Boolean).length,
      char_count: result.data.text.length,
      summary_preview: result.data.text.slice(0, 150),
    }
    const savedDocument = await saveAccountDocument(
      updatedDocument,
      activeDocument?.name || document.filename.replace(/\.[^/.]+$/, ''),
      document.id,
    )
    setUploadedDocument(savedDocument)
    setActiveDocument(savedDocument)
    setGeneratedDocument(null)
    setDocuments((prev) => [savedDocument, ...prev.filter((item) => item.id !== savedDocument.id)])
    setNotifications((current) => [{
      id: `improved-${savedDocument.id}`,
      message: `${savedDocument.name} was improved with AI.`,
      actionLabel: 'Open editor',
      action: () => {
        setScreen('resumeEditor')
        setNotifications((items) => items.filter((item) => item.id !== `improved-${savedDocument.id}`))
      },
    }, ...current.filter((item) => item.id !== `improved-${savedDocument.id}`)])
    setScreen('resumeEditor')
  }

  const getScoreDocument = () => activeDocument || generatedDocument || uploadedDocument

  const handleImproveResume = async () => {
    const document = getScoreDocument()
    if (!document || !activeScoreResult) {
      throw new Error('Open or upload a resume before improving it with AI.')
    }

    const response = await fetch(apiUrl('/api/apply-recommendations'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_text: document.text,
        resume_html: document.html || '',
        recommendations: activeScoreResult.recommendations,
        job_title: activeScoreResult.job_title,
      }),
    })
    const result = await response.json()
    if (!response.ok || !result.success || !result.data?.text || !result.data?.html) {
      const errorMessage = result.error || 'AI resume improvement failed.'
      setNotifications((current) => [{
        id: `ai-improvement-failed-${Date.now()}`,
        message: `AI resume improvement failed: ${errorMessage}`,
        actionLabel: 'View score',
        action: () => setScreen('matchResults'),
      }, ...current])
      throw new Error(errorMessage)
    }

    const editedDocument: UploadedDocument = {
      ...document,
      text: result.data.text,
      html: result.data.html,
      format: 'HTML',
      word_count: result.data.text.split(/\s+/).filter(Boolean).length,
      char_count: result.data.text.length,
      summary_preview: result.data.text.slice(0, 150),
    }
    const normalizeResumeText = (text: string) => text.replace(/\s+/g, ' ').trim()
    if (normalizeResumeText(editedDocument.text) === normalizeResumeText(document.text)) {
      const errorMessage = 'I can no longer improve this resume from the current information. Add more experience, projects, skills, or measurable results, then try again.'
      setNotifications((current) => [{
        id: `ai-improvement-unchanged-${Date.now()}`,
        message: 'AI can no longer improve this resume. Please add more experience, skills, projects, or measurable results, then try again.',
        actionLabel: 'View score',
        action: () => setScreen('matchResults'),
      }, ...current])
      throw new Error(errorMessage)
    }
    const savedDocument = await saveAccountDocument(
      editedDocument,
      activeDocument?.name || document.filename.replace(/\.[^/.]+$/, ''),
      document.id,
    )
    setUploadedDocument(savedDocument)
    setActiveDocument(savedDocument)
    setGeneratedDocument(null)
    setDocuments((prev) => [savedDocument, ...prev.filter((item) => item.id !== savedDocument.id)])
    setNotifications((current) => [{
      id: `ai-improved-${savedDocument.id}`,
      message: `${savedDocument.name} was improved with AI.`,
      actionLabel: 'Open editor',
      action: () => {
        setScreen('resumeEditor')
        setNotifications((items) => items.filter((item) => item.id !== `ai-improved-${savedDocument.id}`))
      },
    }, ...current.filter((item) => item.id !== `ai-improved-${savedDocument.id}`)])

    if (activeScoreResult.job_description?.trim()) {
      const scoreResponse = await fetch(apiUrl('/api/score'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: savedDocument.text,
          job_description: activeScoreResult.job_description,
          resume_name: savedDocument.name,
          job_title: activeScoreResult.job_title,
          company: activeScoreResult.company,
        }),
      })
      const scorePayload = await scoreResponse.json()
      if (!scoreResponse.ok || !scorePayload.success || !scorePayload.data) {
        const errorMessage = scorePayload.error || 'The improved resume could not be re-scored.'
        setNotifications((current) => [{
          id: `ai-rescore-failed-${Date.now()}`,
          message: `The improved resume could not be re-scored: ${errorMessage}`,
          actionLabel: 'View editor',
          action: () => setScreen('resumeEditor'),
        }, ...current])
        throw new Error(errorMessage)
      }
      const rescoredResult: ScoreResult = {
        ...scorePayload.data,
        document_id: savedDocument.id,
      }
      const savedScore = await saveAccountScore(rescoredResult, savedDocument.id)
      const activeRescoredResult: ScoreResult = {
        ...savedScore,
        document_id: savedDocument.id,
        job_description: rescoredResult.job_description,
      }
      setActiveScoreResult(activeRescoredResult)
      setScoreHistory((prev) => [activeRescoredResult, ...prev.filter((item) => item.id !== savedScore.id)])
    }
    setScreen('resumeEditor')
  }

  const handleEditResumeManually = () => {
    const document = getScoreDocument()
    if (document) {
      setActiveDocument(activeDocument)
      setUploadedDocument(document)
    }
    setScreen('resumeEditor')
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

  const handleScoreDeleted = async (score: ScoreResult) => {
    try {
      await deleteAccountScore(score.id)
      setScoreHistory((prev) => prev.filter((item) => item.id !== score.id))
      if (activeScoreResult?.id === score.id) setActiveScoreResult(null)
    } catch (error) {
      console.error('Unable to delete score history', error)
      setAccountError('The score history entry could not be deleted.')
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
            savedDocuments={documents}
            previousScore={activeScoreResult}
            onDocumentSaved={handleDocumentSaved}
          />
        )
      case 'matchResults':
        return (
          <MatchResults
            result={activeScoreResult}
            onNavigate={setScreen}
            onImproveResume={handleImproveResume}
            onEditManually={handleEditResumeManually}
          />
        )
      case 'recommendations':
        return (
          <AIRecommendations
            recommendations={activeScoreResult?.recommendations}
            targetRole={activeScoreResult?.job_title}
            targetCompany={activeScoreResult?.company}
            documentName={activeScoreResult?.version}
            onApplyRecommendation={handleApplyRecommendation}
            onBackToEditor={() => setScreen('resumeEditor')}
          />
        )
      case 'scoreHistory':
        return (
          <ScoreHistory
            history={scoreHistory}
            onDeleteScore={handleScoreDeleted}
            onViewDetails={(entry) => {
              if (entry) setActiveScoreResult(entry)
              setScreen('matchResults')
            }}
          />
        )
      case 'resumeEditor':
        {
          const editorDocument = activeDocument || generatedDocument || uploadedDocument
          const editorRecommendations = activeScoreResult?.document_id
            && editorDocument?.id === activeScoreResult.document_id
            ? activeScoreResult.recommendations
            : undefined

        return (
          <ResumeEditor
            initialDocument={activeDocument}
            initialContent={generatedDocument}
            onNavigate={setScreen}
            onDocumentUploaded={handleDocumentSaved}
            recommendations={editorRecommendations}
            onViewRecommendations={editorRecommendations ? () => setScreen('recommendations') : undefined}
            onImproveResume={editorRecommendations ? handleImproveResume : undefined}
          />
        )
        }
    }
  }

  return (
    <div className={`app-shell${darkMode ? ' dark-mode' : ''}`}>
      <AppHeader
        screen={screen}
        user={user}
        documents={documents}
        onNavigate={setScreen}
        onSelectDocument={(document) => {
          setActiveDocument(document)
          setUploadedDocument(document)
          setScreen('resumeEditor')
        }}
        onSignOut={() => supabase.auth.signOut()}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((enabled) => {
          const nextValue = !enabled
          localStorage.setItem('matchscore-dark-mode', String(nextValue))
          return nextValue
        })}
        notifications={notifications}
        onClearNotifications={() => setNotifications([])}
      />
      <main className="page-content" key={screen}>{renderScreen()}</main>
      {accountError && <p role="alert" className="account-error">{accountError}</p>}
    </div>
  )
}

export default App
