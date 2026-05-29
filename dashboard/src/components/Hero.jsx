import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

const FLOATING_DOCS = [
  { label: 'Invoice_Q1.pdf', type: 'invoice', left: '72%', top: '22%', rotate: 12 },
  { label: 'Contract.pdf', type: 'contract', left: '15%', top: '30%', rotate: -8 },
  { label: 'LoanApp.pdf', type: 'loan', left: '68%', top: '68%', rotate: -14 },
  { label: 'Statement.pdf', type: 'bank', left: '18%', top: '65%', rotate: 7 },
]

const DOC_COLORS = {
  invoice: { bg: '#1e3a5f', text: '#60a5fa', border: '#3b82f640' },
  contract: { bg: '#2a1f4e', text: '#a78bfa', border: '#818cf840' },
  loan: { bg: '#2e1b5e', text: '#c4b5fd', border: '#7c3aed40' },
  bank: { bg: '#1a3a38', text: '#2dd4bf', border: '#14b8a640' },
}

export default function Hero({ onScrollToUpload }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0f1e]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,_#1e3a5f22_0%,_transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_50%_50%,_#3b82f608_0%,_transparent_60%)]" />

      {FLOATING_DOCS.map((doc, i) => {
        const c = DOC_COLORS[doc.type]
        return (
          <motion.div
            key={doc.label}
            className="absolute hidden lg:block select-none"
            style={{ left: doc.left, top: doc.top, rotate: doc.rotate }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{
              opacity: [0, 0.6, 0.5, 0.6],
              y: [0, -12, 0, -8, 0],
              scale: [0.7, 1, 1],
            }}
            transition={{
              opacity: { duration: 0.8, delay: 0.6 + i * 0.2 },
              y: { duration: 5 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 },
              scale: { duration: 0.8, delay: 0.6 + i * 0.2 },
            }}
          >
            <div
              className="px-3 py-2 rounded-lg text-xs font-mono backdrop-blur-sm border flex items-center gap-2"
              style={{ background: c.bg, borderColor: c.border, color: c.text }}
            >
              <span>📄</span>
              <span>{doc.label}</span>
            </div>
          </motion.div>
        )
      })}

      <motion.div
        className="relative z-10 text-center px-6 max-w-4xl mx-auto"
        style={{ y, opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-8 border border-blue-500/20 text-blue-400 bg-blue-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Intelligent Document Processing
          </span>
        </motion.div>

        <motion.h1
          className="text-7xl md:text-9xl font-black tracking-tight text-white mb-6 leading-none"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Doc
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #a78bfa 100%)' }}
          >
            Flow
          </span>
        </motion.h1>

        <motion.p
          className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          Automated intake, classification, and routing — powered by AI. Drop a document and watch the pipeline work.
        </motion.p>

        <motion.button
          onClick={onScrollToUpload}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-semibold text-base"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            boxShadow: '0 0 30px #3b82f640',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 50px #3b82f660' }}
          whileTap={{ scale: 0.97 }}
        >
          Try it now
          <motion.span
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            className="text-lg"
          >
            ↓
          </motion.span>
        </motion.button>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#070c1a] to-transparent" />
    </section>
  )
}
