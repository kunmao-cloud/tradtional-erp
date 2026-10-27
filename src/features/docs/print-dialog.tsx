"use client"

import { useState } from "react"
import { PrinterIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field } from "@/components/field"
import { loadPrintOptions, printDocument, type PrintOptions } from "./print"

export function PrintDialog({
  source,
  docno,
  cuno,
  title,
  disabled,
}: {
  source: string
  docno: string
  cuno?: string | null
  title: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [opts, setOpts] = useState<PrintOptions>(() => loadPrintOptions(source, title))
  const valid = opts.header.trim() && opts.footer.trim()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <PrinterIcon />
          列印
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>列印 {docno}</DialogTitle>
          <DialogDescription>表頭與表尾會印在單據上，系統會記住這次的設定。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="報表表頭" required>
            <Input value={opts.header} onChange={(e) => setOpts((o) => ({ ...o, header: e.target.value }))} />
          </Field>
          <Field label="報表註腳" required>
            <Input value={opts.footer} onChange={(e) => setOpts((o) => ({ ...o, footer: e.target.value }))} />
          </Field>
          <Label className="flex items-center gap-2 font-normal">
            <Checkbox checked={opts.bomprint} onCheckedChange={(v) => setOpts((o) => ({ ...o, bomprint: v === true }))} />
            列印子件
          </Label>
        </div>
        <DialogFooter>
          <Button
            disabled={!valid}
            onClick={() => {
              setOpen(false)
              printDocument({ source, docno, cuno }, opts)
            }}
          >
            <PrinterIcon />
            產生 PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
