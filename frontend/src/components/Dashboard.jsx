import { useState, useEffect, useCallback } from 'react'
import SearchConfigCard from './SearchConfigCard.jsx'
import ResultCard from './ResultCard.jsx'
import { apiUrl } from '../api.js'

export default function Dashboard({ onNewSearch }) {
  const [configs, setConfigs] = useState([])
  const [results, setResults] = useState([])
  const [selectedConfigId, setSelectedConfigId] = useState(null)
  const [loadingConfigs, setLoadingConfigs] = useState(true)
  const [loadingResults, setLoadingResults] = useState(false)
  const [error, setError] = useState(null)
  const [resultsOffset, setResultsOffset] = useState(0)
  const RESULTS_LIMIT = 20

  const fetchConfigs = useCallback(async () => {
    setLoadingConfigs(true)
    setError(null)
    try {
      const res = await fetch(apiUrl('/api/search-configs'))
      if (!res.ok) throw new Error('Failed to load configs')
      const data = await res.json()
      setConfigs(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingConfigs(false)
    }
  }, [])

  const fetchResults = useCallback(async (configId, offset = 0) => {
    setLoadingResults(true)
    try {
      const params = new URLSearchParams({ limit: RESULTS_LIMIT, offset })
      if (configId) params.set('config_id', configId)
      const res = await fetch(apiUrl(`/api/results?${params}`))
      if (!res.ok) throw new Error('Failed to load results')
      const data = await res.json()
      if (offset === 0) {
        setResults(data)
      } else {
        setResults(prev => [...prev, ...data])
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingResults(false)
    }
  }, [])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  useEffect(() => {
    setResultsOffset(0)
    fetchResults(selectedConfigId, 0)
  }, [selectedConfigId, fetchResults])

  function handleSelectConfig(id) {
    setSelectedConfigId(prev => prev === id ? null : id)
  }

  function handleLoadMore() {
    const newOffset = resultsOffset + RESULTS_LIMIT
    setResultsOffset(newOffset)
    fetchResults(selectedConfigId, newOffset)
  }

  const selectedConfig = configs.find(c => c.id === selectedConfigId)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 mt-1">Manage your saved searches and view results</p>
        </div>
        <button
          onClick={onNewSearch}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Search
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Saved searches */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Saved Searches
          {configs.length > 0 && (
            <span className="text-sm font-normal text-gray-400">({configs.length})</span>
          )}
        </h3>

        {loadingConfigs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : configs.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-10 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500 font-medium">No saved searches yet</p>
            <p className="text-gray-400 text-sm mt-1">Create a new search to get started</p>
            <button
              onClick={onNewSearch}
              className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Create First Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {configs.map(config => (
              <SearchConfigCard
                key={config.id}
                config={config}
                isSelected={config.id === selectedConfigId}
                onSelect={handleSelectConfig}
                onDelete={() => {
                  if (selectedConfigId === config.id) setSelectedConfigId(null)
                  fetchConfigs()
                }}
                onRun={() => {
                  fetchResults(selectedConfigId, 0)
                  setResultsOffset(0)
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Results */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {selectedConfig ? (
            <>
              Results for <span className="text-indigo-700">"{selectedConfig.name}"</span>
              <button
                onClick={() => setSelectedConfigId(null)}
                className="text-sm font-normal text-gray-400 hover:text-gray-600 underline ml-1"
              >
                Show all
              </button>
            </>
          ) : 'Recent Results'}
          {results.length > 0 && !loadingResults && (
            <span className="text-sm font-normal text-gray-400">({results.length} shown)</span>
          )}
        </h3>

        {loadingResults && resultsOffset === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-10 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 font-medium">No results yet</p>
            <p className="text-gray-400 text-sm mt-1">
              {configs.length > 0 ? 'Run a search to fetch results' : 'Create a search first'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map(result => (
              <ResultCard key={result.id} result={result} />
            ))}
            {results.length >= RESULTS_LIMIT && results.length % RESULTS_LIMIT === 0 && (
              <div className="text-center pt-2">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingResults}
                  className="px-6 py-2.5 border border-indigo-300 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                >
                  {loadingResults ? 'Loading...' : 'Load more results'}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
