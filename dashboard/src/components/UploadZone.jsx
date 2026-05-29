import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useCallback, useState } from 'react'

export default function UploadZone({ onFile, busy, uploadRef }) {
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef(null)

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  const onFileChange = useCallback(
    (e) => {
      const file = e.target.files[0]
      if (file) onFile(file)
      e.target.value = ''
    },
    [onFile],
  )

  return (
    <section ref={uploadRef} className="py-32 px-6 bg-[#0a0f1e]">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-purple-500 mb-4">Upload</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Process a document</h2>
          <p className="text-gray-500 text-lg">Drop any PDF or image — the pipeline handles the rest.</p>
        </motion.div>

        <motion.div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !busy && fileInput.current?.click()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          animate={dragging ? { scale: 1.02 } : { scale: 1 }}
          className={`relative rounded-3xl p-20 text-center border-2 border-dashed
            ${dragging ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-white/20 bg-white/[0.01] hover:bg-white/[0.025]'}
            ${busy ? 'cursor-not-allowed opacity-50 pointer-events-none' : 'cursor-pointer'}`}
          style={dragging ? { boxShadow: '0 0 60px #3b82f620, inset 0 0 60px #3b82f608' } : {}}
        >
          {[
            'top-4 left-4 border-t-2 border-l-2',
            'top-4 right-4 border-t-2 border-r-2',
            'bottom-4 left-4 border-b-2 border-l-2',
            'bottom-4 right-4 border-b-2 border-r-2',
          ].map((cls) => (
            <motion.div
              key={cls}
              className={`absolute w-5 h-5 ${cls}`}
              animate={{
                borderColor: dragging ? '#3b82f6' : '#ffffff20',
                scale: dragging ? 1.3 : 1,
              }}
              transition={{ duration: 0.2 }}
            />
          ))}

          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
            className="hidden"
            onChange={onFileChange}
            disabled={busy}
          />

          <motion.div
            className="text-6xl mb-5 select-none"
            animate={
              dragging
                ? { scale: 1.4, rotate: -8, y: -4 }
                : { scale: 1, rotate: 0, y: 0 }
            }
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            📄
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.p
              key={dragging ? 'drop' : 'idle'}
              className="text-white font-semibold text-xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {dragging ? 'Release to process' : 'Drop a PDF or image here'}
            </motion.p>
          </AnimatePresence>

          <p className="text-gray-600 text-sm mt-2">or click to browse</p>
          <p className="text-gray-700 text-xs mt-4 tracking-wide">PDF · PNG · JPEG · TIFF · BMP</p>
        </motion.div>
      </div>
    </section>
  )
}
