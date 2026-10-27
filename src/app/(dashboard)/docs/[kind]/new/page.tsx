"use client"

import { notFound, useParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { getDocConfig } from "@/features/docs/config"
import { DocForm } from "@/features/docs/doc-form"

export default function NewDocPage() {
  const { kind } = useParams<{ kind: string }>()
  const cfg = getDocConfig(kind)
  if (!cfg) notFound()
  return (
    <>
      <PageHeader title={`新增${cfg.title}`} backHref={`/docs/${cfg.kind}`} />
      <DocForm key={cfg.kind} cfg={cfg} />
    </>
  )
}
