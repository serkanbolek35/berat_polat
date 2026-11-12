import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, type Query } from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface Category { id: string; name: string; order?: number }
export interface Brand { id: string; name: string; categories?: string[] }
export interface Model { id: string; name: string; brandId: string }
export interface Generation { id: string; name: string; modelId: string }
export interface Pkg { id: string; name: string; modelId: string; generationId?: string | null }
export interface Equip { id: string; name: string; group: string }

type Named = { name: string; order?: number }
const sortRows = <T extends Named>(rows: T[]) => rows.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999) || a.name.localeCompare(b.name, 'tr'))

/** q === null ise dinlemez (üst seçim yapılmadıysa gereksiz okuma yapılmaz). */
function useRows<T extends Named>(key: string, build: () => Query | null): T[] {
  const [rows, setRows] = useState<T[]>([])
  useEffect(() => {
    const q = build()
    if (!q) { setRows([]); return }
    return onSnapshot(q, (s) => setRows(sortRows(s.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as T))), () => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return rows
}
const all = (name: string) => () => query(collection(db, name))

/** Yönetim paneli: tüm katalog. */
export function useCatalog() {
  return {
    categories: useRows<Category & Named>('c', all('vehicleCategories')),
    brands: useRows<Brand & Named>('b', all('vehicleBrands')),
    models: useRows<Model & Named>('m', all('vehicleModels')),
    generations: useRows<Generation & Named>('g', all('vehicleGenerations')),
    packages: useRows<Pkg & Named>('p', all('vehiclePackages')),
    equipment: useRows<Equip & Named>('e', all('vehicleEquipment')),
  }
}

/** Genel site: kategoriler ve markalar her zaman; model/nesil/paket yalnızca seçilen üst öğe için okunur (okuma kotasını korur). */
export function useCatalogScoped(brandId: string, modelId: string) {
  return {
    categories: useRows<Category & Named>('c', all('vehicleCategories')),
    brands: useRows<Brand & Named>('b', all('vehicleBrands')),
    models: useRows<Model & Named>(`m:${brandId}`, () => (brandId ? query(collection(db, 'vehicleModels'), where('brandId', '==', brandId)) : null)),
    generations: useRows<Generation & Named>(`g:${modelId}`, () => (modelId ? query(collection(db, 'vehicleGenerations'), where('modelId', '==', modelId)) : null)),
    packages: useRows<Pkg & Named>(`p:${modelId}`, () => (modelId ? query(collection(db, 'vehiclePackages'), where('modelId', '==', modelId)) : null)),
  }
}
