"use client"

import { useState } from "react"
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ApiError } from "@/lib/api/client"

function notify(error: unknown) {
  if (error instanceof ApiError && error.status === 401) return
  toast.error(error instanceof Error ? error.message : "發生未知錯誤")
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: notify }),
        mutationCache: new MutationCache({ onError: notify }),
        defaultOptions: {
          queries: {
            retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  )
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>
        {children}
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
