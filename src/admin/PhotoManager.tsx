import { useRef, useState } from 'react'
import { deleteFile, uploadImage } from '../lib/vehicleOps'
import type { VehicleImage } from '../types'

const OK = ['image/jpeg', 'image/png', 'image/webp']
const MAX = 20 * 1024 * 1024

interface Props { vehicleId: string; images: VehicleImage[]; onChange: (imgs: VehicleImage[]) => void }

export default function PhotoManager({ vehicleId, images, onChange }: Props) {
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [errors, setErrors] = useState<string[]>([])
  const drag = useRef<number | null>(null)
  const latest = useRef(images); latest.current = images

  const add = async (files: FileList | null) => {
    if (!files) return
    const errs: string[] = []
    const valid = [...files].filter((f) => {
      if (!OK.includes(f.type)) { errs.push(`${f.name}: yalnızca JPG, PNG veya WEBP yüklenebilir.`); return false }
      if (f.size > MAX) { errs.push(`${f.name}: dosya 20 MB'ı aşıyor.`); return false }
      return true
    })
    setErrors(errs)
    await Promise.all(valid.map(async (f) => {
      const key = `${f.name}-${f.size}-${Math.random()}`
      setProgress((p) => ({ ...p, [key]: 0 }))
      try {
        const img = await uploadImage(vehicleId, f, (pct) => setProgress((p) => ({ ...p, [key]: pct })))
        latest.current = [...latest.current, img]; onChange(latest.current)
      } catch { setErrors((e) => [...e, `${f.name}: yüklenemedi.`]) }
      setProgress((p) => { const { [key]: _, ...rest } = p; return rest })
    }))
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return
    const n = [...images]; const [x] = n.splice(from, 1); n.splice(to, 0, x); onChange(n)
  }
  const remove = async (i: number) => {
    if (!confirm('Fotoğraf silinsin mi?')) return
    await deleteFile(images[i].path); onChange(images.filter((_, k) => k !== i))
  }
  const btn = 'rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-ink hover:bg-white'

  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-neutral-300 p-8 text-center hover:border-accent">
        <span className="font-semibold">Fotoğraf seçin (birden fazla seçebilirsiniz)</span>
        <span className="text-sm text-neutral-600">JPG, PNG veya WEBP · yüklemeden önce otomatik küçültülür</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { add(e.target.files); e.target.value = '' }} />
      </label>
      {errors.map((e) => <p key={e} role="alert" className="mt-2 text-sm text-red-700">{e}</p>)}
      {Object.entries(progress).map(([k, p]) => <div key={k} className="mt-2"><div className="h-2 overflow-hidden rounded-full bg-neutral-200"><div className="h-full bg-accent transition-all" style={{ width: `${p}%` }} /></div><p className="mt-1 text-xs text-neutral-600">Yükleniyor… %{p}</p></div>)}
      <p className="mt-4 text-sm text-neutral-600">{images.length} fotoğraf. İlk fotoğraf kapak olur; sürükleyerek veya okların yardımıyla sıralayın.</p>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((im, i) => (
          <li key={im.path} draggable onDragStart={() => { drag.current = i }} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag.current !== null) move(drag.current, i); drag.current = null }}
            className="relative cursor-grab overflow-hidden rounded-xl bg-graphite">
            <img src={im.url} alt={`Fotoğraf ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
            {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-ink">Kapak</span>}
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1 bg-gradient-to-t from-black/70 p-2">
              <button type="button" className={btn} aria-label="Sola taşı" onClick={() => move(i, i - 1)}>←</button>
              <button type="button" className={btn} aria-label="Sağa taşı" onClick={() => move(i, i + 1)}>→</button>
              {i !== 0 && <button type="button" className={btn} onClick={() => move(i, 0)}>Kapak yap</button>}
              <button type="button" className={`${btn} text-red-700`} onClick={() => remove(i)}>Sil</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
