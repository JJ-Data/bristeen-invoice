'use client'

import { useRef, useEffect, useState } from 'react'
import { X, Trash2, Check } from 'lucide-react'

export default function SignaturePad({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasContent, setHasContent] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const src = localStorage.getItem('bristeen_signature') ?? '/signature.png'
    const img = new window.Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height, 1)
      const x = (canvas.width - img.width * scale) / 2
      const y = (canvas.height - img.height * scale) / 2
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
      setHasContent(true)
    }
    img.src = src
  }, [])

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    setDrawing(true)
    setHasContent(true)
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!drawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  function stopDraw() {
    setDrawing(false)
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    setHasContent(false)
  }

  function saveSignature() {
    const canvas = canvasRef.current
    if (!canvas) return
    localStorage.setItem('bristeen_signature', canvas.toDataURL('image/png'))
    onClose()
  }

  function removeSignature() {
    clearCanvas()
    localStorage.removeItem('bristeen_signature')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Your Signature</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500">Draw your signature below. It will appear on all invoices and receipts.</p>
        <canvas
          ref={canvasRef}
          width={400}
          height={160}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl cursor-crosshair touch-none bg-gray-50"
        />
        <div className="flex items-center gap-3">
          <button onClick={removeSignature} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition">
            <Trash2 className="w-4 h-4" /> Clear
          </button>
          <button
            onClick={saveSignature}
            disabled={!hasContent}
            className="ml-auto flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-xl text-sm transition"
          >
            <Check className="w-4 h-4" /> Save Signature
          </button>
        </div>
      </div>
    </div>
  )
}
