import type { Vehicle } from '../types'
import type { Scope } from '../hooks/useVehicles'

export const sortLabels = { newest: 'En yeni', priceAsc: 'Fiyat (artan)', priceDesc: 'Fiyat (azalan)', kmAsc: 'Kilometre (az)', yearDesc: 'Model yılı (yeni)', yearAsc: 'Model yılı (eski)' } as const
export type Sort = keyof typeof sortLabels

export const damageOptions: [string, string][] = [
  ['yok', 'Hasar Kaydı Yok'], ['var', 'Hasar Kaydı Var'], ['agir', 'Ağır Hasar Kayıtlı'], ['pert', 'Pert Kayıtlı'],
  ['boyali', 'Boyalı'], ['degisen', 'Değişen Parça Var'], ['hatasiz', 'Hatasız / Boyasız / Değişensiz'],
]
export const dateOptions: [number, string][] = [[1, 'Son 24 saat'], [3, 'Son 3 gün'], [7, 'Son 7 gün'], [15, 'Son 15 gün'], [30, 'Son 30 gün']]

type NumKey = 'yilMin' | 'yilMax' | 'fiyatMin' | 'fiyatMax' | 'kmMin' | 'kmMax' | 'ccMin' | 'ccMax' | 'hpMin' | 'hpMax'
type ListKey = 'yakit' | 'vites' | 'kasa' | 'cekis' | 'renk' | 'hasar'
type BoolKey = 'ilkSahibi' | 'garanti' | 'servis' | 'takas' | 'kredi' | 'onecikan'
export interface Filters {
  q: string; kategori: string; marka: string; model: string; nesil: string; paket: string
  il: string; ilce: string; tarih: number; turbo: '' | '1' | '0'; silindir: number[]; sirala: Sort
  yilMin?: number; yilMax?: number; fiyatMin?: number; fiyatMax?: number; kmMin?: number; kmMax?: number
  ccMin?: number; ccMax?: number; hpMin?: number; hpMax?: number
  yakit: string[]; vites: string[]; kasa: string[]; cekis: string[]; renk: string[]; hasar: string[]
  ilkSahibi: boolean; garanti: boolean; servis: boolean; takas: boolean; kredi: boolean; onecikan: boolean
}

export const emptyFilters: Filters = {
  q: '', kategori: '', marka: '', model: '', nesil: '', paket: '', il: '', ilce: '', tarih: 0, turbo: '', silindir: [], sirala: 'newest',
  yakit: [], vites: [], kasa: [], cekis: [], renk: [], hasar: [],
  ilkSahibi: false, garanti: false, servis: false, takas: false, kredi: false, onecikan: false,
}
const nums: NumKey[] = ['yilMin', 'yilMax', 'fiyatMin', 'fiyatMax', 'kmMin', 'kmMax', 'ccMin', 'ccMax', 'hpMin', 'hpMax']
const lists: ListKey[] = ['yakit', 'vites', 'kasa', 'cekis', 'renk', 'hasar']
const bools: BoolKey[] = ['ilkSahibi', 'garanti', 'servis', 'takas', 'kredi', 'onecikan']
const strs = ['q', 'kategori', 'marka', 'model', 'nesil', 'paket', 'il', 'ilce'] as const

export function parseFilters(sp: URLSearchParams): Filters {
  const f: Filters = { ...emptyFilters, silindir: [], yakit: [], vites: [], kasa: [], cekis: [], renk: [], hasar: [] }
  strs.forEach((k) => { f[k] = sp.get(k) ?? '' })
  nums.forEach((k) => { const raw = sp.get(k); const n = raw === null || raw === '' ? NaN : Number(raw); if (Number.isFinite(n)) f[k] = n })
  lists.forEach((k) => { f[k] = (sp.get(k) ?? '').split(',').filter(Boolean) })
  bools.forEach((k) => { f[k] = sp.get(k) === '1' })
  f.silindir = (sp.get('silindir') ?? '').split(',').map(Number).filter((n) => Number.isFinite(n) && n > 0)
  f.turbo = sp.get('turbo') === '1' ? '1' : sp.get('turbo') === '0' ? '0' : ''
  f.tarih = Number(sp.get('tarih')) || 0
  const s = sp.get('sirala') as Sort | null; f.sirala = s && s in sortLabels ? s : 'newest'
  return f
}

