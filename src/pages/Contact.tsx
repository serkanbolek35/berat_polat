import { FormEvent, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useSettings } from '../hooks/useVehicles'
import { useTitle } from '../hooks/useTitle'

export default function Contact() {
  useTitle('İletişim')
  const s = useSettings()
  const [sp] = useSearchParams()
  const [f, setF] = useState({ name: '', phone: '', email: '', message: '' })
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [err, setErr] = useState<Record<string, string>>({})

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    if (f.name.trim().length < 2) errors.name = 'Adınızı yazın.'
    if (f.phone.replace(/\D/g, '').length < 10) errors.phone = 'Geçerli bir telefon numarası yazın.'
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) errors.email = 'E-posta adresi geçersiz.'
    if (f.message.trim().length < 5) errors.message = 'Mesajınızı yazın.'
    setErr(errors)
    if (Object.keys(errors).length) return
    setState('sending')
    try {
      await addDoc(collection(db, 'messages'), { ...f, vehicleId: sp.get('arac') ?? '', read: false, createdAt: serverTimestamp() })
      setState('done'); setF({ name: '', phone: '', email: '', message: '' })
    } catch { setState('error') }
  }

  const field = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block text-sm font-medium">{label}
      <input className="input mt-1.5" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-invalid={!!err[k]} {...props} />
      {err[k] && <span className="mt-1 block text-sm text-red-700" role="alert">{err[k]}</span>}
    </label>
  )

  return (
    <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-12 lg:grid-cols-2 lg:px-8">
      <div>
        <h1 className="text-4xl font-semibold">İletişim</h1>
        <p className="mt-3 text-neutral-600">Araçlarımız hakkında soru sormak için formu doldurun ya da doğrudan arayın.</p>
        <dl className="mt-8 space-y-4 text-sm">
          {([['Telefon', s.phone], ['E-posta', s.email], ['Adres', s.address], ['Çalışma saatleri', s.workingHours]] as const).filter(([, v]) => v).map(([k, v]) => (
            <div key={k}><dt className="text-neutral-500">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>
          ))}
        </dl>
        {s.mapsUrl && <a className="btn btn-outline-dark mt-8" href={s.mapsUrl} target="_blank" rel="noreferrer">Haritada aç</a>}
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-3xl bg-paper p-6 sm:p-8" noValidate>
        {field('name', 'Ad soyad', { autoComplete: 'name' })}
        {field('phone', 'Telefon', { type: 'tel', autoComplete: 'tel' })}
        {field('email', 'E-posta (isteğe bağlı)', { type: 'email', autoComplete: 'email' })}
        <label className="block text-sm font-medium">Mesajınız
          <textarea className="input mt-1.5 min-h-32 py-3" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} maxLength={2000} aria-invalid={!!err.message} />
          {err.message && <span className="mt-1 block text-sm text-red-700" role="alert">{err.message}</span>}
        </label>
        <button className="btn btn-accent w-full" disabled={state === 'sending'}>{state === 'sending' ? 'Gönderiliyor…' : 'Mesajı gönder'}</button>
        <p aria-live="polite" className="text-sm">
          {state === 'done' && <span className="text-green-800">Mesajınız alındı. En kısa sürede size dönüş yapacağız.</span>}
          {state === 'error' && <span className="text-red-700">Mesaj gönderilemedi. Lütfen tekrar deneyin veya bizi arayın.</span>}
        </p>
      </form>
    </div>
  )
}
