import type { Schemas } from "@/lib/api/client"
import type { EntityFieldDef } from "@/components/entity-form"
import { labelsOf } from "@/lib/api-label"

export const CUSTOMER_PERMISSION = ["客戶建檔作業"]

const addL = labelsOf("AddCustRequest")
const editL = labelsOf("UpdateCustRequest")
/** UpdateCustRequest 不含編號／簡稱；唯讀顯示用明細 schema。 */
const detailL = labelsOf("CustDetailDto")

export const addCustomerFields: EntityFieldDef<Schemas["AddCustRequest"]>[] = [
  { name: "cuno", label: addL("cuno"), required: true },
  { name: "cuname1", label: addL("cuname1"), required: true },
  { name: "cuname2", label: addL("cuname2") },
  { name: "cuime", label: addL("cuime") },
  { name: "cuuno", label: addL("cuuno"), maxLength: 8 },
  { name: "cuemno1", label: addL("cuemno1") },
  { name: "cuper1", label: addL("cuper1") },
  { name: "cutel1", label: addL("cutel1") },
  { name: "cuatel1", label: addL("cuatel1"), type: "tel" },
  { name: "cufax1", label: addL("cufax1"), type: "tel" },
  { name: "cuemail", label: addL("cuemail"), type: "email", span: 2 },
  { name: "cuaddr1", label: addL("cuaddr1"), span: 3 },
  { name: "cumemo1", label: addL("cumemo1"), span: 3 },
  { name: "detailmemo", label: addL("detailmemo"), type: "textarea", span: 3 },
]

export type UpdateCustomerForm = Schemas["UpdateCustRequest"] & { cuno?: string; cuname1?: string }

export const updateCustomerFields: EntityFieldDef<UpdateCustomerForm>[] = [
  { name: "cuno", label: detailL("cuno"), readOnly: true },
  { name: "cuname1", label: detailL("cuname1"), readOnly: true },
  { name: "cuname2", label: editL("cuname2") },
  { name: "cuime", label: editL("cuime") },
  { name: "cuuno", label: editL("cuuno"), maxLength: 8 },
  { name: "cuemno1", label: editL("cuemno1") },
  { name: "cuper1", label: editL("cuper1") },
  { name: "cutel1", label: editL("cutel1") },
  { name: "cuatel1", label: editL("cuatel1"), type: "tel" },
  { name: "cufax1", label: editL("cufax1"), type: "tel" },
  { name: "cuemail", label: editL("cuemail"), type: "email", span: 2 },
  { name: "cuaddr1", label: editL("cuaddr1"), span: 3 },
  { name: "cumemo1", label: editL("cumemo1"), span: 3 },
  { name: "detailmemo", label: editL("detailmemo"), type: "textarea", span: 3 },
]