/** Yalnızca varsayılandan farklı değerler adrese yazılır (paylaşılabilir, kısa bağlantılar). */
export function toParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams()
  strs.forEach((k) => f[k] && p.set(k, f[k]))
  nums.forEach((k) => f[k] !== undefined && p.set(k, String(f[k])))
  lists.forEach((k) => f[k].length && p.set(k, f[k].join(',')))
  bools.forEach((k) => f[k] && p.set(k, '1'))
  if (f.silindir.length) p.set('silindir', f.silindir.join(','))
  if (f.turbo) p.set('turbo', f.turbo)
  if (f.tarih) p.set('tarih', String(f.tarih))
  if (f.sirala !== 'newest') p.set('sirala', f.sirala)
  return p
}

/** Sunucu sorgusu için tek bir eşitlik filtresi: en derin seçili düzey (kimlikler benzersiz olduğundan üst düzeyler zaten kapsanır). */
export function scopeOf(f: Filters): Scope | null {
  if (f.paket) return { field: 'packageId', id: f.paket }
  if (f.nesil) return { field: 'generationId', id: f.nesil }
  if (f.model) return { field: 'modelId', id: f.model }
  if (f.marka) return { field: 'brandId', id: f.marka }
  if (f.kategori) return { field: 'categoryId', id: f.kategori }
  return null
}

const ms = (t?: { toMillis(): number }) => t?.toMillis() ?? 0
const damageTest: Record<string, (v: Vehicle) => boolean> = {
  yok: (v) => v.damageStatus === 'Hasar Kaydı Yok',
  var: (v) => ['Hasar Kaydı Var', 'Ağır Hasar Kayıtlı', 'Pert Kayıtlı'].includes(v.damageStatus ?? ''),
  agir: (v) => v.damageStatus === 'Ağır Hasar Kayıtlı',
  pert: (v) => v.damageStatus === 'Pert Kayıtlı',
  boyali: (v) => (v.paintedCount ?? 0) > 0,
  degisen: (v) => (v.replacedCount ?? 0) > 0,
  // Doğrulanmamış bilgi asla "hatasız" sayılmaz.
  hatasiz: (v) => v.damageStatus === 'Hasar Kaydı Yok' && v.panelsVerified === true && !v.paintedCount && !v.replacedCount,
}

export function applyFilters(list: Vehicle[], f: Filters, now = Date.now()): Vehicle[] {
  const t = f.q.toLocaleLowerCase('tr').trim()
  const inRange = (x: number | undefined, min?: number, max?: number) =>
    (min === undefined && max === undefined) || (x !== undefined && (min === undefined || x >= min) && (max === undefined || x <= max))
  const out = list.filter((v) =>
    (!t || `${v.brand} ${v.model} ${v.generation ?? ''} ${v.package ?? ''} ${v.title}`.toLocaleLowerCase('tr').includes(t)) &&
    (!f.kategori || v.categoryId === f.kategori) && (!f.marka || v.brandId === f.marka) && (!f.model || v.modelId === f.model) &&
    (!f.nesil || v.generationId === f.nesil) && (!f.paket || v.packageId === f.paket) &&
    inRange(v.year, f.yilMin, f.yilMax) && inRange(v.price, f.fiyatMin, f.fiyatMax) && inRange(v.mileage, f.kmMin, f.kmMax) &&
    inRange(v.engineCc, f.ccMin, f.ccMax) && inRange(v.enginePowerHp, f.hpMin, f.hpMax) &&
    (!f.yakit.length || f.yakit.includes(v.fuel)) && (!f.vites.length || f.vites.includes(v.transmission)) &&
    (!f.kasa.length || f.kasa.includes(v.bodyType ?? '')) && (!f.cekis.length || f.cekis.includes(v.driveType ?? '')) &&
    (!f.renk.length || f.renk.includes(v.color ?? '')) && (!f.silindir.length || f.silindir.includes(v.cylinders ?? -1)) &&
    (!f.turbo || v.turbo === (f.turbo === '1')) &&
    (!f.hasar.length || f.hasar.some((k) => damageTest[k]?.(v))) &&
    (!f.ilkSahibi || v.firstOwner === true) && (!f.garanti || v.warranty === true) && (!f.servis || v.authorizedService === true) &&
    (!f.takas || v.exchange === true) && (!f.kredi || v.financing === true) && (!f.onecikan || v.featured === true) &&
    (!f.il || v.province === f.il) && (!f.ilce || v.district === f.ilce) &&
    (!f.tarih || ms(v.listedAt) >= now - f.tarih * 86400000))
  const by: Record<Sort, (a: Vehicle, b: Vehicle) => number> = {
    newest: () => 0, priceAsc: (a, b) => a.price - b.price, priceDesc: (a, b) => b.price - a.price,
    kmAsc: (a, b) => a.mileage - b.mileage, yearDesc: (a, b) => b.year - a.year, yearAsc: (a, b) => a.year - b.year,
  }
  return f.sirala === 'newest' ? out : [...out].sort(by[f.sirala])
}

