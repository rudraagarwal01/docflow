import { useCallback, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import UploadZone from './components/UploadZone'
import Processing from './components/Processing'
import ResultCard from './components/ResultCard'
import History from './components/History'

const API = 'http://localhost:8000'

export default function App() {
  const [step, setStep] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [historyKey, setHistoryKey] = useState(0)
  const uploadRef = useRef(null)

  const scrollToUpload = useCallback(() => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

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
      setHistoryKey((k) => k + 1)
    } catch (e) {
      setError(e.message)
      setStep(null)
    }
  }, [])

  const busy = step !== null && step !== 'Complete'

  return (
    <div className="bg-[#0a0f1e] min-h-screen">
      <Hero onScrollToUpload={scrollToUpload} />
      <HowItWorks />
      <UploadZone onFile={processFile} busy={busy} uploadRef={uploadRef} />

      <Processing currentStep={step} />

      <AnimatePresence>
        {error && (
          <div className="max-w-3xl mx-auto px-6">
            <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3 text-red-400 text-sm">
              <span className="font-semibold">Error: </span>{error}
            </div>
          </div>
        )}
        {result && step === 'Complete' && (
          <ResultCard key={`${result.filename}-${result.timestamp}`} result={result} />
        )}
      </AnimatePresence>

      <History refreshKey={historyKey} />

      <footer className="py-10 text-center text-gray-700 text-xs border-t border-white/5 bg-[#070c1a]">
        DocFlow — Automated document intake &middot; Classification &middot; Routing
      </footer>
    </div>
  )
}
