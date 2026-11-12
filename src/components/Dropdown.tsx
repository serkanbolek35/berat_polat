import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'

export interface Option { id: string; name: string }
interface Props {
  label: string                 // alan etiketi (Marka, Model…)
  allLabel: string              // sıfırlama seçeneği (Tüm Markalar…)
  value: string
  options: Option[]
  onChange: (id: string) => void
  disabled?: boolean
  disabledHint?: string         // üst seçim yapılmadığında gösterilen metin
  emptyHint?: string            // üst seçim var ama seçenek yoksa
  dark?: boolean
}

const useIsMobile = () => {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)'); const f = () => setM(mq.matches)
    mq.addEventListener('change', f); return () => mq.removeEventListener('change', f)
  }, [])
  return m
}

/** Tıklayınca açılan seçim menüsü: yazı alanı yok, seçenekler doğrudan listelenir. */
export default function Dropdown({ label, allLabel, value, options, onChange, disabled, disabledHint, emptyHint, dark }: Props) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null); const btn = useRef<HTMLButtonElement>(null); const list = useRef<HTMLUListElement>(null)
  const uid = useId(); const mobile = useIsMobile()
  const items: Option[] = [{ id: '', name: allLabel }, ...options]
  const selected = options.find((o) => o.id === value)
  const unavailable = disabled || options.length === 0
  const shownText = disabled ? disabledHint ?? 'Önce üst seçimi yapın' : options.length === 0 ? emptyHint ?? 'Seçenek yok' : selected?.name ?? allLabel

  const close = (refocus = false) => { setOpen(false); if (refocus) btn.current?.focus() }
  const pick = (id: string) => { onChange(id); close(true) }
  const toggle = () => { if (unavailable) return; setActive(Math.max(0, items.findIndex((o) => o.id === value))); setOpen((o) => !o) }

  useEffect(() => { if (unavailable) setOpen(false) }, [unavailable])
  useEffect(() => {
    if (!open) return
    const out = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', out); return () => document.removeEventListener('pointerdown', out)
  }, [open])
  useEffect(() => { if (open) { list.current?.focus({ preventScroll: true }); list.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' }) } }, [open, active])

  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setActive(items.length - 1) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(items[active].id) }
    else if (e.key === 'Escape') { e.preventDefault(); close(true) }
    else if (e.key === 'Tab') setOpen(false)
  }

  const optionList = (
    <ul ref={list} id={`${uid}-l`} role="listbox" aria-label={label} tabIndex={-1} aria-activedescendant={`${uid}-o${active}`} onKeyDown={key}
      className={`overflow-y-auto overscroll-contain outline-none ${mobile ? 'max-h-[60vh] pb-4' : 'max-h-64 py-1'}`}>
      {items.map((o, i) => {
        const sel = o.id === value
        return (
          <li key={o.id || '__all'} id={`${uid}-o${i}`} data-i={i} role="option" aria-selected={sel} onClick={() => pick(o.id)} onMouseMove={() => setActive(i)}
            className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 text-sm ${i === active ? 'bg-paper' : ''} ${sel ? 'font-semibold text-accent-deep' : o.id === '' ? 'text-neutral-500' : 'text-ink'}`}>
            <span>{o.name}</span>{sel && <Check size={16} aria-hidden="true" />}
          </li>
        )
      })}
    </ul>
  )

  return (
    <div ref={root} className="relative">
      <span className={`mb-1 block text-xs font-medium ${dark ? 'text-neutral-400' : 'text-neutral-600'}`} id={`${uid}-lab`}>{label}</span>
      <button ref={btn} type="button" disabled={unavailable} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${uid}-l`} aria-labelledby={`${uid}-lab ${uid}-btn`} id={`${uid}-btn`} onClick={toggle}
        onKeyDown={(e) => { if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); toggle() } }}
        className={`input flex items-center justify-between gap-2 text-left transition-colors ${dark ? 'input-dark' : ''} ${open ? '!border-accent' : ''} ${unavailable ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-accent'}`}>
        <span className={`truncate ${selected ? '' : dark ? 'text-neutral-400' : 'text-neutral-500'}`}>{shownText}</span>
        <ChevronDown size={16} aria-hidden="true" className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && !mobile && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.15 }}
            className="absolute z-30 mt-1.5 w-full origin-top overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">{optionList}</motion.div>
        )}
        {open && mobile && (
          <div className="fixed inset-0 z-[60]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => close(true)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.22, ease: 'easeOut' }}
              className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3"><h3 className="font-display text-lg font-semibold">{label}</h3>
                <button type="button" className="grid size-11 place-items-center text-sm font-medium" onClick={() => close(true)}>Kapat</button></div>
              {optionList}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
