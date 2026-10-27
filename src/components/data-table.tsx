"use client"

import { memo, useEffect, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SwaggerLabelView } from "@/components/swagger-label"

export type { ColumnDef }

const coreRowModel = getCoreRowModel()
const sortedRowModel = getSortedRowModel()
const filteredRowModel = getFilteredRowModel()
const paginationRowModel = getPaginationRowModel()

function DataTableInner<T>({
  columns,
  data,
  isLoading,
  error,
  onRowClick,
  pageSize = 20,
  filterPlaceholder = "在結果中篩選…",
  showFilter = true,
  emptyText = "沒有資料",
  footer,
}: {
  columns: ColumnDef<T, unknown>[]
  data: T[] | undefined
  isLoading?: boolean
  error?: Error | null
  onRowClick?: (row: T) => void
  pageSize?: number
  filterPlaceholder?: string
  showFilter?: boolean
  emptyText?: string
  footer?: React.ReactNode
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [filterInput, setFilterInput] = useState("")
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setGlobalFilter(filterInput), 200)
    return () => clearTimeout(t)
  }, [filterInput])

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: coreRowModel,
    getSortedRowModel: sortedRowModel,
    getFilteredRowModel: filteredRowModel,
    getPaginationRowModel: pageSize > 0 ? paginationRowModel : undefined,
    initialState: { pagination: { pageSize: pageSize > 0 ? pageSize : 10_000 } },
    autoResetPageIndex: false,
  })

  const total = table.getFilteredRowModel().rows.length
  const { pageIndex } = table.getState().pagination
  const pageCount = table.getPageCount()

  return (
    <div className="grid gap-2">
      {showFilter && (
        <div className="flex items-center justify-between gap-2">
          <Input
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            placeholder={filterPlaceholder}
            className="max-w-xs"
          />
          <span className="text-sm text-muted-foreground">共 {total} 筆</span>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/50">
                {hg.headers.map((h) => {
                  const sortable = h.column.getCanSort()
                  const sorted = h.column.getIsSorted()
                  const meta = h.column.columnDef.meta as { align?: "right" } | undefined
                  return (
                    <TableHead key={h.id} className={cn("whitespace-nowrap", meta?.align === "right" && "text-right")}>
                      {h.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 hover:text-foreground"
                          onClick={h.column.getToggleSortingHandler()}
                        >
                          <SwaggerLabelView>{flexRender(h.column.columnDef.header, h.getContext())}</SwaggerLabelView>
                          {sorted === "asc" ? (
                            <ArrowUpIcon className="size-3" />
                          ) : sorted === "desc" ? (
                            <ArrowDownIcon className="size-3" />
                          ) : (
                            <ArrowUpDownIcon className="size-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        <SwaggerLabelView>{flexRender(h.column.columnDef.header, h.getContext())}</SwaggerLabelView>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-destructive">
                  {error.message || "載入失敗"}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as { align?: "right" } | undefined
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn("whitespace-nowrap", meta?.align === "right" && "text-right tabular-nums")}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {footer}
        </Table>
      </div>
      {pageSize > 0 && pageCount > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <span className="text-muted-foreground">
            第 {pageIndex + 1} / {pageCount} 頁
          </span>
          <Button variant="outline" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRightIcon />
          </Button>
        </div>
      )}
    </div>
  )
}

/** 打字時父層重繪不會連帶重算表格（props 不變時略過）。 */
export const DataTable = memo(DataTableInner) as typeof DataTableInner
