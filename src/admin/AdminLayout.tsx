import { NavLink, Outlet } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import Logo from '../components/Logo'

const items = [
  { to: '/admin', label: 'Pano', end: true },
  { to: '/admin/araclar', label: 'Araçlar' },
  { to: '/admin/araclar/yeni', label: 'Yeni araç' },
  { to: '/admin/katalog', label: 'Katalog' },
  { to: '/admin/mesajlar', label: 'Mesajlar' },
  { to: '/admin/ayarlar', label: 'Site ayarları' },
]

export default function AdminLayout() {
  const cls = ({ isActive }: { isActive: boolean }) => `rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-accent text-ink' : 'text-neutral-300 hover:text-white'}`
  return (
    <div className="min-h-screen bg-paper md:flex">
      <aside className="bg-ink p-4 md:sticky md:top-0 md:h-screen md:w-56 md:shrink-0">
        <div className="mb-4 px-2"><Logo /></div>
        <nav className="flex flex-wrap gap-1 md:flex-col" aria-label="Yönetim menüsü">
          {items.map((i) => <NavLink key={i.to} {...i} className={cls}>{i.label}</NavLink>)}
          <NavLink to="/admin/araclar?durum=sold" className="rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-300 hover:text-white">Portföy</NavLink>
        </nav>
        <button className="mt-4 px-3 py-2 text-sm text-neutral-400 hover:text-white" onClick={() => signOut(auth)}>Çıkış yap</button>
      </aside>
      <main className="min-w-0 flex-1 p-5 lg:p-8"><Outlet /></main>
    </div>
  )
}
