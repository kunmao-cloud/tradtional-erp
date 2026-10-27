"use client"

import { useEffect } from "react"
import { useForm, type DefaultValues, type FieldValues, type Path } from "react-hook-form"
import { Loader2Icon, SaveIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field } from "@/components/field"
import { plainLabel } from "@/lib/api-label"

export type EntityFieldDef<T> = {
  name: Path<T> & string
  label: string
  required?: boolean
  readOnly?: boolean
  type?: "text" | "email" | "tel" | "textarea" | "number"
  span?: 1 | 2 | 3
  maxLength?: number
}

export function EntityForm<T extends FieldValues>({
  fields,
  defaultValues,
  onSubmit,
  submitLabel = "儲存",
  onCancel,
}: {
  fields: EntityFieldDef<T>[]
  defaultValues?: DefaultValues<T>
  onSubmit: (values: T) => Promise<unknown>
  submitLabel?: string
  onCancel?: () => void
}) {
  const { register, handleSubmit, reset, formState } = useForm<T>({ defaultValues })

  useEffect(() => {
    if (defaultValues) reset(defaultValues)
  }, [defaultValues, reset])

  return (
    <form onSubmit={handleSubmit(async (v) => void (await onSubmit(v)))}>
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => {
            const err = formState.errors[f.name]?.message as string | undefined
            const rules = {
              required: f.required ? `${plainLabel(f.label)}為必填` : false,
              maxLength: f.maxLength ? { value: f.maxLength, message: `最多 ${f.maxLength} 字` } : undefined,
              ...(f.type === "number" ? { valueAsNumber: true as const } : {}),
            }
            return (
              <Field
                key={f.name}
                label={f.label}
                htmlFor={f.name}
                required={f.required}
                error={err}
                className={cn(f.span === 2 && "sm:col-span-2", f.span === 3 && "sm:col-span-2 lg:col-span-3")}
              >
                {f.type === "textarea" ? (
                  <Textarea id={f.name} rows={3} readOnly={f.readOnly} {...register(f.name, rules)} />
                ) : (
                  <Input
                    id={f.name}
                    type={f.type ?? "text"}
                    readOnly={f.readOnly}
                    className={cn(f.readOnly && "bg-muted")}
                    aria-invalid={!!err}
                    {...register(f.name, rules)}
                  />
                )}
              </Field>
            )
          })}
        </CardContent>
      </Card>
      <div className="mt-4 flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
