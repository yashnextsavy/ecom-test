import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Input, Text } from "@medusajs/ui"
import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"

type SeoState = {
  title: string
  description: string
}

const getMetadataText = (value: unknown): string => {
  return typeof value === "string" ? value : ""
}

const ProductSeoMetaWidget = () => {
  const { id } = useParams() as { id?: string }
  const [seo, setSeo] = useState<SeoState>({
    title: "",
    description: "",
  })
  const [loading, setLoading] = useState(true)
  const [isInternational, setIsInternational] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        const res = await fetch(`/admin/products/${id}?fields=id,metadata`)
        if (!res.ok) return

        const { product } = await res.json()
        const metadata = (product?.metadata || {}) as Record<string, unknown>
        setIsInternational(Boolean(metadata.is_international))

        setSeo({
          title: getMetadataText(metadata.seo_meta_title),
          description: getMetadataText(metadata.seo_meta_description),
        })
      } catch (error) {
        console.error("Failed to load SEO metadata", error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled: boolean }>).detail
      if (detail && typeof detail.enabled === "boolean") {
        setIsInternational(detail.enabled)
      }
    }

    window.addEventListener("international-product-toggle", handler)
    return () => window.removeEventListener("international-product-toggle", handler)
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const onSave = async () => {
    if (!id) return

    setSaving(true)
    setSaved(false)

    try {
      const getRes = await fetch(`/admin/products/${id}?fields=id,metadata`)
      if (!getRes.ok) {
        throw new Error(await getRes.text())
      }

      const { product } = await getRes.json()
      const metadata = (product?.metadata || {}) as Record<string, unknown>

      const saveRes = await fetch(`/admin/products/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            ...metadata,
            seo_meta_title: seo.title.trim(),
            seo_meta_description: seo.description.trim(),
          },
        }),
      })

      if (!saveRes.ok) {
        throw new Error(await saveRes.text())
      }

      setSaved(true)
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      saveTimerRef.current = setTimeout(() => setSaved(false), 1500)
    } catch (error) {
      console.error("Failed to save SEO metadata", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null
  if (isInternational) return null

  return (
    <Container className="p-0">
      <div className="flex flex-col gap-3 px-6 py-4">
        <div className="flex items-center justify-between gap-2">
          <label className="text-md font-medium">SEO Metadata</label>
          <Text className="text-ui-fg-subtle text-sm">
            {saving ? "Saving..." : saved ? "Saved" : ""}
          </Text>
        </div>

        <div className="flex flex-col gap-1">
          <Text className="text-xs font-medium">Meta Title</Text>
          <Input
            placeholder="Enter SEO meta title"
            value={seo.title}
            onChange={(e) =>
              setSeo((current) => ({
                ...current,
                title: e.target.value,
              }))
            }
          />
          <Text className="text-ui-fg-subtle text-xs">{seo.title.length}/60</Text>
        </div>

        <div className="flex flex-col gap-1">
          <Text className="text-xs font-medium">Meta Description</Text>
          <textarea
            className="bg-ui-bg-field shadow-borders-base txt-compact-small text-ui-fg-base placeholder:text-ui-fg-muted hover:bg-ui-bg-field-hover focus:shadow-borders-interactive-with-active disabled:!bg-ui-bg-disabled disabled:!text-ui-fg-disabled flex min-h-[120px] w-full rounded-md px-3 py-2 outline-none transition-fg transition-shadow"
            placeholder="Enter SEO meta description"
            value={seo.description}
            onChange={(e) =>
              setSeo((current) => ({
                ...current,
                description: e.target.value,
              }))
            }
          />
          <Text className="text-ui-fg-subtle text-xs">{seo.description.length}/160</Text>
        </div>

        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={onSave}
            disabled={saving}
            isLoading={saving}
          >
            Save
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductSeoMetaWidget
