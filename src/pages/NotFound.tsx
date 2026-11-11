import { Link } from 'react-router-dom'
import { useTitle } from '../hooks/useTitle'

export default function NotFound() {
  useTitle('Sayfa bulunamadı')
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="font-display text-7xl font-bold text-accent">404</p>
      <h1 className="mt-4 text-3xl font-semibold">Aradığınız sayfa bulunamadı</h1>
      <p className="mt-3 text-neutral-600">Adres hatalı olabilir ya da araç artık yayında olmayabilir.</p>
      <Link className="btn btn-accent mt-8" to="/satilik-araclar">Satılık araçlara dön</Link>
    </div>
  )
}
