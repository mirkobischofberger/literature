import { useState } from 'react'
import { UNIVERSITIES } from '../data/universities.js'
import { JOURNALS } from '../data/journals.js'
import { apiUrl } from '../api.js'

const STEPS = [
  { id: 1, title: 'Universities', description: 'Filter by institution (optional)' },
  { id: 2, title: 'Journals', description: 'Filter by publication venue (optional)' },
  { id: 3, title: 'Databases', description: 'Choose which databases to search' },
  { id: 4, title: 'Keywords', description: 'What topics to search for' },
  { id: 5, title: 'Frequency', description: 'How often to run the search' },
  { id: 6, title: 'Notifications', description: 'How to receive results' },
  { id: 7, title: 'Review', description: 'Confirm and save your search' },
]

const DATABASES = [
  {
    id: 'openalex',
    name: 'OpenAlex',
    description: 'Massive open catalog of scholarly works. No API key required.',
    icon: '🔬',
  },
  {
    id: 'pubmed',
    name: 'PubMed',
    description: 'NCBI biomedical and life sciences literature database.',
    icon: '🧬',
  },
  {
    id: 'semantic_scholar',
    name: 'Semantic Scholar',
    description: 'AI-powered research discovery across all fields.',
    icon: '🤖',
  },
  {
    id: 'core',
    name: 'CORE',
    description: 'Open access research papers from repositories worldwide.',
    icon: '📂',
  },
]

function SearchableMultiSelect({ items, selected, onChange, placeholder }) {
  const [query, setQuery] = useState('')

  const filtered = items.filter(
    item => item.toLowerCase().includes(query.toLowerCase())
  )

  function toggle(item) {
    if (selected.includes(item)) {
      onChange(selected.filter(s => s !== item))
    } else {
      onChange([...selected, item])
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
        />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(item => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium"
            >
              {item}
              <button
                onClick={() => toggle(item)}
                className="text-indigo-500 hover:text-indigo-700 ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
          <button
            onClick={() => onChange([])}
            className="text-xs text-gray-500 hover:text-red-500 underline"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">No results found</div>
        ) : (
          filtered.map(item => (
            <label
              key={item}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(item)}
                onChange={() => toggle(item)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{item}</span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}

function StepUniversities({ value, onChange }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
        <strong>Optional:</strong> Select specific universities to filter results. Leave empty to search all institutions.
      </div>
      <SearchableMultiSelect
        items={UNIVERSITIES}
        selected={value}
        onChange={onChange}
        placeholder="Search universities..."
      />
    </div>
  )
}

function StepJournals({ value, onChange }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
        <strong>Optional:</strong> Select specific journals to filter results. Leave empty to search all journals.
      </div>
      <SearchableMultiSelect
        items={JOURNALS}
        selected={value}
        onChange={onChange}
        placeholder="Search journals..."
      />
    </div>
  )
}

function StepDatabases({ value, onChange }) {
  function toggle(id) {
    if (value.includes(id)) {
      if (value.length === 1) return // keep at least one
      onChange(value.filter(v => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
    <div className="space-y-3">
      {DATABASES.map(db => (
        <label
          key={db.id}
          className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            value.includes(db.id)
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300 bg-white'
          }`}
        >
          <input
            type="checkbox"
            checked={value.includes(db.id)}
            onChange={() => toggle(db.id)}
            className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <div className="flex items-start gap-3 flex-1">
            <span className="text-2xl leading-tight">{db.icon}</span>
            <div>
              <div className="font-semibold text-gray-900">{db.name}</div>
              <div className="text-sm text-gray-500 mt-0.5">{db.description}</div>
            </div>
          </div>
        </label>
      ))}
    </div>
  )
}

function StepKeywords({ value, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search name (optional)
        </label>
        <input
          type="text"
          value={value.name}
          onChange={e => onChange({ ...value, name: e.target.value })}
          placeholder="e.g. My deep learning research"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Keywords / Topics <span className="text-red-500">*</span>
        </label>
        <textarea
          value={value.keywords}
          onChange={e => onChange({ ...value, keywords: e.target.value })}
          placeholder="e.g. machine learning protein folding&#10;Use natural language or keywords separated by spaces"
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          Enter one or more keywords. You can use natural language queries like "transformer models for image recognition".
        </p>
      </div>
    </div>
  )
}

function StepFrequency({ value, onChange }) {
  const options = [
    { id: 'daily', label: 'Daily', desc: 'Run every day at 8:00 AM', icon: '☀️' },
    { id: 'weekly', label: 'Weekly', desc: 'Run every Monday at 8:00 AM', icon: '📅' },
    { id: 'monthly', label: 'Monthly', desc: 'Run on the 1st of each month', icon: '🗓️' },
  ]

  return (
    <div className="space-y-3">
      {options.map(opt => (
        <label
          key={opt.id}
          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            value === opt.id
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300 bg-white'
          }`}
        >
          <input
            type="radio"
            name="frequency"
            value={opt.id}
            checked={value === opt.id}
            onChange={() => onChange(opt.id)}
            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
          />
          <span className="text-2xl">{opt.icon}</span>
          <div>
            <div className="font-semibold text-gray-900">{opt.label}</div>
            <div className="text-sm text-gray-500">{opt.desc}</div>
          </div>
        </label>
      ))}
    </div>
  )
}

function StepNotifications({ value, onChange }) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <label
          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            value.method === 'dashboard'
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300 bg-white'
          }`}
        >
          <input
            type="radio"
            name="notification"
            value="dashboard"
            checked={value.method === 'dashboard'}
            onChange={() => onChange({ ...value, method: 'dashboard', email: '' })}
            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
          />
          <span className="text-2xl">📊</span>
          <div>
            <div className="font-semibold text-gray-900">Dashboard only</div>
            <div className="text-sm text-gray-500">View results on this dashboard when you log in</div>
          </div>
        </label>

        <label
          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            value.method === 'email'
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300 bg-white'
          }`}
        >
          <input
            type="radio"
            name="notification"
            value="email"
            checked={value.method === 'email'}
            onChange={() => onChange({ ...value, method: 'email' })}
            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
          />
          <span className="text-2xl">📧</span>
          <div>
            <div className="font-semibold text-gray-900">Email notifications</div>
            <div className="text-sm text-gray-500">Receive new results by email</div>
          </div>
        </label>
      </div>

      {value.method === 'email' && (
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={value.email}
            onChange={e => onChange({ ...value, email: e.target.value })}
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
      )}
    </div>
  )
}

