type SortableCategory = {
  id?: string | null
  name?: string | null
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

const getNameSequence = (name: unknown): number | null => {
  if (typeof name !== "string") {
    return null
  }

  const match = name.trim().match(/^(\d+)/)
  return match ? Number.parseInt(match[1], 10) : null
}

const getCategorySequence = (category: SortableCategory): number | null => {
  const metadata = category.metadata || {}

  for (const key of ORDER_METADATA_KEYS) {
    const candidate = toNumber(metadata[key])
    if (candidate !== null) {
      return candidate
    }
  }

  return getNameSequence(category.name)
}

export const compareCategories = (
  left: SortableCategory,
  right: SortableCategory
): number => {
  const leftOrder = getCategorySequence(left)
  const rightOrder = getCategorySequence(right)

  if (leftOrder !== null && rightOrder !== null && leftOrder !== rightOrder) {
    return leftOrder - rightOrder
  }

  if (leftOrder !== null && rightOrder === null) {
    return -1
  }

  if (leftOrder === null && rightOrder !== null) {
    return 1
  }

  const byName = (left.name || "").localeCompare(right.name || "", undefined, {
    numeric: true,
    sensitivity: "base",
  })
  if (byName !== 0) {
    return byName
  }

  return (left.id || "").localeCompare(right.id || "")
}

export const sortCategories = <T extends SortableCategory>(categories: T[]): T[] => {
  return [...categories].sort(compareCategories)
}
