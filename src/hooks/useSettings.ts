import { useSyncExternalStore } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { SiteSettings } from '../types'

// Tek ortak dinleyici: sayfadaki tüm bileşenler aynı abonelikten beslenir.
let cache: SiteSettings = {}
let started = false
const subs = new Set<() => void>()
function start() {
  if (started) return
  started = true
  onSnapshot(doc(db, 'siteSettings', 'main'), (s) => { cache = (s.data() as SiteSettings) ?? {}; subs.forEach((f) => f()) }, () => {})
}
export function useSettings(): SiteSettings {
  start()
  return useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb) } }, () => cache)
}
