import { FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../context/Auth'
import Logo from '../components/Logo'

export default function Login() {
  const { user, isAdmin, loading } = useAuth()
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  if (!loading && user && isAdmin) return <Navigate to="/admin" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await signInWithEmailAndPassword(auth, email, pw) } catch { setErr('E-posta veya parola hatalı.') }
    setBusy(false)
  }
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8">
        <div className="mb-6 flex justify-center"><Logo light={false} /></div>
        <h1 className="mb-5 text-center text-2xl font-semibold">Yönetici girişi</h1>
        <label className="block text-sm font-medium">E-posta<input className="input mt-1.5" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label className="mt-4 block text-sm font-medium">Parola<input className="input mt-1.5" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required /></label>
        {err && <p role="alert" className="mt-3 text-sm text-red-700">{err}</p>}
        {user && !isAdmin && !loading && (
          <p role="alert" className="mt-3 text-sm text-red-700">Bu hesabın yönetici yetkisi yok. Yetki atandıysa çıkış yapıp tekrar girin.
            <button type="button" className="ml-1 underline" onClick={() => signOut(auth)}>Çıkış yap</button></p>
        )}
        <button className="btn btn-accent mt-6 w-full" disabled={busy}>{busy ? 'Giriş yapılıyor…' : 'Giriş yap'}</button>
      </form>
    </div>
  )
}
