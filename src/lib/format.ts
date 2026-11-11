import type { Timestamp } from 'firebase/firestore'
import type { Vehicle } from '../types'

const symbols = { TRY: '₺', EUR: '€', USD: '$' } as const

export const formatPrice = (v: Pick<Vehicle, 'price' | 'currency'>) =>
  `${v.price.toLocaleString('tr-TR')} ${symbols[v.currency] ?? '₺'}`

export const formatKm = (km: number) => `${km.toLocaleString('tr-TR')} km`

export const formatDate = (t?: Timestamp) =>
  t ? t.toDate().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

const tr: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', İ: 'i' }
export const slugify = (s: string) =>
  s.replace(/[çğıöşüİ]/g, (c) => tr[c]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// SEO uyumlu adres: /arac/bmw-320i-sport-line-<firestoreId>
export const vehiclePath = (v: Pick<Vehicle, 'id' | 'title'>) => `/arac/${slugify(v.title)}-${v.id}`
export const idFromSlug = (slug: string) => slug.split('-').pop() ?? ''

export const whatsappLink = (phone: string | undefined, text: string) =>
  phone ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}` : undefined
