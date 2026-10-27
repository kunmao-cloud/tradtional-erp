import type { LucideIcon } from "lucide-react"
import {
  ArrowRightLeftIcon,
  BarChart3Icon,
  BoxesIcon,
  ClipboardListIcon,
  FactoryIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  PackageIcon,
  PlugIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  UsersIcon,
  WalletIcon,
  WarehouseIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  /** 比對 GetPermissionList 的 taname，任一關鍵字命中即套用該權限。 */
  permission?: string[]
}

export type NavGroup = { title: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  {
    title: "總覽",
    items: [{ title: "儀表板", href: "/", icon: LayoutDashboardIcon }],
  },
  {
    title: "基本資料",
    items: [
      { title: "客戶", href: "/customers", icon: UsersIcon, permission: ["客戶建檔作業"] },
      { title: "廠商", href: "/factories", icon: FactoryIcon, permission: ["廠商建檔作業"] },
      { title: "產品", href: "/items", icon: PackageIcon, permission: ["產品建檔作業"] },
      { title: "倉庫", href: "/stkrooms", icon: WarehouseIcon, permission: ["倉庫建檔作業"] },
    ],
  },
  {
    title: "銷售",
    items: [
      { title: "報價單", href: "/docs/quote", icon: FileTextIcon, permission: ["客戶報價管理作業"] },
      { title: "訂單", href: "/docs/order", icon: ClipboardListIcon, permission: ["客戶訂單管理作業"] },
      { title: "銷貨單", href: "/docs/sale", icon: ReceiptIcon, permission: ["銷貨作業系統"] },
      { title: "銷退單", href: "/docs/rsale", icon: ReceiptIcon, permission: ["銷貨退回作業"] },
      { title: "訂單轉銷貨", href: "/convert/order-to-sale", icon: ArrowRightLeftIcon, permission: ["合車撿貨", "銷貨作業系統"] },
    ],
  },
  {
    title: "採購",
    items: [
      { title: "詢價單", href: "/docs/fquot", icon: FileTextIcon, permission: ["廠商詢價管理作業"] },
      { title: "採購單", href: "/docs/ford", icon: ClipboardListIcon, permission: ["廠商採購管理作業"] },
      { title: "進貨單", href: "/docs/shop", icon: ReceiptIcon, permission: ["進貨作業系統"] },
      { title: "進退單", href: "/docs/rshop", icon: ReceiptIcon, permission: ["進貨退出作業"] },
      { title: "採購轉進貨", href: "/convert/ford-to-shop", icon: ArrowRightLeftIcon, permission: ["進貨作業系統"] },
    ],
  },
  {
    title: "庫存",
    items: [
      { title: "盤點", href: "/stock/inventory", icon: BoxesIcon, permission: ["庫存盤點系統"] },
      { title: "領料", href: "/stock/draw", icon: BoxesIcon, permission: ["領料作業系統"] },
      { title: "入庫", href: "/stock/garner", icon: BoxesIcon, permission: ["入庫作業系統"] },
    ],
  },
  {
    title: "帳款",
    items: [
      { title: "客戶別應收", href: "/payments/customers", icon: WalletIcon, permission: ["客戶別-應收帳款"] },
      { title: "業務別應收", href: "/payments/employees", icon: WalletIcon, permission: ["業務別-應收帳款"] },
      { title: "日期別已收", href: "/payments/dates", icon: WalletIcon, permission: ["日期別-已收帳款"] },
      { title: "廠商別應付", href: "/payments/factories", icon: WalletIcon, permission: ["廠商別-應付帳款"] },
    ],
  },
  {
    title: "報表與系統",
    items: [
      { title: "銷售報表", href: "/reports/sales", icon: BarChart3Icon, permission: ["客戶銷售報表", "業務銷售報表", "產品銷售報表"] },
      { title: "外掛", href: "/plugins", icon: PlugIcon },
      { title: "我的權限", href: "/permissions", icon: ShieldCheckIcon },
    ],
  },
]
