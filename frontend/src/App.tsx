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

function AppHeader({ screen, onNavigate, darkMode, onToggleDarkMode }: { screen: ScreenKey; onNavigate: (screen: ScreenKey) => void; darkMode: boolean; onToggleDarkMode: () => void }) {
  const activeNav = screen === 'resumeEditor' ? 'templates' : screen === 'matchResults' ? 'jobMatches' : screen === 'scoreHistory' ? 'dashboard' : screen
  const [showProfileMenu, setShowProfileMenu] = useState(false)

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
        <button className="profile-button" type="button" onClick={() => setShowProfileMenu((visible) => !visible)} aria-label="Open account">
          <span className="avatar">AM</span>
          <span className="profile-name">Alex Mercer</span>
        </button>
        {showProfileMenu && <div className="profile-menu">
          <strong>Alex Mercer</strong>
          <small>hello@earlycareer.dev</small>
          <button type="button" onClick={onToggleDarkMode}>{darkMode ? '☀  Use light mode' : '☾  Use dark mode'}</button>
          <button type="button" onClick={() => setShowProfileMenu(false)}>⚙  Profile settings</button>
          <button type="button" onClick={() => onNavigate('login')}>↪  Sign out</button>
        </div>}
      </div>
    </header>
  )
}

function App() {
  const [screen, setScreen] = useState<ScreenKey>('home')
  const [darkMode, setDarkMode] = useState(false)

  if (screen === 'home') {
    return <div className={darkMode ? 'theme-dark' : ''}><Home darkMode={darkMode} onToggleDarkMode={() => setDarkMode((current) => !current)} onGetStarted={() => setScreen('login')} onSignIn={() => setScreen('login')} /></div>
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
      case 'blankEditor':
        return <ResumeEditor onNavigate={setScreen} blank />
    }
  }

  return (
    <div className={`app-shell ${darkMode ? 'theme-dark' : ''}`}>
      <AppHeader screen={screen} onNavigate={setScreen} darkMode={darkMode} onToggleDarkMode={() => setDarkMode((current) => !current)} />
      <main className="page-content" key={screen}>{renderScreen()}</main>
    </div>
  )
}

export default App
