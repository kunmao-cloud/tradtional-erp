"use client"

import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { EntityForm } from "@/components/entity-form"
import { PageHeader } from "@/components/page-header"
import { api, unwrapResult } from "@/lib/api/client"
import { enc } from "@/lib/url"
import { addFactoryFields } from "@/features/factories/fields"

export default function NewFactoryPage() {
  const router = useRouter()
  const qc = useQueryClient()
  return (
    <>
      <PageHeader title="新增廠商" backHref="/factories" />
      <EntityForm
        fields={addFactoryFields}
        submitLabel="新增"
        onCancel={() => router.back()}
        onSubmit={async (values) => {
          const res = await unwrapResult(api.POST("/v1/Fact", { body: values })).catch((e) => {
            toast.error(e.message)
            return null
          })
          if (!res) return
          toast.success(res.message || "廠商已新增")
          await qc.invalidateQueries({ queryKey: ["fact"] })
          router.push(`/factories/${enc(values.fano)}`)
        }}
      />
    </>
  )
}
