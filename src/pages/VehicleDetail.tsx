import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Heart, Link2, Share2 } from 'lucide-react'
import { idFromSlug, formatDate, formatKm, formatPrice, vehiclePath, whatsappLink } from '../lib/format'
import { useSettings, useVehicle, useVehicles } from '../hooks/useVehicles'
import { useFavorites } from '../hooks/useFavorites'
import { useTitle } from '../hooks/useTitle'
import VehicleCard from '../components/VehicleCard'
import NotFound from './NotFound'
import Lightbox from '../components/Lightbox'
import { panelNames } from '../data/options'

const ytId = (u?: string) => u?.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/)?.[1]

export default function VehicleDetail() {
  const { slug = '' } = useParams()
  const { vehicle: v, loading } = useVehicle(idFromSlug(slug))
  const s = useSettings()
  const { isFav, toggle } = useFavorites()
  const [i, setI] = useState(0)
  const [copied, setCopied] = useState(false)
  const [lb, setLb] = useState(false)
  const similarSrc = useVehicles('published', { max: 12 })
  const siteBase = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? '').replace(/\/$/, '') || window.location.origin
  useTitle(v?.title, v ? `${v.title} – ${v.year}, ${formatKm(v.mileage)}, ${v.fuel}` : undefined, {
    image: v?.images?.[0]?.url,
    jsonLd: v ? {
      '@context': 'https://schema.org', '@type': ['Otomobil', 'SUV', 'Elektrikli Araç', 'Arazi Araçları', 'Pick-up'].includes(v.category) ? 'Car' : 'Vehicle',
      name: v.title, description: v.description || undefined, brand: { '@type': 'Brand', name: v.brand }, model: v.model, vehicleModelDate: String(v.year),
      mileageFromOdometer: { '@type': 'QuantitativeValue', value: v.mileage, unitCode: 'KMT' }, fuelType: v.fuel, vehicleTransmission: v.transmission, color: v.color || undefined,
      image: v.images.map((i) => i.url),
      offers: { '@type': 'Offer', price: v.status === 'sold' ? v.soldPrice : v.price, priceCurrency: v.currency, availability: v.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock', url: `${siteBase}${vehiclePath(v)}` },
    } : undefined,
  })
  useEffect(() => setI(0), [slug])

  if (loading) return <div className="mx-auto h-[600px] max-w-[1240px] animate-pulse px-5 py-12"><div className="h-full rounded-3xl bg-paper" /></div>
  if (!v) return <NotFound />

  const sold = v.status === 'sold'
  const url = window.location.href
  const wa = whatsappLink(s.whatsapp, `Merhaba, ${v.title} (İlan No: ${v.listingNo}) hakkında bilgi almak istiyorum.`)
  const similar = similarSrc.vehicles.filter((x) => x.id !== v.id && (x.brand === v.brand || x.category === v.category)).slice(0, 3)
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* izin yok */ } }
  const share = () => navigator.share ? navigator.share({ title: v.title, url }).catch(() => {}) : copy()

  const specs: [string, string | number | undefined][] = [
    ['Marka', v.brand], ['Model', v.model], ['Paket', v.package], ['Model yılı', v.year], ['Kilometre', formatKm(v.mileage)],
    ['Yakıt', v.fuel], ['Vites', v.transmission], ['Çekiş', v.driveType], ['Kasa tipi', v.bodyType], ['Renk', v.color],
    ['Motor hacmi', v.engineCc ? `${v.engineCc} cc` : undefined], ['Motor gücü', v.enginePowerHp ? `${v.enginePowerHp} HP` : undefined],
    ['Hasar kaydı', v.damageRecord === undefined ? undefined : v.damageRecord ? 'Var' : 'Yok'],
    ['TRAMER', v.tramerAmount ? `${v.tramerAmount.toLocaleString('tr-TR')} ₺` : undefined],
  ]

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10 lg:px-8">
      <nav className="mb-6 text-sm text-neutral-500"><Link to={sold ? '/satilan-araclar' : '/satilik-araclar'} className="hover:text-accent-deep">← {sold ? 'Satılan araçlar' : 'Satılık araçlar'}</Link></nav>
      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="relative overflow-hidden rounded-3xl bg-graphite">
            {v.images[i] ? (
              <button type="button" onClick={() => setLb(true)} className="block w-full cursor-zoom-in" aria-label="Fotoğrafı tam ekran aç">
                <img src={v.images[i].url} alt={`${v.title} fotoğraf ${i + 1}`} className="aspect-[4/3] w-full object-cover" /></button>
            ) : <div className="grid aspect-[4/3] place-items-center text-neutral-500">Fotoğraf yok</div>}
            {sold && <span className="absolute left-4 top-4 rounded-full bg-accent px-4 py-2 text-sm font-bold tracking-wider text-ink">SATILDI</span>}
          </div>
          {v.images.length > 1 && (
            <ul className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {v.images.map((im, n) => (
                <li key={im.path}><button onClick={() => setI(n)} aria-label={`Fotoğraf ${n + 1}`} aria-current={n === i} className={`block overflow-hidden rounded-xl border-2 ${n === i ? 'border-accent' : 'border-transparent'}`}>
                  <img src={im.url} alt="" loading="lazy" className="h-20 w-28 object-cover" /></button></li>
              ))}
            </ul>
          )}
          {v.description && <section className="mt-10"><h2 className="text-2xl font-semibold">Açıklama</h2><p className="mt-3 max-w-[70ch] whitespace-pre-line leading-relaxed text-neutral-700">{v.description}</p></section>}
          {!!v.equipment?.length && <section className="mt-10"><h2 className="text-2xl font-semibold">Donanım</h2><ul className="mt-3 flex flex-wrap gap-2">{v.equipment.map((e) => <li key={e} className="rounded-full bg-paper px-3 py-1.5 text-sm">{e}</li>)}</ul></section>}
          {(v.damageRecord !== undefined || v.tramerAmount || v.expertNotes || v.panels || v.expertReportUrl) && (
            <section className="mt-10"><h2 className="text-2xl font-semibold">Hasar ve ekspertiz bilgisi</h2>
              <p className="mt-3 text-neutral-700">{v.damageRecord === undefined ? '' : v.damageRecord ? 'Bu araçta hasar kaydı bulunuyor.' : 'Bu araçta hasar kaydı bulunmuyor.'}{v.tramerAmount ? ` TRAMER toplam tutarı: ${v.tramerAmount.toLocaleString('tr-TR')} ₺.` : ''}</p>
              {v.expertNotes && <p className="mt-3 max-w-[70ch] whitespace-pre-line leading-relaxed text-neutral-700">{v.expertNotes}</p>}
              {v.expertReportUrl && <a className="btn btn-outline-dark mt-4" href={v.expertReportUrl} target="_blank" rel="noreferrer">Ekspertiz raporunu aç (PDF)</a>}
              {v.panels && Object.keys(v.panels).length > 0 && (
                <div className="mt-6"><h3 className="mb-2 text-lg font-semibold">Kaporta durumu</h3>
                  <table className="w-full max-w-xl text-sm"><tbody>{panelNames.map((p) => { const st = v.panels?.[p] ?? 'Orijinal'; return (
                    <tr key={p} className="border-b border-neutral-100"><th scope="row" className="py-2 text-left font-normal text-neutral-600">{p}</th>
                      <td className="py-2 text-right"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st === 'Orijinal' ? 'bg-paper text-neutral-700' : 'bg-[#ffe8d9] text-[#9a3412]'}`}>{st}</span></td></tr>) })}</tbody></table></div>)}
            </section>)}
          {ytId(v.videoUrl) && <section className="mt-10"><h2 className="text-2xl font-semibold">Video</h2>
            <div className="mt-3 aspect-video overflow-hidden rounded-2xl bg-ink"><iframe className="size-full" loading="lazy" title={`${v.title} videosu`} src={`https://www.youtube-nocookie.com/embed/${ytId(v.videoUrl)}`} allow="encrypted-media; picture-in-picture" allowFullScreen /></div></section>}
          {(s.address || s.mapsUrl) && <section className="mt-10"><h2 className="text-2xl font-semibold">Konum</h2>
            {s.address && <p className="mt-3 text-neutral-700">{s.address}</p>}
            {s.mapsUrl && <a className="btn btn-outline-dark mt-4" href={s.mapsUrl} target="_blank" rel="noreferrer">Haritada aç</a>}</section>}

        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-sm text-neutral-500">İlan no: {v.listingNo}</p>
          <h1 className="mt-1 text-3xl font-semibold leading-tight">{v.title}</h1>
          <p className="mt-4 font-display text-4xl font-bold">{sold ? (v.soldPrice ? formatPrice({ price: v.soldPrice, currency: v.currency }) : 'Satıldı') : formatPrice(v)}</p>
          <p className="mt-1 text-sm text-neutral-500">{sold ? `Satış tarihi: ${formatDate(v.soldAt)}` : `İlan tarihi: ${formatDate(v.listedAt)}`}</p>
          {!sold && <p className="mt-2 text-sm text-neutral-600">{[v.negotiable && 'Pazarlık payı var', v.exchange && 'Takas olur', v.financing && 'Kredi uygun'].filter(Boolean).join(' • ')}</p>}

          {sold ? (
            <p className="mt-6 rounded-2xl bg-paper p-4 text-sm text-neutral-700">Bu araç satılmıştır. Benzer araçlar için satılık araçlarımıza göz atabilirsiniz.</p>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              {s.phone && <a className="btn btn-accent" href={`tel:${s.phone}`}>Telefonla ara</a>}
              {wa && <a className="btn btn-outline-dark" href={wa} target="_blank" rel="noreferrer">WhatsApp ile bilgi al</a>}
              {s.instagram && <a className="btn btn-outline-dark" href={s.instagram} target="_blank" rel="noreferrer">Instagram</a>}
              <Link className="btn btn-outline-dark" to={`/iletisim?arac=${v.id}`}>İletişim formu</Link>
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button className="btn btn-outline-dark flex-1" aria-pressed={isFav(v.id)} onClick={() => toggle(v.id)}><Heart size={16} fill={isFav(v.id) ? '#ff6a13' : 'none'} />{isFav(v.id) ? 'Favorilerde' : 'Favorilere ekle'}</button>
            <button className="btn btn-outline-dark" onClick={share} aria-label="İlanı paylaş"><Share2 size={16} /></button>
            <button className="btn btn-outline-dark" onClick={copy} aria-label="Bağlantıyı kopyala"><Link2 size={16} /></button>
          </div>
          <p className="mt-2 h-5 text-sm text-neutral-600" aria-live="polite">{copied ? 'Bağlantı kopyalandı.' : ''}</p>

          <h2 className="mb-2 mt-6 text-xl font-semibold">Teknik özellikler</h2>
          <dl className="divide-y divide-neutral-200 text-sm">
            {specs.filter(([, val]) => val !== undefined && val !== '').map(([k, val]) => <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-neutral-500">{k}</dt><dd className="text-right font-medium">{val}</dd></div>)}
          </dl>
        </aside>
      </div>

      {lb && v.images.length > 0 && <Lightbox images={v.images} index={i} alt={v.title} onIndex={setI} onClose={() => setLb(false)} />}

      {similar.length > 0 && <section className="mt-16"><h2 className="mb-6 text-3xl font-semibold">Benzer Araçlar</h2><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{similar.map((x) => <VehicleCard key={x.id} v={x} />)}</div></section>}
    </div>
  )
}