function ReviewRow({ label, value }) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return (
      <div className="flex justify-between py-3 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className="text-sm text-gray-400 italic">Any / not filtered</span>
      </div>
    )
  }
  return (
    <div className="flex justify-between py-3 border-b border-gray-100 gap-4">
      <span className="text-sm font-medium text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right">
        {Array.isArray(value) ? value.join(', ') : value}
      </span>
    </div>
  )
}

function StepReview({ data }) {
  const dbNames = data.databases
    .map(id => DATABASES.find(d => d.id === id)?.name || id)
    .join(', ')

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
        Review your search configuration before saving.
      </div>
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-2">
        <ReviewRow label="Name" value={data.name} />
        <ReviewRow label="Keywords" value={data.keywords} />
        <ReviewRow label="Universities" value={data.universities} />
        <ReviewRow label="Journals" value={data.journals} />
        <ReviewRow label="Databases" value={dbNames} />
        <ReviewRow label="Frequency" value={data.frequency} />
        <ReviewRow
          label="Notifications"
          value={data.notif.method === 'email' ? `Email → ${data.notif.email}` : 'Dashboard only'}
        />
      </div>
    </div>
  )
}

export default function Wizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(1)
  const [universities, setUniversities] = useState([])
  const [journals, setJournals] = useState([])
  const [databases, setDatabases] = useState(['openalex'])
  const [keywordsData, setKeywordsData] = useState({ name: '', keywords: '' })
  const [frequency, setFrequency] = useState('weekly')
  const [notif, setNotif] = useState({ method: 'dashboard', email: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const totalSteps = STEPS.length
  const progress = ((step - 1) / (totalSteps - 1)) * 100

  function canProceed() {
    if (step === 3 && databases.length === 0) return false
    if (step === 4 && !keywordsData.keywords.trim()) return false
    if (step === 6 && notif.method === 'email' && !notif.email.trim()) return false
    return true
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: keywordsData.name || keywordsData.keywords.slice(0, 60),
        universities,
        journals,
        databases,
        keywords: keywordsData.keywords,
        frequency,
        notification_method: notif.method,
        notification_email: notif.method === 'email' ? notif.email : null,
      }
      const res = await fetch(apiUrl('/api/search-configs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to save')
      }
      onComplete()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const currentStep = STEPS[step - 1]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-indigo-700">
            Step {step} of {totalSteps}: {currentStep.title}
          </span>
          <span className="text-sm text-gray-500">{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step dots */}
        <div className="flex justify-between mt-3">
          {STEPS.map(s => (
            <div
              key={s.id}
              className={`flex flex-col items-center gap-1 cursor-pointer`}
              onClick={() => s.id < step && setStep(s.id)}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  s.id < step
                    ? 'bg-indigo-600 text-white'
                    : s.id === step
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-200'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s.id < step ? '✓' : s.id}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5">
          <h2 className="text-xl font-bold text-white">{currentStep.title}</h2>
          <p className="text-indigo-200 text-sm mt-0.5">{currentStep.description}</p>
        </div>

        <div className="p-6">
          {step === 1 && <StepUniversities value={universities} onChange={setUniversities} />}
          {step === 2 && <StepJournals value={journals} onChange={setJournals} />}
          {step === 3 && <StepDatabases value={databases} onChange={setDatabases} />}
          {step === 4 && <StepKeywords value={keywordsData} onChange={setKeywordsData} />}
          {step === 5 && <StepFrequency value={frequency} onChange={setFrequency} />}
          {step === 6 && <StepNotifications value={notif} onChange={setNotif} />}
          {step === 7 && (
            <StepReview
              data={{ ...keywordsData, universities, journals, databases, frequency, notif }}
            />
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <button
            onClick={step === 1 ? onCancel : () => setStep(s => s - 1)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>

          <div className="flex gap-2">
            {step < totalSteps ? (
              <>
                {(step === 1 || step === 2) && (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  '✓ Save Search'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
