import { FormEvent, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAllVehicles } from './useAdminData'
import { changeStatus, duplicateVehicle, editSale, removeVehicle, setFeatured } from '../lib/vehicleOps'
import { formatDate, formatPrice, vehiclePath } from '../lib/format'
import type { Vehicle, VehicleStatus } from '../types'

const labels: Record<VehicleStatus, string> = { draft: 'Taslak', published: 'Yayında', reserved: 'Rezerve', sold: 'Satıldı', archived: 'Arşiv' }
const tabs: [string, string][] = [['', 'Tümü'], ...Object.entries(labels)]
const toInput = (d?: Date) => (d ?? new Date()).toISOString().slice(0, 10)

function SaleDialog({ v, onClose }: { v: Vehicle; onClose: () => void }) {
  const editing = v.status === 'sold'
  const [date, setDate] = useState(toInput(v.soldAt?.toDate())); const [price, setPrice] = useState(v.soldPrice ? String(v.soldPrice) : '')
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const d = new Date(`${date}T12:00:00`); const p = price ? Number(price) : undefined
      editing ? await editSale(v.id, d, p) : await changeStatus(v, 'sold', { soldAt: d, soldPrice: p })
      onClose()
    } catch { setErr('Kaydedilemedi. Tekrar deneyin.'); setBusy(false) }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Satış bilgisi">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-6">
        <h2 className="text-xl font-semibold">{editing ? 'Satış bilgisini düzenle' : 'Aracı satıldı olarak işaretle'}</h2>
        <p className="mt-1 text-sm text-neutral-600">{v.title}</p>
        <label className="mt-4 block text-sm font-medium">Satış tarihi<input type="date" className="input mt-1.5" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
        <label className="mt-4 block text-sm font-medium">Satış fiyatı (isteğe bağlı)<input className="input mt-1.5" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} /></label>
        {err && <p role="alert" className="mt-3 text-sm text-red-700">{err}</p>}
        <div className="mt-6 flex justify-end gap-2"><button type="button" className="btn btn-outline-dark" onClick={onClose}>Vazgeç</button><button className="btn btn-accent" disabled={busy}>Kaydet</button></div>
      </form>
    </div>
  )
}

export default function Vehicles() {
  const { vehicles, loading } = useAllVehicles()
  const [sp, setSp] = useSearchParams(); const tab = sp.get('durum') ?? ''
  const [sale, setSale] = useState<Vehicle | null>(null); const [msg, setMsg] = useState('')
  const rows = tab ? vehicles.filter((v) => v.status === tab) : vehicles

  const run = async (fn: () => Promise<unknown>, ok: string) => { setMsg(''); try { await fn(); setMsg(ok) } catch { setMsg('İşlem başarısız oldu. Yetkinizi ve bağlantınızı kontrol edin.') } }
  const btn = 'rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium hover:border-accent hover:text-accent-deep'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-semibold">Araçlar</h1><Link to="/admin/araclar/yeni" className="btn btn-accent">Yeni araç ekle</Link></div>
      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Durum">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setSp(k ? { durum: k } : {})} className={`rounded-full px-4 py-2 text-sm font-medium ${tab === k ? 'bg-ink text-white' : 'bg-white'}`}>{l} ({k ? vehicles.filter((v) => v.status === k).length : vehicles.length})</button>)}
      </div>
      <p className="mt-3 h-5 text-sm text-neutral-700" aria-live="polite">{msg}</p>
      {loading ? <p className="mt-6 text-neutral-500">Yükleniyor…</p> : rows.length === 0 ? <p className="mt-6 rounded-2xl bg-white p-8 text-center text-neutral-600">Bu durumda araç yok.</p> : (
        <ul className="mt-2 space-y-3">
          {rows.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4">
              {v.images[0] ? <img src={v.images[0].url} alt="" className="h-16 w-24 rounded-lg object-cover" /> : <div className="grid h-16 w-24 place-items-center rounded-lg bg-paper text-xs text-neutral-500">Foto yok</div>}
              <div className="min-w-[200px] flex-1">
                <p className="font-semibold">{v.title || 'Başlıksız taslak'} {v.featured && <span className="ml-1 rounded-full bg-[#ffe8d9] px-2 py-0.5 text-xs text-[#9a3412]">Öne çıkan</span>}</p>
                <p className="text-sm text-neutral-600">{v.listingNo} · {labels[v.status]} · {v.price ? formatPrice(v) : 'Fiyat yok'}{v.status === 'sold' && ` · Satış: ${formatDate(v.soldAt)}`}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Link className={btn} to={`/admin/araclar/${v.id}`}>Düzenle</Link>
                {['published', 'sold'].includes(v.status) && <Link className={btn} to={vehiclePath(v)} target="_blank">Sitede gör</Link>}
                {v.status !== 'published' && v.status !== 'sold' && <button className={btn} onClick={() => run(() => changeStatus(v, 'published'), 'Araç yayına alındı.')}>Yayınla</button>}
                {v.status === 'published' && <button className={btn} onClick={() => run(() => changeStatus(v, 'draft'), 'Araç yayından kaldırıldı.')}>Yayından kaldır</button>}
                {v.status === 'published' && <button className={btn} onClick={() => run(() => changeStatus(v, 'reserved'), 'Araç rezerve edildi.')}>Rezerve</button>}
                {(v.status === 'published' || v.status === 'reserved') && <button className={btn} onClick={() => setSale(v)}>Satıldı</button>}
                {v.status === 'sold' && <><button className={btn} onClick={() => setSale(v)}>Satış bilgisi</button><button className={btn} onClick={() => run(() => changeStatus(v, 'published'), 'Araç tekrar satılığa alındı.')}>Geri al</button></>}
                <button className={btn} onClick={() => run(() => setFeatured(v.id, !v.featured), v.featured ? 'Öne çıkarma kaldırıldı.' : 'Araç öne çıkarıldı.')}>{v.featured ? 'Öne çıkarma' : 'Öne çıkar'}</button>
                <button className={btn} onClick={() => run(() => duplicateVehicle(v), 'Taslak kopya oluşturuldu (fotoğraflar kopyalanmaz).')}>Kopyala</button>
                {v.status !== 'archived' && <button className={btn} onClick={() => run(() => changeStatus(v, 'archived'), 'Araç arşivlendi.')}>Arşivle</button>}
                <button className={`${btn} text-red-700`} onClick={() => { if (confirm(`"${v.title}" ve tüm fotoğrafları kalıcı olarak silinecek. Emin misiniz?`)) run(() => removeVehicle(v), 'Araç silindi.') }}>Sil</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {sale && <SaleDialog v={sale} onClose={() => setSale(null)} />}
    </div>
  )
}
