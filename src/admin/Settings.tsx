import { FormEvent, useEffect, useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import { useSettings } from '../hooks/useSettings'
import type { SiteSettings } from '../types'

type Key = keyof SiteSettings
const fields: [string, [Key, string, string?][]][] = [
  ['İletişim', [['phone', 'Telefon', '0555 000 00 00'], ['whatsapp', 'WhatsApp numarası', '905550000000'], ['email', 'E-posta'], ['address', 'Adres'], ['workingHours', 'Çalışma saatleri', 'Pzt–Cmt 09:00–19:00'], ['mapsUrl', 'Google Haritalar bağlantısı', 'https://maps.google.com/…']]],
  ['Sosyal medya', [['instagram', 'Instagram bağlantısı', 'https://instagram.com/…'], ['facebook', 'Facebook bağlantısı', 'https://facebook.com/…']]],
  ['Ana sayfa', [['heroTitle', 'Ana başlık'], ['heroSubtitle', 'Alt başlık']]],
  ['SEO', [['siteTitle', 'Site başlığı'], ['metaDescription', 'Meta açıklama (en fazla 160 karakter)']]],
]
const urlKeys: Key[] = ['mapsUrl', 'instagram', 'facebook']

export default function Settings() {
  const s = useSettings()
  const [f, setF] = useState<SiteSettings>({}); const [loaded, setLoaded] = useState(false)
  const [errs, setErrs] = useState<Partial<Record<Key, string>>>({}); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  useEffect(() => { if (!loaded) { setF(s); if (Object.keys(s).length) setLoaded(true) } }, [s, loaded])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const er: Partial<Record<Key, string>> = {}
    if (f.whatsapp && !/^\d{10,15}$/.test(f.whatsapp.replace(/\D/g, ''))) er.whatsapp = 'Ülke koduyla, yalnızca rakam girin (örn. 905550000000).'
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'E-posta adresi geçersiz.'
    urlKeys.forEach((k) => { if (f[k] && !/^https?:\/\//.test(f[k]!)) er[k] = 'Bağlantı http:// veya https:// ile başlamalı.' })
    if (f.metaDescription && f.metaDescription.length > 160) er.metaDescription = '160 karakteri aşmayın.'
    setErrs(er); if (Object.keys(er).length) return
    try { await setDoc(doc(db, 'siteSettings', 'main'), { ...f, whatsapp: f.whatsapp?.replace(/\D/g, '') }, { merge: true }); setMsg({ ok: true, t: 'Ayarlar kaydedildi.' }) }
    catch { setMsg({ ok: false, t: 'Kaydedilemedi. Yetkinizi ve bağlantınızı kontrol edin.' }) }
  }
  const logo = async (file?: File) => {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type) || file.size > 2 * 1024 * 1024) return setMsg({ ok: false, t: 'Logo PNG, JPG, WEBP veya SVG olmalı ve 2 MB’ı aşmamalı.' })
    try { const r = ref(storage, `site/logo-${Date.now()}`); await uploadBytes(r, file, { contentType: file.type }); setF({ ...f, logoUrl: await getDownloadURL(r) }); setMsg({ ok: true, t: 'Logo yüklendi. Kaydet’e basın.' }) }
    catch { setMsg({ ok: false, t: 'Logo yüklenemedi.' }) }
  }

  return (
    <form onSubmit={save} className="max-w-3xl" noValidate>
      <h1 className="text-3xl font-semibold">Site ayarları</h1>
      <section className="mt-6 rounded-2xl bg-white p-6"><h2 className="text-lg font-semibold">Logo</h2>
        <div className="mt-3 flex items-center gap-4">{f.logoUrl ? <img src={f.logoUrl} alt="Mevcut logo" className="h-12 rounded bg-ink p-2" /> : <p className="text-sm text-neutral-500">Logo yüklenmedi; varsayılan BEP CAR işareti kullanılıyor.</p>}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => logo(e.target.files?.[0])} aria-label="Logo yükle" />
          {f.logoUrl && <button type="button" className="text-sm underline" onClick={() => setF({ ...f, logoUrl: '' })}>Kaldır</button>}</div></section>
      {fields.map(([title, list]) => (
        <section key={title} className="mt-5 grid gap-4 rounded-2xl bg-white p-6 sm:grid-cols-2"><h2 className="text-lg font-semibold sm:col-span-2">{title}</h2>
          {list.map(([k, label, ph]) => (
            <label key={k} className={`block text-sm font-medium ${k === 'metaDescription' || k === 'heroSubtitle' ? 'sm:col-span-2' : ''}`}>{label}
              <input className="input mt-1.5" value={(f[k] as string) ?? ''} placeholder={ph} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-invalid={!!errs[k]} />
              {errs[k] && <span role="alert" className="mt-1 block text-sm text-red-700">{errs[k]}</span>}</label>))}
        </section>))}
      <section className="mt-5 rounded-2xl bg-white p-6"><label className="block text-sm font-medium">Hakkımızda metni (paragraflar arasında boş satır bırakın)
        <textarea className="input mt-1.5 min-h-40 py-3" value={f.aboutText ?? ''} onChange={(e) => setF({ ...f, aboutText: e.target.value })} /></label></section>
      <div className="mt-5 flex items-center gap-4"><button className="btn btn-accent">Kaydet</button><p aria-live="polite" className={`text-sm ${msg?.ok ? 'text-green-800' : 'text-red-700'}`}>{msg?.t}</p></div>
    </form>
  )
}
