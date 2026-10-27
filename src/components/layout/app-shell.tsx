"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOutIcon, MenuIcon, UserIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SessionProvider, type ClientSessionUser } from "@/hooks/use-session"
import { usePermissions } from "@/hooks/use-permissions"
import { NAV } from "@/lib/nav"
import { SwaggerGapLegend } from "@/components/swagger-label"

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { can } = usePermissions()
  return (
    <nav className="flex flex-col gap-4 p-3 text-sm">
      {NAV.map((group) => {
        const items = group.items.filter((i) => can(i.permission, "search"))
        if (!items.length) return null
        return (
          <div key={group.title} className="grid gap-0.5">
            <div className="px-2 pb-1 text-xs font-medium text-muted-foreground">{group.title}</div>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted",
                  isActive(pathname, item.href) && "bg-muted font-medium text-foreground",
                )}
              >
                <item.icon className="size-4 text-muted-foreground" />
                {item.title}
              </Link>
            ))}
          </div>
        )
      })}
    </nav>
  )
}

export function AppShell({ user, children }: { user: ClientSessionUser; children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined)
    router.replace("/login")
    router.refresh()
  }

  return (
    <SessionProvider user={user}>
      <div className="flex min-h-svh">
        <aside className="sticky top-0 hidden h-svh w-56 shrink-0 overflow-y-auto border-r bg-sidebar md:block">
          <div className="border-b px-4 py-3">
            <div className="font-semibold">ERP 後台</div>
            <SwaggerGapLegend className="mt-1.5" />
          </div>
          <Sidebar />
        </aside>

        {open && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64 overflow-y-auto bg-background shadow-lg">
              <div className="border-b px-4 py-3">
                <div className="flex items-center justify-between font-semibold">
                  ERP 後台
                  <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
                    <XIcon />
                  </Button>
                </div>
                <SwaggerGapLegend className="mt-1.5" />
              </div>
              <Sidebar onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
            <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setOpen(true)}>
              <MenuIcon />
            </Button>
            <div className="flex-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <UserIcon />
                  {user.employename || user.employeid}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="text-sm">{user.employename}</div>
                  <div className="text-xs text-muted-foreground">
                    {user.companyaccount} / {user.employeid}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOutIcon />
                  登出
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  )
}
