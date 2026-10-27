"use client"

import { useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { api, unwrap, type Schemas } from "@/lib/api/client"
import { isTruthyFlag } from "@/lib/format"

export type PermissionAction = "search" | "append" | "modify"

export function usePermissionList() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: () => unwrap(api.GET("/v1/User/GetPermissionList")),
    staleTime: 5 * 60_000,
  })
}

/**
 * 依功能名稱（taname，例如「客戶建檔作業」）判斷權限，任一名稱有權限即放行。
 * 權限清單尚未載入、載入失敗、或找不到對應功能時一律放行，最終仍以後端 API 的檢查為準。
 */
export function usePermissions() {
  const { data, isSuccess } = usePermissionList()

  const can = useCallback(
    (names: string[] | undefined, action: PermissionAction = "search") => {
      if (!names?.length || !isSuccess || !data?.length) return true
      const matched = data.filter((p: Schemas["PermissionDto"]) => names.includes(p.taname?.trim() ?? ""))
      if (!matched.length) return true
      return matched.some((p) => isTruthyFlag(p[action]))
    },
    [data, isSuccess],
  )

  return { can, list: data ?? [] }
}
