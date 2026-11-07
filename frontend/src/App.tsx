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
import { deleteAccountDocument, deleteAccountScore, loadAccountData, saveAccountDocument, saveAccountScore } from './lib/accountStorage'
import { apiUrl } from './api'

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
    const scoredDocumentId = uploadedDocument?.id
    const scoredResult = scoredDocumentId ? { ...result, document_id: scoredDocumentId } : result
    setActiveScoreResult(scoredResult)
    setScoreHistory((prev) => [scoredResult, ...prev.filter((item) => item.id !== result.id)])
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
      throw new Error(result.error || 'AI recommendation application failed.')
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
      throw new Error(result.error || 'AI resume improvement failed.')
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
      throw new Error('I can no longer improve this resume from the current information. Add more experience, projects, skills, or measurable results, then try again.')
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
        throw new Error(scorePayload.error || 'The improved resume could not be re-scored.')
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
    <div className="app-shell">
      <AppHeader screen={screen} user={user} onNavigate={setScreen} onSignOut={() => supabase.auth.signOut()} />
      <main className="page-content" key={screen}>{renderScreen()}</main>
      {accountError && <p role="alert" className="account-error">{accountError}</p>}
    </div>
  )
}

export default App
