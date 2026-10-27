"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronsUpDownIcon, Loader2Icon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api, unwrap, type Schemas } from "@/lib/api/client"
import { useDebounce } from "@/hooks/use-debounce"

type RemotePickerProps<T> = {
  value?: string
  displayText?: string
  placeholder: string
  queryKey: string
  search: (text: string) => Promise<T[]>
  getKey: (item: T) => string
  renderItem: (item: T) => React.ReactNode
  onSelect: (item: T | null) => void
  disabled?: boolean
  className?: string
  minChars?: number
}

/** 以關鍵字向後端搜尋並挑選一筆資料的下拉元件。 */
export function RemotePicker<T>({
  value,
  displayText,
  placeholder,
  queryKey,
  search,
  getKey,
  renderItem,
  onSelect,
  disabled,
  className,
  minChars = 0,
}: RemotePickerProps<T>) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const q = useDebounce(text.trim(), 300)
  const enabled = open && q.length >= minChars

  const { data, isFetching } = useQuery({
    queryKey: ["picker", queryKey, q],
    queryFn: () => search(q),
    enabled,
    staleTime: 60_000,
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("flex min-w-0 gap-1", className)}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="min-w-0 flex-1 justify-between font-normal"
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value ? displayText || value : placeholder}
            </span>
            <ChevronsUpDownIcon className="opacity-50" />
          </Button>
        </PopoverTrigger>
        {value && !disabled && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onSelect(null)}>
            <XIcon />
          </Button>
        )}
      </div>
      <PopoverContent className="w-[min(32rem,calc(100vw-2rem))] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput value={text} onValueChange={setText} placeholder="輸入編號或名稱搜尋…" />
          <CommandList>
            {isFetching && (
              <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" /> 搜尋中…
              </div>
            )}
            {!isFetching && !enabled && (
              <div className="p-3 text-sm text-muted-foreground">請至少輸入 {minChars} 個字</div>
            )}
            {!isFetching && enabled && <CommandEmpty>找不到資料</CommandEmpty>}
            <CommandGroup>
              {(data ?? []).slice(0, 100).map((item) => (
                <CommandItem
                  key={getKey(item)}
                  value={getKey(item)}
                  onSelect={() => {
                    onSelect(item)
                    setOpen(false)
                  }}
                >
                  {renderItem(item)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type CustomerPickerProps = Omit<
  RemotePickerProps<Schemas["CustListDto"]>,
  "queryKey" | "search" | "getKey" | "renderItem" | "placeholder"
> & { placeholder?: string }

export function CustomerPicker(props: CustomerPickerProps) {
  return (
    <RemotePicker
      placeholder="選擇客戶"
      {...props}
      queryKey="cust"
      search={(q) => unwrap(api.GET("/v1/Cust", { params: { query: q ? { SearchText: q } : {} } }))}
      getKey={(c) => c.cuno ?? ""}
      renderItem={(c) => (
        <div className="flex w-full justify-between gap-2">
          <span>
            <span className="font-mono text-xs text-muted-foreground">{c.cuno}</span> {c.cuname1}
          </span>
          <span className="truncate text-xs text-muted-foreground">{c.cutel1}</span>
        </div>
      )}
    />
  )
}

type FactoryPickerProps = Omit<
  RemotePickerProps<Schemas["FactListDto"]>,
  "queryKey" | "search" | "getKey" | "renderItem" | "placeholder"
> & { placeholder?: string }

export function FactoryPicker(props: FactoryPickerProps) {
  return (
    <RemotePicker
      placeholder="選擇廠商"
      {...props}
      queryKey="fact"
      search={(q) => unwrap(api.GET("/v1/Fact", { params: { query: q ? { SearchText: q } : {} } }))}
      getKey={(f) => f.fano ?? ""}
      renderItem={(f) => (
        <div className="flex w-full justify-between gap-2">
          <span>
            <span className="font-mono text-xs text-muted-foreground">{f.fano}</span> {f.faname1}
          </span>
          <span className="truncate text-xs text-muted-foreground">{f.fatel1}</span>
        </div>
      )}
    />
  )
}

type ItemPickerProps = Omit<
  RemotePickerProps<Schemas["ItemListDto"]>,
  "queryKey" | "search" | "getKey" | "renderItem" | "placeholder"
> & { placeholder?: string }

export function ItemPicker(props: ItemPickerProps) {
  return (
    <RemotePicker
      placeholder="選擇產品"
      minChars={1}
      {...props}
      queryKey="item"
      search={(q) => unwrap(api.GET("/v1/Item", { params: { query: { SearchText: q } } }))}
      getKey={(i) => i.itno ?? ""}
      renderItem={(i) => (
        <div className="flex w-full justify-between gap-2">
          <span className="truncate">
            <span className="font-mono text-xs text-muted-foreground">{i.itno}</span> {i.itname}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            存量 {i.itstockqty ?? 0} {i.itunit}
          </span>
        </div>
      )}
    />
  )
}

export function useStkrooms() {
  return useQuery({
    queryKey: ["stkroom"],
    queryFn: () => unwrap(api.GET("/v1/Stkroom")),
    staleTime: 10 * 60_000,
  })
}

const NONE = "__none__"

export function StkroomSelect({
  value,
  onChange,
  placeholder = "選擇倉庫",
  allowEmpty,
}: {
  value?: string
  onChange: (stno: string, stname: string) => void
  placeholder?: string
  allowEmpty?: boolean
}) {
  const { data } = useStkrooms()
  return (
    <Select
      value={value || (allowEmpty ? NONE : undefined)}
      onValueChange={(v) => {
        if (v === NONE) return onChange("", "")
        const room = data?.find((r) => r.stNo === v)
        onChange(v, room?.stName ?? "")
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty && <SelectItem value={NONE}>（不指定）</SelectItem>}
        {data?.map((r) => (
          <SelectItem key={r.stNo} value={r.stNo ?? ""}>
            {r.stNo} {r.stName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
