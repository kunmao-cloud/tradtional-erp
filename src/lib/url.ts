export function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v)
  } catch {
    return v
  }
}

export const enc = (v: string | null | undefined) => encodeURIComponent(v ?? "")
