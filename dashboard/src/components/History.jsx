import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const API = 'http://localhost:8000'

const TYPE_COLORS = {
  invoice: '#60a5fa',
  loan_application: '#a78bfa',
  government_id: '#34d399',
  contract: '#fbbf24',
  bank_statement: '#2dd4bf',
  unknown: '#94a3b8',
}

export default function History({ refreshKey }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetch(`${API}/history`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data) => setRecords(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [refreshKey])

  return (
    <section className="py-32 px-6 bg-[#070c1a]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-emerald-500 mb-4">Audit log</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Processing history</h2>
          <p className="text-gray-500 text-lg">Every document that passed through the pipeline.</p>
        </motion.div>

        {loading && (
          <div className="flex justify-center py-20">
            <motion.div
              className="w-8 h-8 rounded-full border-2 border-t-blue-500 border-white/10"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
            />
          </div>
        )}

        {!loading && error && (
          <motion.p
            className="text-center text-red-400/60 py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Could not load history — is the backend running?
          </motion.p>
        )}

        {!loading && !error && records.length === 0 && (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-600">No documents processed yet.</p>
            <p className="text-gray-700 text-sm mt-1">Drop one above to get started.</p>
          </motion.div>
        )}

        {!loading && !error && records.length > 0 && (
          <motion.div
            className="rounded-2xl overflow-hidden border border-white/5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid grid-cols-4 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 bg-[#0a0f1e] border-b border-white/5">
              <span>File</span>
              <span>Type</span>
              <span>Queue</span>
              <span className="text-right">Timestamp</span>
            </div>

            {records.map((rec, i) => (
              <motion.div
                key={`${rec.timestamp}-${rec.filename}`}
                className="grid grid-cols-4 px-6 py-4 items-center border-b border-white/5 last:border-0 bg-[#0c1220] hover:bg-[#0f172a] transition-colors"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}
              >
                <span className="text-sm text-white truncate pr-4 font-medium">{rec.filename}</span>
                <span
                  className="text-xs font-medium capitalize"
                  style={{ color: TYPE_COLORS[rec.document_type] || '#94a3b8' }}
                >
                  {rec.document_type.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-mono text-gray-500">{rec.queue}</span>
                <span className="text-xs text-gray-600 text-right tabular-nums">
                  {new Date(rec.timestamp).toLocaleString()}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}
