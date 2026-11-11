import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LayoutGrid, List } from 'lucide-react'
import { useVehicles } from '../hooks/useVehicles'
import { useTitle } from '../hooks/useTitle'
import VehicleCard from '../components/VehicleCard'
import { Empty, ErrorBox, Skeletons } from '../components/States'

const PAGE = 9
const sorts = {
  newest: 'En yeni',
  priceAsc: 'Fiyat (artan)',
  priceDesc: 'Fiyat (azalan)',
  kmAsc: 'Kilometre (az)',
  yearDesc: 'Model yılı (yeni)',
} as const
type Sort = keyof typeof sorts

export default function Listing({ status }: { status: 'published' | 'sold' }) {
  const sold = status === 'sold'
  useTitle(sold ? 'Satılan Araçlar' : 'Satılık Araçlar')
  const { vehicles, loading, error } = useVehicles(status)
  const [sp, setSp] = useSearchParams()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)

  const q = sp.get('q') ?? '', fuel = sp.get('fuel') ?? '', max = Number(sp.get('max') ?? 0)
  const sort = (sp.get('sort') as Sort) || 'newest'
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }); setPage(1) }

  const fuels = useMemo(() => [...new Set(vehicles.map((v) => v.fuel).filter(Boolean))], [vehicles])
  const result = useMemo(() => {
    const t = q.toLocaleLowerCase('tr').trim()
    const list = vehicles.filter((v) =>
      (!t || `${v.brand} ${v.model} ${v.package ?? ''} ${v.title}`.toLocaleLowerCase('tr').includes(t)) &&
      (!fuel || v.fuel === fuel) && (!max || v.price <= max))
    const by: Record<Sort, (a: typeof list[number], b: typeof list[number]) => number> = {
      newest: () => 0, priceAsc: (a, b) => a.price - b.price, priceDesc: (a, b) => b.price - a.price,
      kmAsc: (a, b) => a.mileage - b.mileage, yearDesc: (a, b) => b.year - a.year,
    }
    return [...list].sort(by[sort])
  }, [vehicles, q, fuel, max, sort])

  const pages = Math.max(1, Math.ceil(result.length / PAGE))
  const shown = result.slice((page - 1) * PAGE, page * PAGE)

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8">
      <h1 className="text-4xl font-semibold">{sold ? 'Satılan Araçlar' : 'Satılık Araçlar'}</h1>
      <p className="mt-2 max-w-2xl text-neutral-600">
        {sold ? 'BEP CAR olarak daha önce teslim ettiğimiz araçlar. Bu araçlar satılmıştır.' : 'Şu an satışta olan araçlarımız.'}
      </p>

      <div className="mt-8 grid gap-3 rounded-2xl bg-paper p-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-end">
        <label className="text-xs text-neutral-600">Ara<input className="input mt-1" value={q} onChange={(e) => set('q', e.target.value)} placeholder="Marka, model, paket…" /></label>
        <label className="text-xs text-neutral-600">Yakıt<select className="input mt-1" value={fuel} onChange={(e) => set('fuel', e.target.value)}><option value="">Hepsi</option>{fuels.map((f) => <option key={f}>{f}</option>)}</select></label>
        <label className="text-xs text-neutral-600">Maks. fiyat (₺)<input className="input mt-1" inputMode="numeric" value={max || ''} onChange={(e) => set('max', e.target.value.replace(/\D/g, ''))} /></label>
        <label className="text-xs text-neutral-600">Sırala<select className="input mt-1" value={sort} onChange={(e) => set('sort', e.target.value)}>{Object.entries(sorts).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <div className="flex gap-1" role="group" aria-label="Görünüm">
          {([['grid', LayoutGrid, 'Kart görünümü'], ['list', List, 'Liste görünümü']] as const).map(([k, Icon, l]) => (
            <button key={k} aria-label={l} aria-pressed={view === k} onClick={() => setView(k)} className={`grid size-12 place-items-center rounded-xl ${view === k ? 'bg-ink text-white' : 'bg-white'}`}><Icon size={18} /></button>
          ))}
        </div>
      </div>

      <p className="mb-5 mt-6 text-sm text-neutral-600" aria-live="polite">{loading ? '' : `${result.length} araç bulundu`}</p>
      {loading ? <Skeletons n={6} /> : error ? <ErrorBox /> : result.length === 0 ? (
        <Empty title={vehicles.length ? 'Filtrelere uyan araç yok' : sold ? 'Portföyde henüz araç yok' : 'Şu an yayında araç yok'}
          text={vehicles.length ? 'Filtreleri değiştirerek tekrar deneyin.' : 'Yeni araçlar eklendiğinde burada görünecek.'} />
      ) : (
        <div className={view === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-5'}>
          {shown.map((v) => <VehicleCard key={v.id} v={v} list={view === 'list'} />)}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-10 flex flex-wrap justify-center gap-2" aria-label="Sayfalar">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => { setPage(n); window.scrollTo({ top: 0 }) }} aria-current={n === page ? 'page' : undefined}
              className={`size-11 rounded-full text-sm font-semibold ${n === page ? 'bg-ink text-white' : 'bg-paper hover:bg-neutral-200'}`}>{n}</button>
          ))}
        </nav>
      )}
    </div>
  )
}
