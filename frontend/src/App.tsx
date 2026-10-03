import { useState } from 'react'
import './App.css'
import AIRecommendations from './pages/AIRecommendations/AIRecommendations'
import Dashboard from './pages/Dashboard/Dashboard'
import Home from './pages/Home/Home'
import JobMatches from './pages/JobMatches/JobMatches'
import Login from './pages/Login/Login'
import MatchResults from './pages/MatchResults/MatchResults'
import ResumeEditor from './pages/ResumeEditor/ResumeEditor'
import ScoreHistory from './pages/ScoreHistory/ScoreHistory'
import Templates from './pages/Templates/Templates'
import type { ScreenKey } from './pages/screenTypes'

const navigation: { label: string; screen: ScreenKey }[] = [
  { label: 'Dashboard', screen: 'dashboard' },
  { label: 'Templates', screen: 'templates' },
  { label: 'Job Matches', screen: 'jobMatches' },
  { label: 'Feedback', screen: 'recommendations' },
]

function AppHeader({ screen, onNavigate }: { screen: ScreenKey; onNavigate: (screen: ScreenKey) => void }) {
  const activeNav = screen === 'resumeEditor' ? 'templates' : screen === 'matchResults' ? 'jobMatches' : screen === 'scoreHistory' ? 'dashboard' : screen

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
        <button className="profile-button" type="button" onClick={() => onNavigate('login')} aria-label="Open account">
          <span className="avatar">AM</span>
          <span className="profile-name">Alex Mercer</span>
        </button>
      </div>
    </header>
  )
}

function App() {
  const [screen, setScreen] = useState<ScreenKey>('home')

  if (screen === 'home') {
    return <Home onGetStarted={() => setScreen('login')} onSignIn={() => setScreen('login')} />
  }
  if (screen === 'login') {
    return <Login onSignIn={() => setScreen('dashboard')} />
  }

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        return <Dashboard onNavigate={setScreen} />
      case 'templates':
        return <Templates onNavigate={setScreen} />
      case 'jobMatches':
        return <JobMatches onScore={() => setScreen('matchResults')} />
      case 'matchResults':
        return <MatchResults onNavigate={setScreen} />
      case 'recommendations':
        return <AIRecommendations />
      case 'scoreHistory':
        return <ScoreHistory onViewDetails={() => setScreen('matchResults')} />
      case 'resumeEditor':
        return <ResumeEditor onNavigate={setScreen} />
    }
  }

  return (
    <div className="app-shell">
      <AppHeader screen={screen} onNavigate={setScreen} />
      <main className="page-content" key={screen}>{renderScreen()}</main>
    </div>
  )
}

export default App
