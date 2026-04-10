import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Checkbox, Container, Heading, Text } from "@medusajs/ui"
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
    return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase())
  }

  return false
}

const CategoryInternationalVisibilityWidget = () => {
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
        const res = await fetch(`/admin/product-categories/${id}`)
        if (!res.ok) return

        const { product_category } = await res.json()
        const metadata = product_category?.metadata ?? {}
        setChecked(toBoolean(metadata.show_in_international_products))
      } catch (e) {
        console.error("Failed to load international category visibility", e)
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
      const getRes = await fetch(`/admin/product-categories/${id}`)
      if (!getRes.ok) {
        throw new Error(await getRes.text())
      }

      const { product_category } = await getRes.json()
      const metadata = product_category?.metadata ?? {}

      const saveRes = await fetch(`/admin/product-categories/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            ...metadata,
            show_in_international_products: nextChecked,
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
      console.error("Failed to save international category visibility", e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">International Visibility</Heading>
        <Text className={`text-sm ${saveError ? "text-rose-500" : "text-ui-fg-subtle"}`}>
          {saving ? "Saving..." : saveError ? "Save failed" : saved ? "Saved" : ""}
        </Text>
      </div>
      <div className="flex items-center gap-2 px-6 py-4">
        <Checkbox
          checked={checked}
          disabled={saving}
          onCheckedChange={(value) => onToggle(value === true)}
        />
        <Text className="text-sm font-medium">Show in international products</Text>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.side.after",
})

export default CategoryInternationalVisibilityWidget
