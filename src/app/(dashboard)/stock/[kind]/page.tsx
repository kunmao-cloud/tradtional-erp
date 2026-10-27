"use client"

import { notFound, useParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { STOCK_TITLES, StockForm, type StockKind } from "@/features/stock/stock-form"

export default function StockPage() {
  const { kind } = useParams<{ kind: string }>()
  if (!(kind in STOCK_TITLES)) notFound()
  const k = kind as StockKind
  return (
    <>
      <PageHeader title={`新增${STOCK_TITLES[k]}單`} description="此作業 API 僅提供新增，送出後表單會清空以便繼續輸入" />
      <StockForm key={k} kind={k} />
    </>
  )
}
