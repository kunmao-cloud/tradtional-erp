"use client"

import { createContext, useContext } from "react"

export type ClientSessionUser = {
  employeid: string
  employename: string
  companyaccount: string
}

const SessionContext = createContext<ClientSessionUser | null>(null)

export function SessionProvider({ user, children }: { user: ClientSessionUser | null; children: React.ReactNode }) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
}

export function useSession() {
  return useContext(SessionContext)
}
