import { Link } from 'react-router-dom'
import { useFavorites } from '../hooks/useFavorites'
import { useVehicles } from '../hooks/useVehicles'
import { useTitle } from '../hooks/useTitle'
import VehicleCard from '../components/VehicleCard'
import { Empty, Skeletons } from '../components/States'

export default function Favorites() {
  useTitle('Favorilerim')
  const { ids } = useFavorites()
  const pub = useVehicles('published')
  const sold = useVehicles('sold')
  const all = [...pub.vehicles, ...sold.vehicles].filter((v) => ids.includes(v.id))
  const loading = pub.loading || sold.loading
  return (
    <div className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8">
      <h1 className="text-4xl font-semibold">Favorilerim</h1>
      <p className="mt-2 text-neutral-600">Favoriler yalnızca bu cihazda saklanır.</p>
      <div className="mt-8">
        {loading ? <Skeletons /> : all.length === 0 ? (
          <Empty title="Henüz favori aracınız yok" text="Araç kartlarındaki kalp simgesine dokunarak beğendiklerinizi buraya ekleyin." />
        ) : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{all.map((v) => <VehicleCard key={v.id} v={v} />)}</div>}
        {!loading && all.length === 0 && <div className="mt-6 text-center"><Link className="btn btn-accent" to="/satilik-araclar">Satılık araçlara git</Link></div>}
      </div>
    </div>
  )
}
