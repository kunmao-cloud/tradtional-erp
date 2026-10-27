"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { useSession } from "@/hooks/use-session"
import { usePermissions } from "@/hooks/use-permissions"
import { NAV } from "@/lib/nav"

export default function DashboardPage() {
  const user = useSession()
  const { can } = usePermissions()
  const groups = NAV.slice(1)

  return (
    <>
      <PageHeader title={`您好，${user?.employename || user?.employeid || ""}`} description="選擇要進行的作業" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => {
          const items = g.items.filter((i) => can(i.permission, "search"))
          if (!items.length) return null
          return (
            <Card key={g.title}>
              <CardHeader>
                <CardTitle className="text-base">{g.title}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {items.map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <i.icon className="size-4 text-muted-foreground" />
                    {i.title}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
