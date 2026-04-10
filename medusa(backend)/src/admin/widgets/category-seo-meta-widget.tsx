import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Text, Textarea } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

const CategorySeoMetaWidget = () => {
  const { id } = useParams() as { id?: string }
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        const res = await fetch(`/admin/product-categories/${id}`)
        if (!res.ok) return

        const { product_category } = await res.json()
        const metadata = product_category?.metadata ?? {}

        setMetaTitle(
          typeof metadata.seo_meta_title === "string" ? metadata.seo_meta_title : ""
        )
        setMetaDescription(
          typeof metadata.seo_meta_description === "string"
            ? metadata.seo_meta_description
            : ""
        )
      } catch (e) {
        console.error("Failed to load category SEO metadata", e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  const onSave = async () => {
    if (!id) return

    setSaving(true)
    setSaved(false)

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
            seo_meta_title: metaTitle.trim(),
            seo_meta_description: metaDescription.trim(),
          },
        }),
      })

      if (!saveRes.ok) {
        throw new Error(await saveRes.text())
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      console.error("Failed to save category SEO metadata", e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">SEO Meta</Heading>
      </div>

      <div className="flex flex-col gap-3 px-6 py-4">
        <Text className="text-ui-fg-subtle text-sm">
          This SEO metadata is shown on the product listing page for this specific category.
        </Text>

        <div className="flex flex-col gap-2">
          <Text>Meta Title</Text>
          <Input
            placeholder="Enter SEO meta title"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Text>Meta Description</Text>
          <Textarea
            rows={4}
            placeholder="Enter SEO meta description"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onSave} disabled={saving} isLoading={saving}>
            {saved ? "Saved" : "Save"}
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.after",
})

export default CategorySeoMetaWidget

