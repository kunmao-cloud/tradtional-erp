"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fmtNumber } from "@/lib/format"

export type PickItem = {
  key: string
  itno: string
  itname: string
  itunit: string
  remaining: number
  picked?: number
}

export type PickGroup = {
  key: string
  docno: string
  party: string
  items: PickItem[]
}

/** 轉單用：依單據分組列出待處理產品，可勾選單據並輸入本次數量。 */
export function PickList({
  groups,
  selected,
  onToggle,
  quantities,
  onQuantity,
  remainingLabel,
  showPicked,
}: {
  groups: PickGroup[]
  selected: Record<string, boolean>
  onToggle: (key: string, checked: boolean) => void
  quantities: Record<string, string>
  onQuantity: (itemKey: string, value: string) => void
  remainingLabel: string
  showPicked?: boolean
}) {
  if (!groups.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">沒有符合條件的單據</p>
  }
  return (
    <div className="grid gap-3">
      {groups.map((g) => (
        <Card key={g.key} className={selected[g.key] ? "ring-2 ring-primary/40" : undefined}>
          <CardHeader className="flex flex-row items-center gap-3">
            <Checkbox
              checked={!!selected[g.key]}
              onCheckedChange={(v) => onToggle(g.key, v === true)}
              aria-label={`選取 ${g.docno}`}
            />
            <CardTitle className="text-base">
              {g.docno} <span className="font-normal text-muted-foreground">{g.party}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>產品編號</TableHead>
                    <TableHead>品名</TableHead>
                    <TableHead>單位</TableHead>
                    <TableHead className="text-right">{remainingLabel}</TableHead>
                    {showPicked && <TableHead className="text-right">已撿貨</TableHead>}
                    <TableHead className="w-32 text-right">本次數量</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {g.items.map((it) => (
                    <TableRow key={it.key}>
                      <TableCell className="font-mono text-xs">{it.itno}</TableCell>
                      <TableCell>{it.itname}</TableCell>
                      <TableCell>{it.itunit}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNumber(it.remaining)}</TableCell>
                      {showPicked && <TableCell className="text-right tabular-nums">{fmtNumber(it.picked)}</TableCell>}
                      <TableCell>
                        <Input
                          type="number"
                          step="any"
                          min={0}
                          className="text-right"
                          disabled={!selected[g.key]}
                          value={quantities[it.key] ?? ""}
                          onChange={(e) => onQuantity(it.key, e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
