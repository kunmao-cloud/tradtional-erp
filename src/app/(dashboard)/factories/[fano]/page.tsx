"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { PencilIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DetailGrid } from "@/components/field"
import { PageHeader } from "@/components/page-header"
import { api, unwrap } from "@/lib/api/client"
import { labelsOf } from "@/lib/api-label"
import { fmtMoney } from "@/lib/format"
import { enc, safeDecode } from "@/lib/url"
import { usePermissions } from "@/hooks/use-permissions"
import { FACTORY_PERMISSION } from "@/features/factories/fields"

const L = labelsOf("FactDetailDto")

export default function FactoryDetailPage() {
  const { fano: raw } = useParams<{ fano: string }>()
  const fano = safeDecode(raw)
  const { can } = usePermissions()
  const { data: f, isLoading } = useQuery({
    queryKey: ["fact", "detail", fano],
    queryFn: () => unwrap(api.GET("/v1/Fact/{fano}", { params: { path: { fano } } })),
  })

  return (
    <>
      <PageHeader
        title={f ? `${f.fano} ${f.faname1 ?? ""}` : fano}
        description={f?.faname2 ?? undefined}
        backHref="/factories"
        actions={
          can(FACTORY_PERMISSION, "modify") && (
            <Button asChild variant="outline">
              <Link href={`/factories/${enc(fano)}/edit`}>
                <PencilIcon />
                編輯
              </Link>
            </Button>
          )
        }
      />
      <Card>
        <CardContent>
          {isLoading || !f ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <DetailGrid
              items={[
                { label: L("fano"), value: f.fano },
                { label: L("faname1"), value: f.faname1 },
                { label: L("faname2"), value: f.faname2 },
                { label: L("fauno"), value: f.fauno },
                { label: L("fax12no"), value: f.fax12no },
                { label: L("faper"), value: f.faper },
                { label: L("faper1"), value: f.faper1 },
                { label: L("faper2"), value: f.faper2 },
                { label: L("fatel1"), value: f.fatel1 },
                { label: L("fatel2"), value: f.fatel2 },
                { label: L("faatel1"), value: f.faatel1 },
                { label: L("faatel2"), value: f.faatel2 },
                { label: L("fafax1"), value: f.fafax1 },
                { label: L("faemail"), value: f.faemail },
                { label: L("faemno1"), value: f.faemno1 },
                { label: L("faemname"), value: f.faemname },
                { label: L("far1"), value: f.far1 },
                { label: L("faaddr1"), value: f.faaddr1, span: 2 },
                { label: L("far2"), value: f.far2 },
                { label: L("faaddr2"), value: f.faaddr2, span: 2 },
                { label: L("far3"), value: f.far3 },
                { label: L("faaddr3"), value: f.faaddr3, span: 2 },
                { label: L("faxa1no"), value: f.faxa1no },
                { label: L("facredit"), value: fmtMoney(f.facredit) },
                { label: L("fapayable"), value: fmtMoney(f.fapayable) },
                { label: L("fapayamt"), value: fmtMoney(f.fapayamt) },
                { label: L("famemo1"), value: f.famemo1, span: 3 },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </>
  )
}