export const activeCount = (f: Filters) => { const p = toParams(f); p.delete('sirala'); return [...p.keys()].length }

const fmt = (n: number) => n.toLocaleString('tr-TR')
export interface Badge { key: string; label: string; clear: Partial<Filters> }
export function badges(f: Filters, nameOf: (kind: 'kategori' | 'marka' | 'model' | 'nesil' | 'paket', id: string) => string): Badge[] {
  const b: Badge[] = []
  if (f.q) b.push({ key: 'q', label: `“${f.q}”`, clear: { q: '' } })
  if (f.kategori) b.push({ key: 'kategori', label: nameOf('kategori', f.kategori), clear: { kategori: '', marka: '', model: '', nesil: '', paket: '' } })
  if (f.marka) b.push({ key: 'marka', label: nameOf('marka', f.marka), clear: { marka: '', model: '', nesil: '', paket: '' } })
  if (f.model) b.push({ key: 'model', label: nameOf('model', f.model), clear: { model: '', nesil: '', paket: '' } })
  if (f.nesil) b.push({ key: 'nesil', label: nameOf('nesil', f.nesil), clear: { nesil: '', paket: '' } })
  if (f.paket) b.push({ key: 'paket', label: nameOf('paket', f.paket), clear: { paket: '' } })
  const range = (key: string, label: string, a: NumKey, z: NumKey, unit = '', plain = false) => {
    const fmt = (n: number) => (plain ? String(n) : n.toLocaleString('tr-TR'))
    if (f[a] === undefined && f[z] === undefined) return
    b.push({ key, label: `${label}: ${f[a] !== undefined ? fmt(f[a]!) : '…'} – ${f[z] !== undefined ? fmt(f[z]!) : '…'}${unit}`, clear: { [a]: undefined, [z]: undefined } })
  }
  range('yil', 'Yıl', 'yilMin', 'yilMax', '', true); range('fiyat', 'Fiyat', 'fiyatMin', 'fiyatMax', ' ₺'); range('km', 'Km', 'kmMin', 'kmMax')
  range('cc', 'Motor hacmi', 'ccMin', 'ccMax', ' cc'); range('hp', 'Güç', 'hpMin', 'hpMax', ' HP')
  const dmg = Object.fromEntries(damageOptions)
  lists.forEach((k) => f[k].forEach((v) => b.push({ key: `${k}:${v}`, label: k === 'hasar' ? dmg[v] ?? v : v, clear: { [k]: f[k].filter((x) => x !== v) } })))
  f.silindir.forEach((n) => b.push({ key: `silindir:${n}`, label: `${n} silindir`, clear: { silindir: f.silindir.filter((x) => x !== n) } }))
  if (f.turbo) b.push({ key: 'turbo', label: f.turbo === '1' ? 'Turbo' : 'Atmosferik', clear: { turbo: '' } })
  const flags: [BoolKey, string][] = [['ilkSahibi', 'İlk sahibinden'], ['garanti', 'Garantili'], ['servis', 'Yetkili servis bakımlı'], ['takas', 'Takas olur'], ['kredi', 'Krediye uygun'], ['onecikan', 'Öne çıkan']]
  flags.forEach(([k, l]) => f[k] && b.push({ key: k, label: l, clear: { [k]: false } }))
  if (f.il) b.push({ key: 'il', label: f.il, clear: { il: '', ilce: '' } })
  if (f.ilce) b.push({ key: 'ilce', label: f.ilce, clear: { ilce: '' } })
  if (f.tarih) b.push({ key: 'tarih', label: dateOptions.find(([d]) => d === f.tarih)?.[1] ?? `Son ${f.tarih} gün`, clear: { tarih: 0 } })
  return b
}
