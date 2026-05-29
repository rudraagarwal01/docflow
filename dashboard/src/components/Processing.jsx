import { motion, AnimatePresence } from 'framer-motion'

const PIPELINE_STEPS = ['Extracting', 'Classifying', 'Routing']

const STEP_META = {
  Extracting: { icon: '📤', desc: 'Reading document text…', color: '#3b82f6' },
  Classifying: { icon: '🧠', desc: 'Identifying document type…', color: '#818cf8' },
  Routing: { icon: '📬', desc: 'Sending to output queue…', color: '#a78bfa' },
}

export default function Processing({ currentStep }) {
  const active = currentStep && currentStep !== 'Complete'
  const meta = STEP_META[currentStep] || {}
  const stepIdx = PIPELINE_STEPS.indexOf(currentStep)

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
          style={{ background: 'rgba(7, 12, 26, 0.96)', backdropFilter: 'blur(12px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute w-64 h-64 rounded-full"
            style={{ background: `radial-gradient(circle, ${meta.color}20 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              className="relative text-center mb-16"
              initial={{ opacity: 0, y: 30, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.85 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="text-8xl mb-6 select-none"
                animate={{ rotate: [0, -6, 6, -3, 3, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              >
                {meta.icon}
              </motion.div>
              <h2 className="text-4xl font-black text-white mb-3">{currentStep}</h2>
              <p className="text-gray-500 text-lg">{meta.desc}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-4">
            {PIPELINE_STEPS.map((step, i) => {
              const done = i < stepIdx
              const isActive = i === stepIdx
              const c = STEP_META[step].color
              return (
                <div key={step} className="flex items-center gap-4">
                  <motion.div
                    className="relative flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold text-white"
                    animate={{
                      backgroundColor: done ? '#10b981' : isActive ? c : '#1e293b',
                      boxShadow: isActive ? `0 0 24px ${c}80, 0 0 48px ${c}40` : 'none',
                      scale: isActive ? 1.15 : 1,
                    }}
                    transition={{ duration: 0.35 }}
                  >
                    {done ? '✓' : i + 1}
                  </motion.div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <motion.div
                      className="h-px w-10"
                      animate={{ backgroundColor: done ? '#10b981' : '#1e293b' }}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
