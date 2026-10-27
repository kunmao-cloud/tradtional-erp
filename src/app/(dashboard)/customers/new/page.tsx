"use client"

import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { EntityForm } from "@/components/entity-form"
import { PageHeader } from "@/components/page-header"
import { api, unwrapResult } from "@/lib/api/client"
import { addCustomerFields } from "@/features/customers/fields"

export default function NewCustomerPage() {
  const router = useRouter()
  const qc = useQueryClient()
  return (
    <>
      <PageHeader title="新增客戶" backHref="/customers" />
      <EntityForm
        fields={addCustomerFields}
        submitLabel="新增"
        onCancel={() => router.back()}
        onSubmit={async (values) => {
          const res = await unwrapResult(api.POST("/v1/Cust", { body: values })).catch((e) => {
            toast.error(e.message)
            return null
          })
          if (!res) return
          toast.success(res.message || "客戶已新增")
          await qc.invalidateQueries({ queryKey: ["cust"] })
          router.push(`/customers/${encodeURIComponent(values.cuno)}`)
        }}
      />
    </>
  )
}
