import { useState } from 'react'
import Wizard from './components/Wizard.jsx'
import Dashboard from './components/Dashboard.jsx'

export default function App() {
  const [view, setView] = useState('dashboard') // 'dashboard' | 'wizard'
  const [refreshKey, setRefreshKey] = useState(0)

  function handleWizardComplete() {
    setRefreshKey(k => k + 1)
    setView('dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-indigo-700 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h1 className="text-2xl font-bold text-white tracking-tight">LiteratureSearch</h1>
          </div>
          <nav className="flex gap-2">
            <button
              onClick={() => setView('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'dashboard'
                  ? 'bg-white text-indigo-700'
                  : 'text-indigo-100 hover:bg-indigo-600'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setView('wizard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'wizard'
                  ? 'bg-white text-indigo-700'
                  : 'text-indigo-100 hover:bg-indigo-600'
              }`}
            >
              + New Search
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {view === 'wizard' ? (
          <Wizard onComplete={handleWizardComplete} onCancel={() => setView('dashboard')} />
        ) : (
          <Dashboard key={refreshKey} onNewSearch={() => setView('wizard')} />
        )}
      </main>
    </div>
  )
}
