import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'

const required = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_APP_ID'] as const
const missing = required.filter((k) => !import.meta.env[k])
const root = createRoot(document.getElementById('root')!)

if (missing.length) {
  // Anahtarlar derleme anında koda gömülür; eksikse Firebase beyaz ekranla çöker. Bunun yerine nedenini göster.
  root.render(
    <div style={{ maxWidth: 560, margin: '15vh auto', padding: 24, fontFamily: 'system-ui, sans-serif', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 24 }}>Firebase yapılandırması eksik</h1>
      <p>Aşağıdaki ortam değişkenleri bu yayında tanımlı değil:</p>
      <ul>{missing.map((k) => <li key={k}><code>{k}</code></li>)}</ul>
      <p>Yerelde <code>.env</code> dosyasını doldurup geliştirme sunucusunu yeniden başlatın. Yayında (Vercel vb.) değişkenleri proje ayarlarına ekleyip yeniden derleyin.</p>
    </div>,
  )
} else {
  import('./App').then(({ default: App }) =>
    root.render(<StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>))
}
