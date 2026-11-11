import { Link } from 'react-router-dom'
import { useAllVehicles, useMessages } from './useAdminData'
import { formatDate, formatPrice } from '../lib/format'

export default function Dashboard() {
  const { vehicles, loading } = useAllVehicles()
  const messages = useMessages()
  const n = (f: (s: string) => boolean) => vehicles.filter((v) => f(v.status)).length
  const stats: [string, number][] = [
    ['Toplam araç', vehicles.length], ['Satılık araç', n((s) => s === 'published')], ['Rezerve araç', n((s) => s === 'reserved')],
    ['Satılan araç', n((s) => s === 'sold')], ['Öne çıkan araç', vehicles.filter((v) => v.featured && v.status === 'published').length],
    ['Toplam mesaj', messages.length],
  ]
  const recentAdded = vehicles.filter((v) => v.createdAt).sort((a, b) => b.createdAt!.toMillis() - a.createdAt!.toMillis()).slice(0, 5)
  const recentSold = vehicles.filter((v) => v.status === 'sold' && v.soldAt).sort((a, b) => b.soldAt!.toMillis() - a.soldAt!.toMillis()).slice(0, 5)
  const List = ({ title, rows, sold }: { title: string; rows: typeof vehicles; sold?: boolean }) => (
    <section className="rounded-2xl bg-white p-5"><h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {rows.length === 0 ? <p className="text-sm text-neutral-500">Henüz kayıt yok.</p> : (
        <ul className="divide-y divide-neutral-100">{rows.map((v) => (
          <li key={v.id}><Link to={`/admin/araclar/${v.id}`} className="flex justify-between gap-3 py-2.5 text-sm hover:text-accent-deep">
            <span className="truncate font-medium">{v.title}</span><span className="shrink-0 text-neutral-500">{sold ? formatDate(v.soldAt) : formatPrice(v)}</span></Link></li>))}</ul>)}
    </section>
  )
  return (
    <div>
      <h1 className="text-3xl font-semibold">Pano</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
        {stats.map(([l, v]) => <div key={l} className="rounded-2xl bg-white p-5"><p className="text-sm text-neutral-500">{l}</p><p className="mt-1 font-display text-3xl font-bold">{loading ? '–' : v}</p></div>)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2"><List title="Son eklenen araçlar" rows={recentAdded} /><List title="Son satılan araçlar" rows={recentSold} sold /></div>
    </div>
  )
}
