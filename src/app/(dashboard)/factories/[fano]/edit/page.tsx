"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { EntityForm } from "@/components/entity-form"
import { PageHeader } from "@/components/page-header"
import { api, unwrap, unwrapResult } from "@/lib/api/client"
import { enc, safeDecode } from "@/lib/url"
import { updateFactoryFields, type UpdateFactoryForm } from "@/features/factories/fields"

export default function EditFactoryPage() {
  const { fano: raw } = useParams<{ fano: string }>()
  const fano = safeDecode(raw)
  const router = useRouter()
  const qc = useQueryClient()
  const { data: f } = useQuery({
    queryKey: ["fact", "detail", fano],
    queryFn: () => unwrap(api.GET("/v1/Fact/{fano}", { params: { path: { fano } } })),
  })

  const defaults = useMemo<UpdateFactoryForm | undefined>(
    () =>
      f && {
        fano: f.fano ?? "",
        faname1: f.faname1 ?? "",
        faname2: f.faname2 ?? "",
        faemno1: f.faemno1 ?? "",
        faper1: f.faper1 ?? "",
        fatel1: f.fatel1 ?? "",
        faatel1: f.faatel1 ?? "",
        fafax1: f.fafax1 ?? "",
        faaddr1: f.faaddr1 ?? "",
        faemail: f.faemail ?? "",
        fauno: f.fauno ?? "",
        famemo1: f.famemo1 ?? "",
      },
    [f],
  )

  return (
    <>
      <PageHeader title={`編輯廠商 ${fano}`} backHref={`/factories/${enc(fano)}`} />
      {!defaults ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <EntityForm
          fields={updateFactoryFields}
          defaultValues={defaults}
          onCancel={() => router.back()}
          onSubmit={async ({ fano: _fano, faname1: _name, ...body }) => {
            const res = await unwrapResult(api.PUT("/v1/Fact/{fano}", { params: { path: { fano } }, body })).catch(
              (e) => {
                toast.error(e.message)
                return null
              },
            )
            if (!res) return
            toast.success(res.message || "廠商資料已更新")
            await qc.invalidateQueries({ queryKey: ["fact"] })
            router.push(`/factories/${enc(fano)}`)
          }}
        />
      )}
    </>
  )
}
