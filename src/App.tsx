import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { AuthProvider } from './context/Auth'

const Home = lazy(() => import('./pages/Home'))
const Listing = lazy(() => import('./pages/Listing'))
const VehicleDetail = lazy(() => import('./pages/VehicleDetail'))
const Contact = lazy(() => import('./pages/Contact'))
const Compare = lazy(() => import('./pages/Compare'))
const Favorites = lazy(() => import('./pages/Favorites'))
const Static = lazy(() => import('./pages/Static'))
const Guard = lazy(() => import('./admin/Guard'))
const AdminLogin = lazy(() => import('./admin/Login'))
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const Dashboard = lazy(() => import('./admin/Dashboard'))
const AdminVehicles = lazy(() => import('./admin/Vehicles'))
const VehicleForm = lazy(() => import('./admin/VehicleForm'))
const Catalog = lazy(() => import('./admin/Catalog'))
const AdminSettings = lazy(() => import('./admin/Settings'))
const Messages = lazy(() => import('./admin/Messages'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  return (
    <AuthProvider>
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-neutral-500">Yükleniyor…</div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="satilik-araclar" element={<Listing status="published" />} />
          <Route path="satilan-araclar" element={<Listing status="sold" />} />
          <Route path="arac/:slug" element={<VehicleDetail />} />
          <Route path="iletisim" element={<Contact />} />
          <Route path="karsilastir" element={<Compare />} />
          <Route path="favorilerim" element={<Favorites />} />
          <Route path="hakkimizda" element={<Static page="about" />} />
          <Route path="gizlilik-politikasi" element={<Static page="privacy" />} />
          <Route path="kullanim-kosullari" element={<Static page="terms" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        {/* Yönetim: genel sitede hiçbir bağlantısı yok; /admin adresi elle yazılır */}
        <Route path="admin/giris" element={<AdminLogin />} />
        <Route path="admin" element={<Guard />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="araclar" element={<AdminVehicles />} />
            <Route path="araclar/yeni" element={<VehicleForm key="new" />} />
            <Route path="araclar/:id" element={<VehicleForm />} />
            <Route path="katalog" element={<Catalog />} />
            <Route path="ayarlar" element={<AdminSettings />} />
            <Route path="mesajlar" element={<Messages />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
    </AuthProvider>
  )
}
