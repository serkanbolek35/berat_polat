import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { ContactMessage, Vehicle } from '../types'

const ms = (v: Vehicle) => (v.updatedAt ?? v.createdAt)?.toMillis() ?? 0

export function useAllVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]); const [loading, setLoading] = useState(true)
  useEffect(() => onSnapshot(collection(db, 'vehicles'), (s) => {
    setVehicles(s.docs.map((d) => ({ id: d.id, images: [], ...d.data() }) as unknown as Vehicle).sort((a, b) => ms(b) - ms(a))); setLoading(false)
  }, () => setLoading(false)), [])
  return { vehicles, loading }
}

export type Msg = ContactMessage & { id: string; createdAt?: { toDate(): Date } }
export function useMessages() {
  const [messages, setMessages] = useState<Msg[]>([])
  useEffect(() => onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'desc')), (s) =>
    setMessages(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Msg))), [])
  return messages
}
