import { deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { db } from '../lib/firebase'
import { useMessages } from './useAdminData'

export default function Messages() {
  const messages = useMessages()
  return (
    <div>
      <h1 className="text-3xl font-semibold">Mesajlar</h1>
      {messages.length === 0 ? <p className="mt-6 rounded-2xl bg-white p-8 text-center text-neutral-600">Henüz mesaj yok.</p> : (
        <ul className="mt-6 space-y-3">
          {messages.map((m) => (
            <li key={m.id} className={`rounded-2xl bg-white p-5 ${m.read ? '' : 'border-l-4 border-accent'}`}>
              <div className="flex flex-wrap justify-between gap-2 text-sm"><strong>{m.name}</strong><span className="text-neutral-500">{m.createdAt?.toDate().toLocaleString('tr-TR')}</span></div>
              <p className="mt-1 text-sm text-neutral-600"><a className="underline" href={`tel:${m.phone}`}>{m.phone}</a>{m.email && <> · <a className="underline" href={`mailto:${m.email}`}>{m.email}</a></>}</p>
              <p className="mt-3 whitespace-pre-line">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {m.vehicleId && <Link className="rounded-lg border border-neutral-300 px-3 py-1.5" to={`/admin/araclar/${m.vehicleId}`}>İlgili araç</Link>}
                <button className="rounded-lg border border-neutral-300 px-3 py-1.5" onClick={() => updateDoc(doc(db, 'messages', m.id), { read: !m.read })}>{m.read ? 'Okunmadı yap' : 'Okundu yap'}</button>
                <button className="rounded-lg border border-neutral-300 px-3 py-1.5 text-red-700" onClick={() => { if (confirm('Mesaj silinsin mi?')) deleteDoc(doc(db, 'messages', m.id)) }}>Sil</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
