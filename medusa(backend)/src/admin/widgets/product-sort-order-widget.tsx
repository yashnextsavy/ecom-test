import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Input, Text } from "@medusajs/ui"
import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"

const parseSortOrder = (value: string): number | null => {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(parsed)) {
    return null
  }

  return parsed
}

const getSortOrderFromMetadata = (metadata: Record<string, unknown>): number | null => {
  const candidate = metadata.sort_order

  if (typeof candidate === "number" && Number.isFinite(candidate)) {
    return Math.trunc(candidate)
  }

  if (typeof candidate === "string") {
    const parsed = Number.parseInt(candidate.trim(), 10)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

const ProductSortOrderWidget = () => {
  const { id } = useParams() as { id?: string }

  const [sortOrderInput, setSortOrderInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [validationError, setValidationError] = useState("")
  const isInitialized = useRef(false)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        const res = await fetch(`/admin/products/${id}?fields=id,metadata`)
        if (!res.ok) return

        const { product } = await res.json()
        const metadata = (product?.metadata ?? {}) as Record<string, unknown>
        const initialSortOrder = getSortOrderFromMetadata(metadata)
        setSortOrderInput(initialSortOrder === null ? "" : String(initialSortOrder))
      } catch (e) {
        console.error("Failed to load product sort order", e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  useEffect(() => {
    if (!id || loading) return

    if (!isInitialized.current) {
      isInitialized.current = true
      return
    }

    const trimmed = sortOrderInput.trim()
    if (trimmed && !/^-?\d+$/.test(trimmed)) {
      setValidationError("Sort order must be a whole number.")
      setSaved(false)
      setSaveError(false)
      return
    }

    setValidationError("")

    const timer = setTimeout(async () => {
      const nextSortOrder = parseSortOrder(sortOrderInput)

      setSaving(true)
      setSaved(false)
      setSaveError(false)

      try {
        const productRes = await fetch(`/admin/products/${id}?fields=id,metadata`)
        if (!productRes.ok) {
          throw new Error(await productRes.text())
        }

        const { product } = await productRes.json()
        const existingMetadata = {
          ...(product?.metadata ?? {}),
        } as Record<string, unknown>

        if (nextSortOrder === null) {
          delete existingMetadata.sort_order
        } else {
          existingMetadata.sort_order = nextSortOrder
        }

        const saveRes = await fetch(`/admin/products/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metadata: existingMetadata,
          }),
        })

        if (!saveRes.ok) {
          throw new Error(await saveRes.text())
        }

        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
      } catch (e) {
        setSaveError(true)
        console.error("Failed to save product sort order", e)
      } finally {
        setSaving(false)
      }
    }, 600)

    return () => {
      clearTimeout(timer)
    }
  }, [id, loading, sortOrderInput])

  if (loading) return null

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Product Sort Order</Heading>
        <Text className={`text-sm ${saveError ? "text-rose-500" : "text-ui-fg-subtle"}`}>
          {saving
            ? "Saving..."
            : validationError
              ? ""
              : saveError
                ? "Save failed"
                : saved
                  ? "Saved"
                  : ""}
        </Text>
      </div>

      <div className="flex flex-col gap-2 px-6 py-4">
        <Text>Sort order</Text>
        <Input
          type="number"
          step={1}
          placeholder="e.g. 1"
          value={sortOrderInput}
          onChange={(e) => setSortOrderInput(e.target.value)}
        />
        {validationError ? (
          <Text className="text-sm text-rose-500">{validationError}</Text>
        ) : (
          <Text className="text-sm text-ui-fg-subtle">
            Lower number appears first. Leave empty to use title-based fallback.
          </Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export default ProductSortOrderWidget
