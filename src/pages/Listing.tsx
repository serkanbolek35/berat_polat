import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react'
import { useVehicles } from '../hooks/useVehicles'
import { useCatalogScoped } from '../hooks/useCatalog'
import { useTitle } from '../hooks/useTitle'
import VehicleCard from '../components/VehicleCard'
import FilterPanel, { type Patch } from '../components/FilterPanel'
import { Empty, ErrorBox, Skeletons } from '../components/States'
import { activeCount, applyFilters, badges, emptyFilters, parseFilters, scopeOf, sortLabels, toParams, type Filters, type Sort } from '../lib/filters'

const PAGE = 12

export default function Listing({ status }: { status: 'published' | 'sold' }) {
  const sold = status === 'sold'
  useTitle(sold ? 'Satılan Araçlar' : 'Satılık Araçlar')
  const [sp, setSp] = useSearchParams()
  const f = useMemo(() => parseFilters(sp), [sp])
  const page = Math.max(1, Number(sp.get('sayfa')) || 1)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [drawer, setDrawer] = useState(false)
  const [draft, setDraft] = useState<Filters>(f)

  // Sunucu: durum + en derin seçili hiyerarşi düzeyi (tek eşitlik). Kalanı istemcide, daralmış küme üzerinde uygulanır.
  const scope = useMemo(() => scopeOf(f), [f])
  const { vehicles, loading, error } = useVehicles(status, { scope, max: 300 })
  const catalog = useCatalogScoped(f.marka, f.model)

  const commit = (next: Filters, opts?: { replace?: boolean }) => {
    const p = toParams(next); const keep = sp.get('sayfa'); if (keep && JSON.stringify([...toParams(f)]) === JSON.stringify([...p])) p.set('sayfa', keep)
    setSp(p, { replace: opts?.replace })
  }
  const change = (patch: Patch, opts?: { replace?: boolean }) => commit({ ...f, ...patch }, opts)
  const changeDraft = (patch: Patch) => setDraft((d) => ({ ...d, ...patch }))

  useEffect(() => { if (drawer) { setDraft(f); const o = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = o } } }, [drawer]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!drawer) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [drawer])

  const nameOf = (kind: 'kategori' | 'marka' | 'model' | 'nesil' | 'paket', id: string) =>
    ({ kategori: catalog.categories, marka: catalog.brands, model: catalog.models, nesil: catalog.generations, paket: catalog.packages }[kind] as { id: string; name: string }[]).find((x) => x.id === id)?.name ?? id
  const result = useMemo(() => applyFilters(vehicles, f), [vehicles, f])
  const draftCount = useMemo(() => applyFilters(vehicles, draft).length, [vehicles, draft])
  const pages = Math.max(1, Math.ceil(result.length / PAGE))
  const cur = Math.min(page, pages)
  const shown = result.slice((cur - 1) * PAGE, cur * PAGE)
  const chips = badges(f, nameOf)
  const n = activeCount(f)
  const goPage = (p: number) => { const q = new URLSearchParams(sp); p > 1 ? q.set('sayfa', String(p)) : q.delete('sayfa'); setSp(q); window.scrollTo({ top: 0 }) }

  const panel = (value: Filters, onChange: (p: Patch, o?: { replace?: boolean }) => void) => <FilterPanel value={value} onChange={onChange} catalog={catalog} scoped={vehicles} />

  return (
    <div className="mx-auto max-w-[1360px] px-5 py-10 lg:px-8">
      <h1 className="text-4xl font-semibold">{sold ? 'Satılan Araçlar' : 'Satılık Araçlar'}</h1>
      <p className="mt-2 max-w-2xl text-neutral-600">{sold ? 'BEP CAR olarak daha önce teslim ettiğimiz araçlar. Bu araçlar satılmıştır.' : 'Şu an satışta olan araçlarımız.'}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="hidden lg:block" aria-label="Filtreler">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-neutral-200 p-4">
            <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-semibold">Filtreler</h2>
              {n > 0 && <button className="text-sm underline" onClick={() => commit({ ...emptyFilters, sirala: f.sirala })}>Tümünü temizle</button>}</div>
            {panel(f, change)}
          </div>
        </aside>

        <section aria-label="Sonuçlar" className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-outline-dark lg:hidden" onClick={() => setDrawer(true)}><SlidersHorizontal size={16} />Filtrele{n > 0 ? ` (${n})` : ''}</button>
            <p className="flex-1 text-sm text-neutral-600" aria-live="polite">{loading ? 'Yükleniyor…' : `${result.length} araç bulundu`}</p>
            <label className="flex items-center gap-2 text-sm"><span className="sr-only sm:not-sr-only">Sırala</span>
              <select className="input !min-h-11 w-auto" value={f.sirala} onChange={(e) => change({ sirala: e.target.value as Sort })}>{Object.entries(sortLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <div className="flex gap-1" role="group" aria-label="Görünüm">
              {([['grid', LayoutGrid, 'Kart görünümü'], ['list', List, 'Liste görünümü']] as const).map(([k, Icon, l]) => (
                <button key={k} aria-label={l} aria-pressed={view === k} onClick={() => setView(k)} className={`grid size-11 place-items-center rounded-xl ${view === k ? 'bg-ink text-white' : 'bg-paper'}`}><Icon size={18} /></button>))}
            </div>
          </div>

          {chips.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Uygulanan filtreler">
              {chips.map((b) => <li key={b.key}><button className="flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-sm hover:bg-neutral-200" onClick={() => change(b.clear)} aria-label={`${b.label} filtresini kaldır`}>{b.label}<X size={14} /></button></li>)}
              <li><button className="px-2 py-1.5 text-sm underline" onClick={() => commit({ ...emptyFilters, sirala: f.sirala })}>Tümünü temizle</button></li>
            </ul>
          )}

          <div className="mt-6">
            {loading ? <Skeletons n={6} /> : error ? <ErrorBox /> : result.length === 0 ? (
              <Empty title={vehicles.length || n ? 'Filtrelere uyan araç yok' : sold ? 'Portföyde henüz araç yok' : 'Şu an yayında araç yok'}
                text={n ? 'Bazı filtreleri kaldırarak tekrar deneyin.' : 'Yeni araçlar eklendiğinde burada görünecek.'} />
            ) : (
              <div className={view === 'grid' ? 'grid gap-6 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-5'}>{shown.map((v) => <VehicleCard key={v.id} v={v} list={view === 'list'} />)}</div>
            )}
          </div>
          {vehicles.length >= 300 && <p className="mt-6 text-sm text-neutral-500">İlk 300 ilan gösteriliyor; sonuçları daraltmak için marka veya model seçin.</p>}

          {pages > 1 && (
            <nav className="mt-10 flex flex-wrap justify-center gap-2" aria-label="Sayfalar">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => <button key={p} onClick={() => goPage(p)} aria-current={p === cur ? 'page' : undefined}
                className={`size-11 rounded-full text-sm font-semibold ${p === cur ? 'bg-ink text-white' : 'bg-paper hover:bg-neutral-200'}`}>{p}</button>)}
            </nav>
          )}
        </section>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden" role="dialog" aria-modal="true" aria-label="Filtreler">
          <div className="flex items-center justify-between border-b border-neutral-200 p-4"><h2 className="text-lg font-semibold">Filtreler</h2>
            <button className="grid size-11 place-items-center" onClick={() => setDrawer(false)} aria-label="Kapat"><X /></button></div>
          <div className="flex-1 overflow-y-auto p-4">{panel(draft, (p) => changeDraft(p))}</div>
          <div className="flex gap-3 border-t border-neutral-200 p-4">
            <button className="btn btn-outline-dark" onClick={() => setDraft({ ...emptyFilters, sirala: f.sirala })}>Temizle</button>
            <button className="btn btn-accent flex-1" onClick={() => { commit(draft); setDrawer(false) }}>{draftCount} aracı göster</button>
          </div>
        </div>
      )}
    </div>
  )
}
