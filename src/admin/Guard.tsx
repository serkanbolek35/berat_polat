import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/Auth'

export default function Guard() {
  const { user, isAdmin, loading } = useAuth()
  useEffect(() => {
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex,nofollow'
    document.head.appendChild(m); return () => { m.remove() }
  }, [])
  if (loading) return <div className="grid min-h-screen place-items-center text-neutral-500">Yükleniyor…</div>
  if (!user || !isAdmin) return <Navigate to="/admin/giris" replace />
  return <Outlet />
}
