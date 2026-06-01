import { useState } from 'react'

const FREQ_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }
const DB_LABELS = {
  openalex: 'OpenAlex',
  pubmed: 'PubMed',
  semantic_scholar: 'Semantic Scholar',
  core: 'CORE',
}

export default function SearchConfigCard({ config, onDelete, onRun, onSelect, isSelected }) {
  const [running, setRunning] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [runMessage, setRunMessage] = useState(null)

  async function handleRun(e) {
    e.stopPropagation()
    setRunning(true)
    setRunMessage(null)
    try {
      const res = await fetch(`/api/search-configs/${config.id}/run`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setRunMessage(`✓ Found ${data.new_results} new result${data.new_results !== 1 ? 's' : ''}`)
        onRun && onRun()
      } else {
        setRunMessage(`Error: ${data.detail || 'Search failed'}`)
      }
    } catch (e) {
      setRunMessage('Network error')
    } finally {
      setRunning(false)
      setTimeout(() => setRunMessage(null), 5000)
    }
  }

  async function handleDelete(e) {
    e.stopPropagation()
    if (!window.confirm(`Delete search "${config.name}"?`)) return
    setDeleting(true)
    try {
      await fetch(`/api/search-configs/${config.id}`, { method: 'DELETE' })
      onDelete && onDelete()
    } finally {
      setDeleting(false)
    }
  }

  const createdDate = new Date(config.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
  const lastRunDate = config.last_run_at
    ? new Date(config.last_run_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      })
    : null

  const dbList = (config.databases || []).map(d => DB_LABELS[d] || d).join(', ')

  return (
    <div
      onClick={() => onSelect && onSelect(config.id)}
      className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{config.name}</h3>
          <p className="text-sm text-indigo-700 font-mono mt-0.5 break-all">
            "{config.keywords}"
          </p>
        </div>
        <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
          config.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {config.is_active ? 'Active' : 'Paused'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-xs mb-3">
        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md font-medium">
          {FREQ_LABELS[config.frequency] || config.frequency}
        </span>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
          {dbList}
        </span>
        {config.notification_method === 'email' && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
            📧 {config.notification_email}
          </span>
        )}
        {config.universities?.length > 0 && (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md">
            {config.universities.length} univ.
          </span>
        )}
        {config.journals?.length > 0 && (
          <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-md">
            {config.journals.length} journals
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400 space-y-0.5">
          <div>Created: {createdDate}</div>
          {lastRunDate && <div>Last run: {lastRunDate}</div>}
        </div>
        <div className="flex items-center gap-2">
          {runMessage && (
            <span className={`text-xs ${runMessage.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
              {runMessage}
            </span>
          )}
          <button
            onClick={handleRun}
            disabled={running}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
          >
            {running ? (
              <>
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running...
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run Now
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {deleting ? '...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
