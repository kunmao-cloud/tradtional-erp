"use client"

import { SearchIcon, RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

/** 列表頁上方的查詢區塊，子元素以 grid 排列。 */
export function SearchForm({
  onSubmit,
  onReset,
  children,
  submitLabel = "查詢",
}: {
  onSubmit: () => void
  onReset?: () => void
  children: React.ReactNode
  submitLabel?: string
}) {
  return (
    <Card className="mb-4 py-4">
      <CardContent>
        <form
          className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          onKeyDown={(e) => {
            // 中文輸入法組字時按 Enter 不應送出表單，否則會連續打 API 把頁面卡住
            if (e.key === "Enter" && (e.nativeEvent.isComposing || e.keyCode === 229)) {
              e.preventDefault()
            }
          }}
        >
          {children}
          <div className="flex gap-2">
            <Button type="submit">
              <SearchIcon />
              {submitLabel}
            </Button>
            {onReset && (
              <Button type="button" variant="outline" onClick={onReset}>
                <RotateCcwIcon />
                重設
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
