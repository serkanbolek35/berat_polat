import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react'
import type { VehicleImage } from '../types'

interface Props { images: VehicleImage[]; index: number; alt: string; onIndex: (i: number) => void; onClose: () => void }

export default function Lightbox({ images, index, alt, onIndex, onClose }: Props) {
  const [zoom, setZoom] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')
  const closeRef = useRef<HTMLButtonElement>(null)
  const n = images.length
  const go = (d: number) => { setZoom(false); onIndex((index + d + n) % n) }

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflow; prev?.focus() }
  }, [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key)
  })

  const toggle = (e: React.MouseEvent<HTMLImageElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`)
    setZoom((z) => !z)
  }
  const ctl = 'grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label={`${alt} fotoğraf görüntüleyici`}>
      <div className="flex items-center justify-between p-3 text-white">
        <span className="px-2 text-sm" aria-live="polite">{index + 1} / {n}</span>
        <div className="flex gap-2">
          <button className={ctl} onClick={() => setZoom((z) => !z)} aria-label={zoom ? 'Uzaklaştır' : 'Yakınlaştır'}>{zoom ? <ZoomOut size={20} /> : <ZoomIn size={20} />}</button>
          <button ref={closeRef} className={ctl} onClick={onClose} aria-label="Kapat"><X size={20} /></button>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <img src={images[index].url} alt={`${alt} fotoğraf ${index + 1}`} onClick={toggle} draggable={false}
          className={`max-h-full max-w-full select-none object-contain transition-transform duration-200 ${zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
          style={{ transform: zoom ? 'scale(2.2)' : 'none', transformOrigin: origin }} />
        {n > 1 && <>
          <button className={`${ctl} absolute left-3`} onClick={() => go(-1)} aria-label="Önceki fotoğraf"><ChevronLeft /></button>
          <button className={`${ctl} absolute right-3`} onClick={() => go(1)} aria-label="Sonraki fotoğraf"><ChevronRight /></button>
        </>}
      </div>
      {n > 1 && (
        <ul className="flex gap-2 overflow-x-auto p-3">
          {images.map((im, k) => <li key={im.path}><button onClick={() => { setZoom(false); onIndex(k) }} aria-label={`Fotoğraf ${k + 1}`} aria-current={k === index}
            className={`block overflow-hidden rounded-lg border-2 ${k === index ? 'border-accent' : 'border-transparent opacity-70'}`}><img src={im.url} alt="" className="h-14 w-20 object-cover" /></button></li>)}
        </ul>
      )}
    </div>
  )
}
