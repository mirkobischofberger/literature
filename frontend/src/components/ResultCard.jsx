export default function ResultCard({ result }) {
  const {
    title,
    authors = [],
    journal,
    year,
    abstract,
    url,
    doi,
    source_db,
    fetched_at,
  } = result

  const authorDisplay = authors.length > 0
    ? (authors.length > 3
        ? authors.slice(0, 3).join(', ') + ' et al.'
        : authors.join(', '))
    : null

  const abstractSnippet = abstract
    ? (abstract.length > 280 ? abstract.slice(0, 280) + '…' : abstract)
    : null

  const sourceColors = {
    OpenAlex: 'bg-purple-100 text-purple-700',
    PubMed: 'bg-blue-100 text-blue-700',
    'Semantic Scholar': 'bg-teal-100 text-teal-700',
    CORE: 'bg-orange-100 text-orange-700',
  }
  const badgeClass = sourceColors[source_db] || 'bg-gray-100 text-gray-600'

  const fetchedDate = fetched_at
    ? new Date(fetched_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-gray-900 leading-snug flex-1">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-700 transition-colors"
            >
              {title}
            </a>
          ) : title}
        </h3>
        {source_db && (
          <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
            {source_db}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mb-3">
        {authorDisplay && <span>{authorDisplay}</span>}
        {(journal || year) && (
          <span className="flex items-center gap-1">
            {journal && <span className="text-gray-400">·</span>}
            {journal && <span className="italic">{journal}</span>}
            {year && <span className="font-medium text-gray-600">{year}</span>}
          </span>
        )}
      </div>

      {abstractSnippet && (
        <p className="text-sm text-gray-600 leading-relaxed mb-3">{abstractSnippet}</p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          {doi && (
            <a
              href={`https://doi.org/${doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-800 font-mono"
            >
              DOI: {doi}
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          {fetchedDate && (
            <span className="text-xs text-gray-400">Found {fetchedDate}</span>
          )}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View paper
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
