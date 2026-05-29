import { motion } from 'framer-motion'

const TYPE_STYLES = {
  invoice: { bg: '#1a2f4e', text: '#60a5fa', border: '#3b82f630' },
  loan_application: { bg: '#251a4a', text: '#a78bfa', border: '#818cf830' },
  government_id: { bg: '#162e25', text: '#34d399', border: '#10b98130' },
  contract: { bg: '#2e2410', text: '#fbbf24', border: '#f59e0b30' },
  bank_statement: { bg: '#122e2c', text: '#2dd4bf', border: '#14b8a630' },
  unknown: { bg: '#1a2030', text: '#94a3b8', border: '#47556930' },
}

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100)
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-2">
        <span className="text-gray-500">Confidence</span>
        <motion.span
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {pct}%
        </motion.span>
      </div>
      <div className="w-full rounded-full h-1.5 bg-[#0f1829]">
        <motion.div
          className="h-1.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 10px ${color}60` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
        />
      </div>
    </div>
  )
}

export default function ResultCard({ result }) {
  const styles = TYPE_STYLES[result.document_type] || TYPE_STYLES.unknown
  const label = result.document_type.replace(/_/g, ' ')
  const fields = result.extracted_fields ? Object.entries(result.extracted_fields) : []

  return (
    <motion.section
      className="py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          className="rounded-2xl border p-8"
          style={{
            background: '#0c1628',
            borderColor: styles.border,
            boxShadow: `0 24px 80px ${styles.text}10`,
          }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-start justify-between mb-6 gap-4">
            <h2 className="text-white font-semibold text-lg truncate">{result.filename}</h2>
            <motion.span
              className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold capitalize border"
              style={{ background: styles.bg, color: styles.text, borderColor: styles.border }}
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, delay: 0.25 }}
            >
              {label}
            </motion.span>
          </div>

          <ConfidenceBar value={result.confidence} />

          {result.summary && (
            <motion.p
              className="mt-5 text-sm text-gray-400 italic pl-3 border-l-2 border-white/10"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
            >
              {result.summary}
            </motion.p>
          )}

          {fields.length > 0 && (
            <div className="mt-6">
              <motion.p
                className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Extracted Fields
              </motion.p>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                {fields.map(([k, v], i) => (
                  <motion.div
                    key={k}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.07, duration: 0.35 }}
                  >
                    <dt className="text-xs text-gray-600 capitalize mb-0.5">
                      {k.replace(/_/g, ' ')}
                    </dt>
                    <dd className="text-sm font-medium text-white">{String(v)}</dd>
                  </motion.div>
                ))}
              </dl>
            </div>
          )}

          <motion.div
            className="mt-6 flex items-center gap-2 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
          >
            <span className="text-xs text-gray-600">Routed to</span>
            <span className="text-sm font-mono font-bold" style={{ color: styles.text }}>
              {result.routed_to}
            </span>
          </motion.div>

          {result.extracted_text && (
            <motion.details
              className="mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 transition-colors select-none">
                Extracted text preview
              </summary>
              <pre className="mt-2 text-xs bg-[#070c1a] p-3 rounded-lg overflow-auto max-h-32 text-gray-500 whitespace-pre-wrap">
                {result.extracted_text}
              </pre>
            </motion.details>
          )}
        </motion.div>
      </div>
    </motion.section>
  )
}
