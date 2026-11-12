import { useEffect, useState } from 'react'
import { collection, doc, limit as fsLimit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Vehicle } from '../types'

export interface Scope { field: 'categoryId' | 'brandId' | 'modelId' | 'generationId' | 'packageId'; id: string }
interface Options { featured?: boolean; max?: number; scope?: Scope | null }

/** Gerçek zamanlı: durum değiştiğinde araç ilgili listeden otomatik düşer/eklenir. */
export function useVehicles(status: 'published' | 'sold', opts: Options = {}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { featured, max = 100, scope } = opts
  const sf = scope?.field, sid = scope?.id

  useEffect(() => {
    setLoading(true)
    const order = status === 'sold' ? 'soldAt' : 'listedAt'
    const constraints = [where('status', '==', status)]
    if (featured) constraints.push(where('featured', '==', true))
    if (sf && sid) constraints.push(where(sf, '==', sid))
    const q = query(collection(db, 'vehicles'), ...constraints, orderBy(order, 'desc'), fsLimit(max))
    return onSnapshot(
      q,
      (snap) => { setVehicles(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Vehicle)); setLoading(false) },
      (e) => { console.error(e); setError(true); setLoading(false) },
    )
  }, [status, featured, max, sf, sid])

  return { vehicles, loading, error }
}

export function useVehicle(id: string) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!id) { setLoading(false); return }
    return onSnapshot(
      doc(db, 'vehicles', id),
      (s) => { setVehicle(s.exists() ? ({ id: s.id, ...s.data() } as Vehicle) : null); setLoading(false) },
      () => { setVehicle(null); setLoading(false) },
    )
  }, [id])
  return { vehicle, loading }
}

export { useSettings } from './useSettings'
