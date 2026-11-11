import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Heart, Instagram, Menu, MessageCircle, Phone, X } from 'lucide-react'
import Logo from './Logo'
import { useSettings } from '../hooks/useVehicles'
import { whatsappLink } from '../lib/format'
import { useCompare } from '../hooks/useCompare'

const nav = [
  { to: '/', label: 'Ana Sayfa', end: true },
  { to: '/satilik-araclar', label: 'Satılık Araçlar' },
  { to: '/satilan-araclar', label: 'Satılan Araçlar' },
  { to: '/hakkimizda', label: 'Hakkımızda' },
  { to: '/iletisim', label: 'İletişim' },
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  const s = useSettings()
  const { pathname } = useLocation()
  const cmp = useCompare()
  const wa = whatsappLink(s.whatsapp, 'Merhaba, BEP CAR araçları hakkında bilgi almak istiyorum.')
  const link = ({ isActive }: { isActive: boolean }) =>
    `py-3 text-sm font-medium transition-colors hover:text-accent ${isActive ? 'text-accent' : 'text-neutral-300'}`

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 bg-ink">
        <div className="mx-auto flex min-h-[72px] max-w-[1240px] items-center justify-between gap-6 px-5 lg:px-8">
          <Link to="/" aria-label="BEP CAR ana sayfa"><Logo /></Link>
          <nav className="hidden gap-7 lg:flex" aria-label="Ana menü">
            {nav.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={link}>{n.label}</NavLink>)}
          </nav>
          <div className="hidden items-center gap-2.5 lg:flex">
            <Link to="/favorilerim" aria-label="Favorilerim" className="grid size-11 place-items-center rounded-full text-neutral-300 hover:text-accent"><Heart size={20} /></Link>
            {s.phone && <a className="btn btn-outline-light" href={`tel:${s.phone}`}><Phone size={16} />Ara</a>}
            {wa && <a className="btn btn-accent" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={16} />WhatsApp</a>}
          </div>
          <button className="grid size-11 place-items-center text-white lg:hidden" aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav className="flex flex-col border-t border-neutral-800 px-5 pb-4 lg:hidden" aria-label="Mobil menü">
            {[...nav, { to: '/favorilerim', label: 'Favorilerim' }].map((n) => (
              <NavLink key={n.to} to={n.to} end={'end' in n ? n.end : false} className={link} onClick={() => setOpen(false)}>{n.label}</NavLink>
            ))}
          </nav>
        )}
      </header>

      <main key={pathname} className="flex-1"><Outlet /></main>

      <footer className="bg-ink text-neutral-400">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-14 text-sm leading-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div><Logo /><p className="mt-3">Güvenilir oto galeri.</p></div>
          <div><b className="text-white">Sayfalar</b><br /><Link to="/satilik-araclar">Satılık Araçlar</Link><br /><Link to="/satilan-araclar">Satılan Araçlar</Link><br /><Link to="/hakkimizda">Hakkımızda</Link></div>
          <div><b className="text-white">İletişim</b><br />{s.phone}<br />{s.email}<br />{s.address}</div>
          <div><b className="text-white">Yasal</b><br /><Link to="/gizlilik-politikasi">Gizlilik Politikası</Link><br /><Link to="/kullanim-kosullari">Kullanım Koşulları</Link><br />© {new Date().getFullYear()} BEP CAR</div>
        </div>
      </footer>

      {cmp.ids.length > 0 && pathname !== '/karsilastir' && (
        <div className="fixed bottom-5 left-5 z-30 flex items-center gap-3 rounded-full bg-ink py-2 pl-5 pr-2 text-sm text-white shadow-lg">
          <span>{cmp.ids.length} araç seçildi</span>
          <Link className="btn btn-accent min-h-10" to="/karsilastir">Karşılaştır</Link>
          <button className="grid size-10 place-items-center rounded-full text-neutral-300 hover:text-white" onClick={cmp.clear} aria-label="Seçimi temizle"><X size={16} /></button>
        </div>
      )}

      {/* Sabit iletişim butonları */}
      <div className="fixed bottom-5 right-5 z-30 flex flex-col gap-3">
        {s.instagram && <a href={s.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-12 place-items-center rounded-full bg-graphite text-white shadow-lg hover:text-accent"><Instagram size={20} /></a>}
        {s.phone && <a href={`tel:${s.phone}`} aria-label="Telefonla ara" className="grid size-12 place-items-center rounded-full bg-graphite text-white shadow-lg hover:text-accent"><Phone size={20} /></a>}
        {wa && <a href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp ile yaz" className="grid size-12 place-items-center rounded-full bg-accent text-ink shadow-lg hover:bg-[#ff8541]"><MessageCircle size={20} /></a>}
      </div>
    </div>
  )
}
