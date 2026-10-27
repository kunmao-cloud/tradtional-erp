"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api/client"

type FormValues = {
  companyaccount: string
  companypassword: string
  webid: string
  webpassword: string
}

const STORAGE_KEY = "erp_login_company"

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [companyName, setCompanyName] = useState<string>()
  const [checking, setChecking] = useState(false)

  const { register, handleSubmit, getValues, setValue, formState } = useForm<FormValues>({
    defaultValues: { companyaccount: "", companypassword: "", webid: "", webpassword: "" },
  })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setValue("companyaccount", saved)
  }, [setValue])

  async function checkTenant() {
    const { companyaccount, companypassword } = getValues()
    if (!companyaccount) return toast.warning("請先輸入公司帳號")
    setChecking(true)
    try {
      const { data, response } = await api.POST("/v1/Login/check", { body: { companyaccount, companypassword } })
      if (response.ok && data?.success) {
        setCompanyName(data.data?.companyName ?? "")
        toast.success(`連線成功：${data.data?.companyName ?? companyaccount}`)
      } else {
        setCompanyName(undefined)
        toast.error(data?.message || "找不到此公司帳號")
      }
    } catch {
      toast.error("無法連線到 API 伺服器")
    } finally {
      setChecking(false)
    }
  }

  async function onSubmit(values: FormValues) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.success) {
      toast.error(json?.message || "登入失敗")
      return
    }
    localStorage.setItem(STORAGE_KEY, values.companyaccount)
    toast.success(`歡迎，${json.data.employename || values.webid}`)
    const next = params.get("next")
    router.replace(next && next.startsWith("/") ? next : "/")
    router.refresh()
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">ERP 後台登入</CardTitle>
        <CardDescription>{companyName ? `公司：${companyName}` : "請輸入公司與個人帳號"}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <Label htmlFor="companyaccount">公司帳號</Label>
            <Input id="companyaccount" autoComplete="organization" {...register("companyaccount", { required: true })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="companypassword">公司密碼</Label>
            <Input id="companypassword" type="password" {...register("companypassword")} />
          </div>
          <Button type="button" variant="outline" onClick={checkTenant} disabled={checking}>
            {checking && <Loader2Icon className="animate-spin" />}
            測試公司連線
          </Button>
          <Separator />
          <div className="grid gap-2">
            <Label htmlFor="webid">登入帳號</Label>
            <Input id="webid" autoComplete="username" {...register("webid", { required: true })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="webpassword">登入密碼</Label>
            <Input id="webpassword" type="password" autoComplete="current-password" {...register("webpassword")} />
          </div>
          <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting && <Loader2Icon className="animate-spin" />}
            登入
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
