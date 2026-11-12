import { Link } from 'react-router-dom'
import { useCompare } from '../hooks/useCompare'
import { useVehicles } from '../hooks/useVehicles'
import { useTitle } from '../hooks/useTitle'
import { formatKm, formatPrice, vehiclePath } from '../lib/format'
import { Empty, Skeletons } from '../components/States'
import type { Vehicle } from '../types'

const rows: [string, (v: Vehicle) => string | number | undefined][] = [
  ['Fiyat', (v) => (v.status === 'sold' ? 'Satıldı' : formatPrice(v))], ['Model yılı', (v) => v.year], ['Kilometre', (v) => formatKm(v.mileage)],
  ['Yakıt', (v) => v.fuel], ['Vites', (v) => v.transmission], ['Çekiş', (v) => v.driveType], ['Kasa tipi', (v) => v.bodyType], ['Renk', (v) => v.color],
  ['Motor hacmi', (v) => (v.engineCc ? `${v.engineCc} cc` : undefined)], ['Motor gücü', (v) => (v.enginePowerHp ? `${v.enginePowerHp} HP` : undefined)],
  ['Hasar durumu', (v) => (v.damageStatus && v.damageStatus !== 'Belirtilmemiş' ? v.damageStatus : undefined)],
  ['TRAMER', (v) => (v.tramerAmount ? `${v.tramerAmount.toLocaleString('tr-TR')} ₺` : undefined)],
  ['Takas', (v) => (v.exchange === undefined ? undefined : v.exchange ? 'Olur' : 'Olmaz')],
]

export default function Compare() {
  useTitle('Araç Karşılaştırma')
  const { ids, toggle, clear } = useCompare()
  const pub = useVehicles('published'); const sold = useVehicles('sold')
  const loading = pub.loading || sold.loading
  const list = ids.map((id) => [...pub.vehicles, ...sold.vehicles].find((v) => v.id === id)).filter((v): v is Vehicle => !!v)

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3"><h1 className="text-4xl font-semibold">Araç Karşılaştırma</h1>
        {list.length > 0 && <button className="btn btn-outline-dark" onClick={clear}>Listeyi temizle</button>}</div>
      <p className="mt-2 text-neutral-600">En fazla 3 aracı yan yana karşılaştırabilirsiniz.</p>
      <div className="mt-8">
        {loading ? <Skeletons n={3} /> : list.length === 0 ? (
          <><Empty title="Karşılaştırılacak araç yok" text="Araç kartlarındaki Karşılaştır düğmesiyle araç ekleyin." />
            <div className="mt-6 text-center"><Link className="btn btn-accent" to="/satilik-araclar">Satılık araçlara git</Link></div></>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-neutral-200">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr><td className="w-36 bg-paper p-4" />
                {list.map((v) => (
                  <th key={v.id} scope="col" className="bg-paper p-4 text-left align-top">
                    {v.images[0] && <img src={v.images[0].url} alt="" className="mb-3 aspect-[4/3] w-full rounded-xl object-cover" />}
                    <Link to={vehiclePath(v)} className="text-base font-semibold hover:text-accent-deep">{v.title}</Link>
                    <button className="mt-2 block text-xs font-normal underline" onClick={() => toggle(v.id)}>Karşılaştırmadan çıkar</button>
                  </th>))}</tr></thead>
              <tbody>{rows.map(([label, get]) => {
                const vals = list.map(get)
                if (vals.every((x) => x === undefined)) return null
                return <tr key={label} className="border-t border-neutral-100"><th scope="row" className="p-4 text-left font-medium text-neutral-500">{label}</th>
                  {vals.map((x, i) => <td key={i} className="p-4 font-medium">{x ?? '–'}</td>)}</tr>
              })}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
