import { useCallback, useEffect, useState } from 'react'

const KEY = 'bepcar:compare'
export const MAX_COMPARE = 3
const read = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] } }

export function useCompare() {
  const [ids, setIds] = useState<string[]>(read)
  useEffect(() => {
    const sync = () => setIds(read())
    window.addEventListener('bepcar:cmp', sync); window.addEventListener('storage', sync)
    return () => { window.removeEventListener('bepcar:cmp', sync); window.removeEventListener('storage', sync) }
  }, [])
  const write = (next: string[]) => { try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* depolama kapalı */ } window.dispatchEvent(new Event('bepcar:cmp')) }
  const toggle = useCallback((id: string) => { const c = read(); if (c.includes(id)) write(c.filter((x) => x !== id)); else if (c.length < MAX_COMPARE) write([...c, id]) }, [])
  const clear = useCallback(() => write([]), [])
  return { ids, has: (id: string) => ids.includes(id), full: ids.length >= MAX_COMPARE, toggle, clear }
}
