import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Checkbox, Container, Text } from "@medusajs/ui"
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

const ProductBestSellerWidget = () => {
  const { id } = useParams() as { id?: string }
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        const res = await fetch(`/admin/products/${id}`)
        if (!res.ok) return
        const { product } = await res.json()
        const metadata = product?.metadata ?? {}
        setChecked(toBoolean(metadata.best_seller))
      } catch (e) {
        console.error("Failed to load best seller metadata", e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  const onToggle = async (nextChecked: boolean) => {
    if (!id || loading) return

    setChecked(nextChecked)
    setSaving(true)
    setSaved(false)
    setSaveError(false)

    try {
      const getRes = await fetch(`/admin/products/${id}`)
      if (!getRes.ok) {
        throw new Error(await getRes.text())
      }

      const { product } = await getRes.json()
      const metadata = product?.metadata ?? {}

      const saveRes = await fetch(`/admin/products/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            ...metadata,
            best_seller: nextChecked,
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
      console.error("Failed to save best seller metadata", e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between gap-2 px-6 py-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={checked}
            disabled={saving}
            onCheckedChange={(value) => onToggle(value === true)}
          />
          <Text className="text-sm font-medium">Add this to best seller</Text>
        </div>
        <Text className={`text-sm ${saveError ? "text-rose-500" : "text-ui-fg-subtle"}`}>
          {saving ? "Saving..." : saveError ? "Save failed" : saved ? "Saved" : ""}
        </Text>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export default ProductBestSellerWidget
