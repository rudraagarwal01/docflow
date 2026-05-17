import { useState, useRef, useCallback } from 'react'

const API = 'http://localhost:8000'

const STEPS = ['Extracting', 'Classifying', 'Routing', 'Complete']

const TYPE_COLORS = {
  invoice: 'bg-blue-100 text-blue-800',
  loan_application: 'bg-purple-100 text-purple-800',
  government_id: 'bg-green-100 text-green-800',
  contract: 'bg-amber-100 text-amber-800',
  bank_statement: 'bg-teal-100 text-teal-800',
  unknown: 'bg-gray-100 text-gray-800',
}

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100)
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Confidence</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-1 my-6 flex-wrap">
      {STEPS.map((step, i) => {
        const stepIdx = STEPS.indexOf(currentStep)
        const done = i < stepIdx
        const active = i === stepIdx
        return (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold
                ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-200 text-gray-500'}`}
            >
              {done ? '✓' : i + 1}
            </div>
            <span
              className={`ml-1 text-sm ${active ? 'font-semibold text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}
            >
              {step}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 h-0.5 w-6 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ResultCard({ result }) {
  const badge = TYPE_COLORS[result.document_type] || TYPE_COLORS.unknown
  const label = result.document_type.replace(/_/g, ' ')
  return (
    <div className="mt-6 bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 truncate pr-3">{result.filename}</h2>
        <span className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium capitalize ${badge}`}>
          {label}
        </span>
      </div>

      <ConfidenceBar value={result.confidence} />

      {result.summary && (
        <p className="mt-4 text-sm text-gray-600 italic">{result.summary}</p>
      )}

      {result.extracted_fields && Object.keys(result.extracted_fields).length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Extracted Fields</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            {Object.entries(result.extracted_fields).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-gray-500 capitalize">{k.replace(/_/g, ' ')}</dt>
                <dd className="text-sm font-medium text-gray-800">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
        <span className="text-xs text-gray-500">Routed to queue:</span>
        <span className="text-sm font-mono font-semibold text-indigo-700">{result.routed_to}</span>
      </div>

      {result.extracted_text && (
        <details className="mt-4">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 select-none">
            Extracted text preview
          </summary>
          <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto max-h-32 text-gray-600 whitespace-pre-wrap">
            {result.extracted_text}
          </pre>
        </details>
      )}
    </div>
  )
}

export default function App() {
  const [dragging, setDragging] = useState(false)
  const [step, setStep] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInput = useRef(null)

  const processFile = useCallback(async (file) => {
    setResult(null)
    setError(null)
    setStep('Extracting')

    const form = new FormData()
    form.append('file', file)

    const fetchPromise = fetch(`${API}/upload`, { method: 'POST', body: form })

    await new Promise((r) => setTimeout(r, 800))
    setStep('Classifying')
    await new Promise((r) => setTimeout(r, 900))
    setStep('Routing')
    await new Promise((r) => setTimeout(r, 500))
    setStep('Complete')

    try {
      const resp = await fetchPromise
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: `HTTP ${resp.status}` }))
        throw new Error(err.detail || `HTTP ${resp.status}`)
      }
      const data = await resp.json()
      setResult(data)
    } catch (e) {
      setError(e.message)
      setStep(null)
    }
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const onFileChange = useCallback(
    (e) => {
      const file = e.target.files[0]
      if (file) processFile(file)
      e.target.value = ''
    },
    [processFile],
  )

  const busy = step !== null && step !== 'Complete'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">DocFlow</h1>
          <p className="mt-1 text-gray-500 text-sm">
            Automated document intake &middot; Classification &middot; Routing
          </p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !busy && fileInput.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all
            ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
            ${busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
            className="hidden"
            onChange={onFileChange}
            disabled={busy}
          />
          <div className="text-4xl mb-3 select-none">📄</div>
          <p className="text-gray-700 font-medium">
            {dragging ? 'Drop it!' : 'Drop a PDF or image here'}
          </p>
          <p className="text-gray-400 text-sm mt-1">or click to browse</p>
          <p className="text-gray-300 text-xs mt-3">PDF &middot; PNG &middot; JPEG &middot; TIFF &middot; BMP</p>
        </div>

        {step && <StepIndicator currentStep={step} />}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {result && step === 'Complete' && <ResultCard result={result} />}
      </div>
    </div>
  )
}
