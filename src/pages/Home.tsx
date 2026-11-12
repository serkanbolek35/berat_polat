import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useVehicles, useSettings } from '../hooks/useVehicles'
import { useCatalogScoped } from '../hooks/useCatalog'
import Dropdown from '../components/Dropdown'
import { useTitle } from '../hooks/useTitle'
import VehicleCard from '../components/VehicleCard'
import { Empty, ErrorBox, Skeletons } from '../components/States'
import { whatsappLink } from '../lib/format'

const reasons = [
  ['Şeffaf bilgi', 'Hasar kaydı, boya ve değişen bilgileri panel panel net şekilde paylaşılır.'],
  ['Detaylı fotoğraflar', 'Her araç için kapsamlı galeri ve ekspertiz raporu.'],
  ['Güvenilir hizmet', 'Satış öncesi ve sonrası doğrudan galeri sahibiyle iletişim.'],
  ['Kanıtlanmış portföy', 'Satılan araçlarımız, geçmiş başarımızın açık kaydıdır.'],
]

const Section = ({ title, to, children }: { title: string; to?: string; children: React.ReactNode }) => (
  <section className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8">
    <div className="mb-7 flex items-end justify-between gap-4">
      <h2 className="text-3xl font-semibold sm:text-4xl">{title}</h2>
      {to && <Link className="btn btn-outline-dark" to={to}>Tümünü gör</Link>}
    </div>
    {children}
  </section>
)

export default function Home() {
  useTitle()
  const nav = useNavigate()
  const s = useSettings()
  const [q, setQ] = useState({ marka: '', model: '', yakit: '', fiyatMax: '' })
  const cat = useCatalogScoped(q.marka, q.model)
  const featured = useVehicles('published', { featured: true, max: 3 })
  const latest = useVehicles('published', { max: 6 })
  const sold = useVehicles('sold', { max: 4 })

  const search = (e: FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams(Object.entries(q).filter(([, v]) => v))
    nav(`/satilik-araclar?${p}`)
  }

  return (
    <>
      <section className="bg-[radial-gradient(120%_90%_at_75%_0%,#2b2b2f_0%,#0b0b0c_60%)] pb-24 pt-20 text-white">
        <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }} className="max-w-3xl">
            <h1 className="text-4xl font-bold leading-[1.08] sm:text-6xl">{s.heroTitle || 'Hayalinizdeki Araca BEP CAR Güvencesiyle Ulaşın'}</h1>
            <p className="mt-5 text-lg text-neutral-300">{s.heroSubtitle || 'Kaliteli araçlar, şeffaf bilgiler ve güvenilir hizmet.'}</p>
          </motion.div>
          <form onSubmit={search} className="mt-12 grid gap-3 rounded-3xl border border-neutral-800 bg-[#141415] p-5 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-end">
            <Dropdown dark label="Marka" allLabel="Tüm Markalar" value={q.marka} options={cat.brands} onChange={(id) => setQ({ ...q, marka: id, model: '' })} />
            <Dropdown dark label="Model" allLabel="Tüm Modeller" value={q.model} options={cat.models} disabled={!q.marka} disabledHint="Önce marka seçin" emptyHint="Bu markada model yok" onChange={(id) => setQ({ ...q, model: id })} />
            <label className="text-xs text-neutral-400">Yakıt
              <select className="input input-dark mt-1.5" value={q.yakit} onChange={(e) => setQ({ ...q, yakit: e.target.value })}>
                <option value="">Hepsi</option>
                {['Benzin', 'Dizel', 'LPG', 'Benzin + LPG', 'Hibrit', 'Plug-in Hibrit', 'Elektrik'].map((f) => <option key={f}>{f}</option>)}
              </select>
            </label>
            <label className="text-xs text-neutral-400">Maks. fiyat (₺)
              <input className="input input-dark mt-1.5" inputMode="numeric" placeholder="Örn. 1500000" value={q.fiyatMax} onChange={(e) => setQ({ ...q, fiyatMax: e.target.value.replace(/\D/g, '') })} />
            </label>
            <button className="btn btn-accent h-12 px-8" type="submit">Araç ara</button>
          </form>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1240px] gap-6 px-5 pt-14 sm:grid-cols-2 lg:px-8">
        <Link to="/satilik-araclar" className="rounded-[20px] bg-ink p-9 text-white">
          <h2 className="text-3xl font-semibold">Satılık Araçlarımız</h2>
          <p className="mb-7 mt-3 text-neutral-300">Şu an yayında olan, detaylı bilgilerle sunulan araçlarımız.</p>
          <span className="btn btn-accent">İlanları gör</span>
        </Link>
        <Link to="/satilan-araclar" className="rounded-[20px] bg-paper p-9">
          <h2 className="text-3xl font-semibold">Satılan Araçlarımız</h2>
          <p className="mb-7 mt-3 text-neutral-600">Daha önce teslim ettiğimiz araçlar, güvenin en net kanıtı.</p>
          <span className="btn btn-outline-dark">Portföyü incele</span>
        </Link>
      </div>

      {(featured.loading || featured.vehicles.length > 0) && (
        <Section title="Öne Çıkan Araçlar" to="/satilik-araclar">
          {featured.loading ? <Skeletons /> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{featured.vehicles.map((v) => <VehicleCard key={v.id} v={v} />)}</div>}
        </Section>
      )}

      <Section title="Son Eklenen Araçlar" to="/satilik-araclar">
        {latest.loading ? <Skeletons /> : latest.error ? <ErrorBox /> : latest.vehicles.length === 0
          ? <Empty title="Şu an yayında araç yok" text="Yeni araçlarımız çok yakında burada olacak. Dilerseniz bize ulaşıp aradığınız aracı iletebilirsiniz." />
          : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{latest.vehicles.map((v) => <VehicleCard key={v.id} v={v} />)}</div>}
      </Section>

      {sold.vehicles.length > 0 && (
        <div className="bg-paper"><Section title="Satılan Araçlarımızdan Örnekler" to="/satilan-araclar">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{sold.vehicles.map((v) => <VehicleCard key={v.id} v={v} />)}</div>
        </Section></div>
      )}

      <Section title="Neden BEP CAR?">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map(([t, d]) => <div key={t} className="border-t-[3px] border-accent pt-4"><h3 className="text-xl font-semibold">{t}</h3><p className="mt-2 leading-relaxed text-neutral-600">{d}</p></div>)}
        </div>
      </Section>

      <div className="mx-auto max-w-[1240px] px-5 pb-16 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-8 rounded-[28px] bg-ink p-10 sm:p-14">
          <div className="max-w-xl"><h2 className="text-3xl font-semibold text-white">Aradığınız aracı bulamadınız mı?</h2><p className="mt-3 text-neutral-300">Bize yazın, ihtiyacınıza uygun aracı sizin için bulalım.</p></div>
          <div className="flex flex-wrap gap-3">
            {whatsappLink(s.whatsapp, 'Merhaba, aradığım araç hakkında yazıyorum.') && <a className="btn btn-accent" target="_blank" rel="noreferrer" href={whatsappLink(s.whatsapp, 'Merhaba, aradığım araç hakkında yazıyorum.')}>WhatsApp ile yazın</a>}
            <Link className="btn btn-outline-light" to="/iletisim">İletişim formu</Link>
          </div>
        </div>
      </div>
    </>
  )
}
