// Derleme sonrası çalışır: sitemap.xml, robots.txt ve her herkese açık araç için
// meta etiketleri / yapılandırılmış veri içeren statik bir giriş sayfası üretir.
// Firebase Hosting, var olan dosyayı yönlendirme kuralından önce sunar; sayfa yine normal React uygulamasını açar.
// Sonuç yalnızca derleme anındaki araçları kapsar: ilan ekleyince/satınca `npm run build && firebase deploy --only hosting` çalıştırın.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { loadEnv } from 'vite'
import { initializeApp } from 'firebase/app'
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore'

const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env }
const SITE = (env.VITE_SITE_URL || '').replace(/\/$/, '')
const dist = 'dist'
if (!existsSync(`${dist}/index.html`)) { console.error('dist/index.html yok; önce vite build çalıştırın.'); process.exit(1) }

const tr = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', İ: 'i' }
const slugify = (s) => s.replace(/[çğıöşüİ]/g, (c) => tr[c]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

writeFileSync(`${dist}/robots.txt`, `User-agent: *\nDisallow: /admin\n${SITE ? `\nSitemap: ${SITE}/sitemap.xml\n` : ''}`)
if (!SITE) { console.warn('VITE_SITE_URL tanımlı değil: sitemap ve araç sayfaları üretilmedi.'); process.exit(0) }

try {
  const app = initializeApp({ apiKey: env.VITE_FIREBASE_API_KEY, projectId: env.VITE_FIREBASE_PROJECT_ID, appId: env.VITE_FIREBASE_APP_ID })
  const snap = await getDocs(query(collection(getFirestore(app), 'vehicles'), where('status', 'in', ['published', 'sold'])))
  const template = readFileSync(`${dist}/index.html`, 'utf8')
  const urls = ['', '/satilik-araclar', '/satilan-araclar', '/hakkimizda', '/iletisim'].map((p) => ({ loc: SITE + p }))

  for (const d of snap.docs) {
    const v = d.data(); const path = `/arac/${slugify(v.title || 'arac')}-${d.id}`; const url = SITE + path
    const title = `${v.title} | BEP CAR`
    const desc = `${v.title} – ${v.year}, ${Number(v.mileage).toLocaleString('tr-TR')} km, ${v.fuel}${v.status === 'sold' ? ' (Satıldı)' : ''}`
    const image = v.images?.[0]?.url
    const ld = {
      '@context': 'https://schema.org', '@type': ['Otomobil', 'SUV', 'Elektrikli Araçlar', 'Arazi Araçları', 'Pick-up'].includes(v.category) ? 'Car' : 'Vehicle',
      name: v.title, brand: { '@type': 'Brand', name: v.brand }, model: v.model, vehicleModelDate: String(v.year),
      mileageFromOdometer: { '@type': 'QuantitativeValue', value: v.mileage, unitCode: 'KMT' }, fuelType: v.fuel, vehicleTransmission: v.transmission,
      image: (v.images || []).map((i) => i.url),
      offers: { '@type': 'Offer', price: v.status === 'sold' ? v.soldPrice : v.price, priceCurrency: v.currency, url, availability: v.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock' },
    }
    const head = [
      `<link rel="canonical" href="${esc(url)}" />`,
      `<meta property="og:title" content="${esc(title)}" />`, `<meta property="og:description" content="${esc(desc)}" />`,
      `<meta property="og:url" content="${esc(url)}" />`, image ? `<meta property="og:image" content="${esc(image)}" />` : '',
      `<script type="application/ld+json" id="ld-json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
    ].join('\n    ')
    const html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
      .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(desc)}" />`)
      .replace(/<meta property="og:(title|description|url|image)"[^>]*>\s*/g, '')
      .replace('</head>', `    ${head}\n  </head>`)
      .replace('<div id="root"></div>', `<div id="root"></div>\n    <noscript><h1>${esc(v.title)}</h1><p>${esc(desc)}</p></noscript>`)
    mkdirSync(`${dist}${path}`, { recursive: true }); writeFileSync(`${dist}${path}/index.html`, html)
    urls.push({ loc: url, lastmod: v.updatedAt?.toDate?.().toISOString().slice(0, 10) })
  }
  writeFileSync(`${dist}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`)
  console.log(`SEO: ${snap.size} araç sayfası ve sitemap üretildi.`)
} catch (e) {
  console.warn('SEO adımı atlandı (Firestore okunamadı):', e.message)
}
process.exit(0)
