import type { Schemas } from "@/lib/api/client"
import type { EntityFieldDef } from "@/components/entity-form"
import { labelsOf } from "@/lib/api-label"

export const FACTORY_PERMISSION = ["廠商建檔作業"]

const addL = labelsOf("AddFactRequest")
const editL = labelsOf("UpdateFactRequest")
/** UpdateFactRequest 不含編號／簡稱；唯讀顯示用明細 schema。 */
const detailL = labelsOf("FactDetailDto")

export const addFactoryFields: EntityFieldDef<Schemas["AddFactRequest"]>[] = [
  { name: "fano", label: addL("fano"), required: true },
  { name: "faname1", label: addL("faname1"), required: true },
  { name: "faname2", label: addL("faname2") },
  { name: "fauno", label: addL("fauno"), maxLength: 8 },
  { name: "faemno1", label: addL("faemno1") },
  { name: "faper1", label: addL("faper1") },
  { name: "fatel1", label: addL("fatel1"), type: "tel" },
  { name: "faatel1", label: addL("faatel1"), type: "tel" },
  { name: "fafax1", label: addL("fafax1"), type: "tel" },
  { name: "faemail", label: addL("faemail"), type: "email", span: 2 },
  { name: "faaddr1", label: addL("faaddr1"), span: 3 },
  { name: "famemo1", label: addL("famemo1"), span: 3 },
]

export type UpdateFactoryForm = Schemas["UpdateFactRequest"] & { fano?: string; faname1?: string }

export const updateFactoryFields: EntityFieldDef<UpdateFactoryForm>[] = [
  { name: "fano", label: detailL("fano"), readOnly: true },
  { name: "faname1", label: detailL("faname1"), readOnly: true },
  { name: "faname2", label: editL("faname2") },
  { name: "fauno", label: editL("fauno"), maxLength: 8 },
  { name: "faemno1", label: editL("faemno1") },
  { name: "faper1", label: editL("faper1") },
  { name: "fatel1", label: editL("fatel1"), type: "tel" },
  { name: "faatel1", label: editL("faatel1"), type: "tel" },
  { name: "fafax1", label: editL("fafax1"), type: "tel" },
  { name: "faemail", label: editL("faemail"), type: "email", span: 2 },
  { name: "faaddr1", label: editL("faaddr1"), span: 3 },
  { name: "famemo1", label: editL("famemo1"), span: 3 },
]
