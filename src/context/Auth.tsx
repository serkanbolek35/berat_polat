import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../lib/firebase'

interface AuthState { user: User | null; isAdmin: boolean; loading: boolean }
const Ctx = createContext<AuthState>({ user: null, isAdmin: false, loading: true })
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<AuthState>({ user: null, isAdmin: false, loading: true })
  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) return setS({ user: null, isAdmin: false, loading: false })
    const t = await user.getIdTokenResult(true)   // custom claim sunucuda atanır; arayüz kararı yalnızca kolaylıktır, asıl koruma güvenlik kurallarındadır
    setS({ user, isAdmin: t.claims.admin === true, loading: false })
  }), [])
  return <Ctx.Provider value={s}>{children}</Ctx.Provider>
}
