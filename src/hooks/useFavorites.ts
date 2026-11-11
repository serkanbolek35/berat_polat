import { useCallback, useEffect, useState } from 'react'

const KEY = 'bepcar:favorites'
const read = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] } }

export function useFavorites() {
  const [ids, setIds] = useState<string[]>(read)
  useEffect(() => {
    const sync = () => setIds(read())
    window.addEventListener('bepcar:fav', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('bepcar:fav', sync); window.removeEventListener('storage', sync) }
  }, [])
  const toggle = useCallback((id: string) => {
    const cur = read()
    try { localStorage.setItem(KEY, JSON.stringify(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])) } catch { /* depolama kapalı */ }
    window.dispatchEvent(new Event('bepcar:fav'))
  }, [])
  return { ids, isFav: (id: string) => ids.includes(id), toggle }
}
