"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TableCell, TableFooter, TableRow } from "@/components/ui/table"
import { DataTable, type ColumnDef } from "@/components/data-table"
import { DetailGrid } from "@/components/field"
import type { Schemas } from "@/lib/api/client"
import { labelsOf } from "@/lib/api-label"
import { fmtMoney } from "@/lib/format"

const rowL = labelsOf("DocumentDetail")
const sumL = labelsOf("GetCustOrFactPaymentReceivableDto")

type Doc = Schemas["DocumentDetail"]

const money = (key: keyof Doc): ColumnDef<Doc> => ({
  accessorKey: key,
  header: rowL(String(key)),
  meta: { align: "right" },
  cell: ({ getValue }) => fmtMoney(getValue()),
})

/** 客戶別應收、廠商別應付共用的呈現方式。 */
export function ReceivableView({
  data,
  partyLabel,
}: {
  data: Schemas["GetCustOrFactPaymentReceivableDto"]
  partyLabel: string
}) {
  const docs = data.documentDetails ?? []
  const columns: ColumnDef<Doc>[] = [
    { accessorKey: "dateTW", header: rowL("dateTW") },
    { accessorKey: "type", header: rowL("type") },
    { accessorKey: "documentnumber", header: rowL("documentnumber") },
    money("taxmny"),
    money("tax"),
    money("totmny"),
    money("discount"),
    money("receivedandadvance"),
    money("acctmny"),
  ]
  const sum = (k: keyof Doc) => docs.reduce((s, d) => s + (Number(d[k]) || 0), 0)

  return (
    <div className="grid gap-4">
      <Card>
        <CardContent>
          <DetailGrid
            items={[
              { label: partyLabel, value: [data.cfno, data.cfname1].filter(Boolean).join(" ") },
              { label: sumL("spname"), value: data.spname },
              {
                label: sumL("totalMoney"),
                value: <span className="text-lg font-semibold">{fmtMoney(data.totalMoney)}</span>,
              },
            ]}
          />
        </CardContent>
      </Card>
      <DataTable
        columns={columns}
        data={docs}
        footer={
          docs.length ? (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="text-right">
                  合計
                </TableCell>
                {(["taxmny", "tax", "totmny", "discount", "receivedandadvance", "acctmny"] as const).map((k) => (
                  <TableCell key={k} className="text-right tabular-nums">
                    {fmtMoney(sum(k))}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          ) : null
        }
      />
    </div>
  )
}
