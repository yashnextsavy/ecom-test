import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Label, Switch, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "number") {
    return value !== 0
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    return ["true", "1", "yes", "y"].includes(normalized)
  }

  return false
}

const ProductOutOfStockWidget = () => {
  const params = useParams() as Record<string, string | undefined>
  const resolvedId =
    params.id ||
    params.product_id ||
    (() => {
      if (typeof window === "undefined") {
        return undefined
      }

      const match = window.location.pathname.match(/\/products\/([^/]+)/)
      return match?.[1]
    })()
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [idError, setIdError] = useState(false)

  useEffect(() => {
    if (!resolvedId) {
      setIdError(true)
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const res = await fetch(`/admin/products/${resolvedId}`)
        if (!res.ok) return
        const { product } = await res.json()
        const metadata = product?.metadata ?? {}
        setChecked(toBoolean(metadata.is_out_of_stock))
      } catch (e) {
        console.error("Failed to load out-of-stock metadata", e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [resolvedId])

  const onToggle = async (nextChecked: boolean) => {
    if (!resolvedId || loading) return

    setChecked(nextChecked)
    setSaving(true)
    setSaved(false)
    setSaveError(false)

    try {
      const getRes = await fetch(`/admin/products/${resolvedId}`)
      if (!getRes.ok) {
        throw new Error(await getRes.text())
      }

      const { product } = await getRes.json()
      const metadata = product?.metadata ?? {}

      const saveRes = await fetch(`/admin/products/${resolvedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            ...metadata,
            is_out_of_stock: nextChecked,
          },
        }),
      })

      if (!saveRes.ok) {
        throw new Error(await saveRes.text())
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 1200)
    } catch (e) {
      setSaveError(true)
      setChecked(!nextChecked)
      console.error("Failed to save out-of-stock metadata", e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between gap-2 px-6 py-4">
        <div className="flex items-center gap-2">
          <Switch
            id="product-out-of-stock"
            checked={checked}
            disabled={saving}
            className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
            onCheckedChange={(value) => onToggle(value === true)}
          />
          <Label htmlFor="product-out-of-stock" className="text-sm font-medium">
            Mark as out of stock
          </Label>
        </div>
        <Text className={`text-sm ${saveError ? "text-rose-500" : "text-ui-fg-subtle"}`}>
          {idError
            ? "Product id not found"
            : saving
              ? "Saving..."
              : saveError
                ? "Save failed"
                : saved
                  ? "Saved"
                  : ""}
        </Text>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export default ProductOutOfStockWidget
