import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Input, Text } from "@medusajs/ui"
import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"

const CategoryOfferBadgeWidget = () => {
  const { id } = useParams() as { id?: string }

  const [badgeText, setBadgeText] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const isInitialized = useRef(false)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        const res = await fetch(`/admin/product-categories/${id}`)
        if (!res.ok) return

        const { product_category } = await res.json()
        const metadata = product_category?.metadata ?? {}
        setBadgeText(typeof metadata.offer_badge_text === "string" ? metadata.offer_badge_text : "")
      } catch (e) {
        console.error("Failed to load offer badge metadata", e)
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

    const timer = setTimeout(async () => {
      setSaving(true)
      setSaved(false)
      setSaveError(false)

      try {
        const categoryRes = await fetch(`/admin/product-categories/${id}`)
        if (!categoryRes.ok) {
          throw new Error(await categoryRes.text())
        }

        const { product_category } = await categoryRes.json()
        const existingMetadata = product_category?.metadata ?? {}

        const saveRes = await fetch(`/admin/product-categories/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metadata: {
              ...existingMetadata,
              offer_badge_text: badgeText,
            },
          }),
        })

        if (!saveRes.ok) {
          throw new Error(await saveRes.text())
        }

        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
      } catch (e) {
        setSaveError(true)
        console.error("Failed to auto-save offer badge metadata", e)
      } finally {
        setSaving(false)
      }
    }, 600)

    return () => {
      clearTimeout(timer)
    }
  }, [badgeText, id, loading])

  if (loading) return null

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Offer Badge</Heading>
        <Text className={`text-sm ${saveError ? "text-rose-500" : "text-ui-fg-subtle"}`}>
          {saving ? "Saving..." : saveError ? "Save failed" : saved ? "Saved" : ""}
        </Text>
      </div>

      <div className="flex flex-col gap-4 px-6 py-4">
        <div className="flex flex-col gap-2">
          <Text>Badge text</Text>
          <Input
            placeholder="e.g. 20% OFF"
            value={badgeText}
            onChange={(e) => setBadgeText(e.target.value)}
          />
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.side.after",
})

export default CategoryOfferBadgeWidget
