"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { EntityForm } from "@/components/entity-form"
import { PageHeader } from "@/components/page-header"
import { safeDecode } from "@/lib/url"
import { api, unwrap, unwrapResult } from "@/lib/api/client"
import { updateCustomerFields, type UpdateCustomerForm } from "@/features/customers/fields"

export default function EditCustomerPage() {
  const { cuno: raw } = useParams<{ cuno: string }>()
  const cuno = safeDecode(raw)
  const router = useRouter()
  const qc = useQueryClient()
  const { data: c } = useQuery({
    queryKey: ["cust", "detail", cuno],
    queryFn: () => unwrap(api.GET("/v1/Cust/{cuno}", { params: { path: { cuno } } })),
  })

  const defaults = useMemo<UpdateCustomerForm | undefined>(
    () =>
      c && {
        cuno: c.cuno ?? "",
        cuname1: c.cuname1 ?? "",
        cuname2: c.cuname2 ?? "",
        cuime: c.cuime ?? "",
        cuemno1: c.cuemno1 ?? "",
        cuper1: c.cuper1 ?? "",
        cutel1: c.cutel1 ?? "",
        cuatel1: c.cuatel1 ?? "",
        cufax1: c.cufax1 ?? "",
        cuaddr1: c.cuaddr1 ?? "",
        cuemail: c.cuemail ?? "",
        cuuno: c.cuuno ?? "",
        cumemo1: c.cumemo1 ?? "",
        detailmemo: c.detailmemo ?? "",
      },
    [c],
  )

  return (
    <>
      <PageHeader title={`編輯客戶 ${cuno}`} backHref={`/customers/${encodeURIComponent(cuno)}`} />
      {!defaults ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <EntityForm
          fields={updateCustomerFields}
          defaultValues={defaults}
          onCancel={() => router.back()}
          onSubmit={async ({ cuno: _cuno, cuname1: _name, ...body }) => {
            const res = await unwrapResult(api.PUT("/v1/Cust/{cuno}", { params: { path: { cuno } }, body })).catch(
              (e) => {
                toast.error(e.message)
                return null
              },
            )
            if (!res) return
            toast.success(res.message || "客戶資料已更新")
            await qc.invalidateQueries({ queryKey: ["cust"] })
            router.push(`/customers/${encodeURIComponent(cuno)}`)
          }}
        />
      )}
    </>
  )
}
