import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSettings } from './useSettings'

const base = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? '').replace(/\/$/, '')
const DEFAULT = 'BEP CAR – Güvenilir Oto Galeri'

function setMeta(attr: 'name' | 'property', key: string, content?: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!content) { el?.remove(); return }
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.content = content
}

interface Extra { image?: string; jsonLd?: object }

/** Sayfa başlığı, açıklama, canonical, Open Graph ve (varsa) yapılandırılmış veri. */
export function useTitle(title?: string, description?: string, extra: Extra = {}) {
  const { pathname } = useLocation()
  const st = useSettings()
  const desc = description ?? st.metaDescription
  const full = title ? `${title} | BEP CAR` : st.siteTitle || DEFAULT
  const ld = extra.jsonLd ? JSON.stringify(extra.jsonLd) : ''

  useEffect(() => {
    const url = `${base || window.location.origin}${pathname === '/' ? '' : pathname}` || window.location.origin
    document.title = full
    setMeta('name', 'description', desc)
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
    link.href = url
    setMeta('property', 'og:title', full); setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', url); setMeta('property', 'og:image', extra.image)
    document.getElementById('ld-json')?.remove()
    if (ld) { const sc = document.createElement('script'); sc.id = 'ld-json'; sc.type = 'application/ld+json'; sc.text = ld; document.head.appendChild(sc) }
    return () => { document.getElementById('ld-json')?.remove() }
  }, [full, desc, pathname, extra.image, ld])
}
