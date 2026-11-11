import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface Category { id: string; name: string; order?: number }
export interface Brand { id: string; name: string; categories?: string[] }
export interface Model { id: string; name: string; brandId: string }
export interface Generation { id: string; name: string; modelId: string }
export interface Pkg { id: string; name: string; modelId: string; generationId?: string | null }
export interface Equip { id: string; name: string; group: string }

function useCol<T extends { name: string; order?: number }>(name: string): T[] {
  const [rows, setRows] = useState<T[]>([])
  useEffect(() => onSnapshot(collection(db, name), (s) =>
    setRows(s.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as T).sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999) || a.name.localeCompare(b.name, 'tr'))),
  () => {}), [name])
  return rows
}

export function useCatalog() {
  return {
    categories: useCol<Category>('vehicleCategories'),
    brands: useCol<Brand>('vehicleBrands'),
    models: useCol<Model>('vehicleModels'),
    generations: useCol<Generation>('vehicleGenerations'),
    packages: useCol<Pkg>('vehiclePackages'),
    equipment: useCol<Equip>('vehicleEquipment'),
  }
}
