type SortableProduct = {
  id?: string | null
  title?: string | null
  handle?: string | null
  metadata?: Record<string, unknown> | null
}

const ORDER_METADATA_KEYS = [
  "sort_order",
  "display_order",
  "sequence",
  "position",
  "order",
] as const

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.trim())
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const getTitleSequence = (title: unknown): number | null => {
  if (typeof title !== "string") {
    return null
  }

  const match = title.trim().match(/^(\d+)/)
  return match ? Number.parseInt(match[1], 10) : null
}

const getProductSequence = (product: SortableProduct): number | null => {
  const metadata = product.metadata || {}

  for (const key of ORDER_METADATA_KEYS) {
    const candidate = toNumber(metadata[key])
    if (candidate !== null) {
      return candidate
    }
  }

  return getTitleSequence(product.title)
}

export const compareProducts = (left: SortableProduct, right: SortableProduct): number => {
  const leftOrder = getProductSequence(left)
  const rightOrder = getProductSequence(right)

  if (leftOrder !== null && rightOrder !== null && leftOrder !== rightOrder) {
    return leftOrder - rightOrder
  }

  if (leftOrder !== null && rightOrder === null) {
    return -1
  }

  if (leftOrder === null && rightOrder !== null) {
    return 1
  }

  const byTitle = (left.title || "").localeCompare(right.title || "", undefined, {
    numeric: true,
    sensitivity: "base",
  })
  if (byTitle !== 0) {
    return byTitle
  }

  const byHandle = (left.handle || "").localeCompare(right.handle || "", undefined, {
    numeric: true,
    sensitivity: "base",
  })
  if (byHandle !== 0) {
    return byHandle
  }

  return (left.id || "").localeCompare(right.id || "")
}

export const sortProducts = <T extends SortableProduct>(products: T[]): T[] => {
  return [...products].sort(compareProducts)
}

