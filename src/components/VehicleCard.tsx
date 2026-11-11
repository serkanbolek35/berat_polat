import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import type { Vehicle } from '../types'
import { formatDate, formatKm, formatPrice, vehiclePath, whatsappLink } from '../lib/format'
import { useFavorites } from '../hooks/useFavorites'
import { useSettings } from '../hooks/useVehicles'
import { useCompare } from '../hooks/useCompare'

export default function VehicleCard({ v, list = false }: { v: Vehicle; list?: boolean }) {
  const { isFav, toggle } = useFavorites()
  const cmp = useCompare()
  const s = useSettings()
  const sold = v.status === 'sold'
  const fav = isFav(v.id)
  const wa = !sold && whatsappLink(s.whatsapp, `Merhaba, ${v.title} (İlan No: ${v.listingNo}) hakkında bilgi almak istiyorum.`)

  return (
    <article className={`group relative overflow-hidden rounded-[20px] border border-neutral-200 bg-white transition-colors hover:border-accent ${list ? 'sm:flex' : ''}`}>
      <Link to={vehiclePath(v)} className={`relative block bg-graphite ${list ? 'sm:w-72 sm:shrink-0' : ''}`} aria-label={v.title}>
        {v.images?.[0] ? (
          <img src={v.images[0].url} alt={v.title} loading="lazy" className={`w-full object-cover ${list ? 'h-52 sm:h-full' : 'h-52'}`} />
        ) : (
          <div className="grid h-52 place-items-center text-sm text-neutral-500">Fotoğraf yok</div>
        )}
        {sold && <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1.5 text-xs font-bold tracking-wider text-ink">SATILDI</span>}
        {!sold && v.featured && <span className="absolute left-3 top-3 rounded-full bg-[#ffe8d9] px-3 py-1.5 text-xs font-semibold text-[#9a3412]">Öne çıkan</span>}
      </Link>
      <button onClick={() => toggle(v.id)} aria-pressed={fav} aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/90 text-ink hover:text-accent-deep">
        <Heart size={18} fill={fav ? '#ff6a13' : 'none'} stroke={fav ? '#ff6a13' : 'currentColor'} />
      </button>
      <div className="flex-1 p-5">
        <h3 className="text-xl font-semibold">{v.brand} {v.model}</h3>
        {v.package && <p className="mt-1 text-sm text-neutral-600">{v.package}</p>}
        <ul className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
          {[v.year, formatKm(v.mileage), v.fuel, v.transmission].map((t, i) => <li key={i} className="rounded-full bg-paper px-2.5 py-1.5">{t}</li>)}
        </ul>
        <p className="mt-3 text-xs text-neutral-500">{sold ? `Satış tarihi: ${formatDate(v.soldAt)}` : `İlan tarihi: ${formatDate(v.listedAt)}`}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <strong className="font-display text-2xl">{sold ? (v.soldPrice ? formatPrice({ price: v.soldPrice, currency: v.currency }) : '') : formatPrice(v)}</strong>
          <div className="flex gap-2">
            <Link className="btn btn-outline-dark" to={vehiclePath(v)}>Detaylı bilgi</Link>
            {wa && <a className="btn btn-accent" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}
          </div>
        </div>
        <button type="button" onClick={() => cmp.toggle(v.id)} aria-pressed={cmp.has(v.id)} disabled={!cmp.has(v.id) && cmp.full}
          title={!cmp.has(v.id) && cmp.full ? 'En fazla 3 araç karşılaştırılabilir' : undefined}
          className="mt-3 text-xs font-medium underline decoration-neutral-300 underline-offset-4 hover:text-accent-deep disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50">
          {cmp.has(v.id) ? 'Karşılaştırmada ✓' : 'Karşılaştır'}</button>
      </div>
    </article>
  )
}
