import { motion } from 'framer-motion'

const STEPS = [
  {
    icon: '📤',
    title: 'Extract',
    desc: 'Text pulled from PDFs via pdfplumber and from images via Tesseract OCR — simulating AWS Textract.',
    color: '#3b82f6',
    number: '01',
  },
  {
    icon: '🧠',
    title: 'Classify',
    desc: 'Claude Sonnet reads the extracted text, identifies the document type, pulls key fields, and scores confidence.',
    color: '#818cf8',
    number: '02',
  },
  {
    icon: '📬',
    title: 'Route',
    desc: 'Documents land in typed output queues with a full JSONL audit trail — ready for downstream processing.',
    color: '#10b981',
    number: '03',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
}

const card = {
  hidden: { opacity: 0, y: 50 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

export default function HowItWorks() {
  return (
    <section className="py-32 px-6 bg-[#070c1a]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-4">Pipeline</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">How it works</h2>
          <p className="text-gray-500 text-lg">Three stages. Fully automated.</p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {STEPS.map((step) => (
            <motion.div
              key={step.title}
              variants={card}
              className="relative rounded-2xl p-8 border border-white/5 bg-[#0a1020] flex flex-col overflow-hidden"
              whileHover={{ y: -6, borderColor: `${step.color}40`, boxShadow: `0 20px 60px ${step.color}15` }}
              transition={{ duration: 0.25 }}
            >
              <span
                className="absolute top-4 right-5 text-6xl font-black opacity-5 select-none"
                style={{ color: step.color }}
              >
                {step.number}
              </span>

              <motion.div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-6"
                style={{
                  background: `${step.color}15`,
                  boxShadow: `0 0 24px ${step.color}25`,
                }}
                whileHover={{ scale: 1.1, rotate: -5 }}
              >
                {step.icon}
              </motion.div>

              <h3 className="text-xl font-bold mb-3" style={{ color: step.color }}>
                {step.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>

              <motion.div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${step.color}40, transparent)` }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
