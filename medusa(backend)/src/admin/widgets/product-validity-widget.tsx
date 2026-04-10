import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Input, Button } from "@medusajs/ui"
import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import ReactQuill from "react-quill"

import "react-quill/dist/quill.snow.css"

type ProductMetadata = Record<string, unknown>

type SectionKey = "validity" | "delivery" | "additional"

type SectionField = {
  title: string
  description: string
}

type SectionsState = Record<SectionKey, SectionField>

const sectionLabels: Record<SectionKey, string> = {
  validity: "Validity Information",
  delivery: "Delivery Information",
  additional: "Additional Information",
}

const initialSections: SectionsState = {
  validity: {
    title: "",
    description: "",
  },
  delivery: {
    title: "",
    description: "",
  },
  additional: {
    title: "",
    description: "",
  },
}

const ProductValidityWidget = () => {
  const { id } = useParams() as { id?: string }
  const [sections, setSections] = useState<SectionsState>(initialSections)
  const [isInternational, setIsInternational] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        const res = await fetch(`/admin/products/${id}`)
        if (!res.ok) return
        const data = await res.json()
        const metadata: ProductMetadata = data.product?.metadata ?? {}
        setIsInternational(Boolean(metadata.is_international))

        setSections({
          validity: {
            title: getMetadataText(metadata.validity_title),
            description: getMetadataText(metadata.validity_description),
          },
          delivery: {
            title: getMetadataText(metadata.delivery_title),
            description: getMetadataText(metadata.delivery_description),
          },
          additional: {
            title: getMetadataText(metadata.additional_title),
            description: getMetadataText(metadata.additional_description),
          },
        })
      } catch (err) {
        console.error("Failed to load product metadata", err)
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
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current)
      }
    }
  }, [])

  const onSaveAll = async () => {
    if (!id) return
    setSaving(true)
    setSaved(false)
    try {
      // Fetch existing product to merge metadata safely
      const getRes = await fetch(`/admin/products/${id}`)
      if (!getRes.ok) throw new Error("Failed to fetch product")
      const { product } = await getRes.json()
      const metadata = product?.metadata ?? {}

      const sectionToMetadataKeys: Record<SectionKey, { title: string; description: string }> = {
        validity: {
          title: "validity_title",
          description: "validity_description",
        },
        delivery: {
          title: "delivery_title",
          description: "delivery_description",
        },
        additional: {
          title: "additional_title",
          description: "additional_description",
        },
      }

      const body = {
        metadata: {
          ...metadata,
          [sectionToMetadataKeys.validity.title]: sections.validity.title,
          [sectionToMetadataKeys.validity.description]: sections.validity.description,
          [sectionToMetadataKeys.delivery.title]: sections.delivery.title,
          [sectionToMetadataKeys.delivery.description]: sections.delivery.description,
          [sectionToMetadataKeys.additional.title]: sections.additional.title,
          [sectionToMetadataKeys.additional.description]: sections.additional.description,
        },
      }

      const res = await fetch(`/admin/products/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Save failed")
      }

      setSaved(true)
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current)
      }
      savedTimerRef.current = setTimeout(() => setSaved(false), 1500)
    } catch (err) {
      console.error("Failed to save product information", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading || isInternational) return null

  return (
    <>
      <style>{quillStyles}</style>
      <Container className="p-0">
        <div className="flex flex-col gap-6 px-6 py-4">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium">Product Information</label>
            <span className="text-ui-fg-subtle text-sm">
              {saving ? "Saving..." : saved ? "Saved" : ""}
            </span>
          </div>

          {(Object.keys(sectionLabels) as SectionKey[]).map((key) => (
            <div key={key} className="flex flex-col gap-3">
              <label className="text-sm font-medium">{sectionLabels[key]}</label>
              <Input
                placeholder={`Enter ${sectionLabels[key]} title`}
                value={sections[key].title}
                onChange={(e: any) => {
                  const value = e.target.value
                  setSections((prev) => ({
                    ...prev,
                    [key]: {
                      ...prev[key],
                      title: value,
                    },
                  }))
                }}
              />
              <div className="product-details-quill">
                <ReactQuill
                  theme="snow"
                  value={sections[key].description}
                  onChange={(value) => {
                    setSections((prev) => ({
                      ...prev,
                      [key]: {
                        ...prev[key],
                        description: value,
                      },
                    }))
                  }}
                  placeholder={`Write ${sectionLabels[key]} description...`}
                  modules={modules}
                  formats={formats}
                />
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={onSaveAll}
              disabled={saving}
              isLoading={saving}
            >
              Save
            </Button>
          </div>
        </div>
      </Container>
    </>
  )
}

const getMetadataText = (value: unknown): string => {
  return typeof value === "string" ? value : ""
}

const quillStyles = `
  .product-details-quill {
    border: 1px solid #d6d6db;
    border-radius: 8px;
    overflow: hidden;
    background: #ffffff;
  }

  .product-details-quill .ql-toolbar.ql-snow {
    border: none;
    border-bottom: 1px solid #d6d6db;
    background: #ffffff;
  }

  .product-details-quill .ql-container.ql-snow {
    border: none;
    background: #ffffff;
  }

  .product-details-quill .ql-editor {
    min-height: 120px;
    color: #171717;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.5;
  }

  .product-details-quill .ql-editor.ql-blank::before {
    color: #6a6a74;
    font-style: italic;
  }

  .product-details-quill .ql-snow .ql-stroke {
    stroke: #6a6a74;
  }

  .product-details-quill .ql-snow .ql-fill {
    fill: #6a6a74;
  }

  .product-details-quill .ql-snow button:hover .ql-stroke,
  .product-details-quill .ql-snow button.ql-active .ql-stroke {
    stroke: #2563eb;
  }

  .product-details-quill .ql-snow button:hover .ql-fill,
  .product-details-quill .ql-snow button.ql-active .ql-fill {
    fill: #2563eb;
  }

  .product-details-quill .ql-editor a {
    color: #2563eb;
  }

  [data-color-mode="dark"] .product-details-quill,
  [data-theme="dark"] .product-details-quill,
  .dark .product-details-quill {
    border-color: #3b3f4a;
    background: #1b1f2a;
  }

  [data-color-mode="dark"] .product-details-quill .ql-toolbar.ql-snow,
  [data-theme="dark"] .product-details-quill .ql-toolbar.ql-snow,
  .dark .product-details-quill .ql-toolbar.ql-snow {
    border-bottom-color: #3b3f4a;
    background: #1b1f2a;
  }

  [data-color-mode="dark"] .product-details-quill .ql-container.ql-snow,
  [data-theme="dark"] .product-details-quill .ql-container.ql-snow,
  .dark .product-details-quill .ql-container.ql-snow {
    background: #1b1f2a;
  }

  [data-color-mode="dark"] .product-details-quill .ql-editor,
  [data-theme="dark"] .product-details-quill .ql-editor,
  .dark .product-details-quill .ql-editor {
    color: #f3f4f6;
  }

  [data-color-mode="dark"] .product-details-quill .ql-editor.ql-blank::before,
  [data-theme="dark"] .product-details-quill .ql-editor.ql-blank::before,
  .dark .product-details-quill .ql-editor.ql-blank::before {
    color: #9ca3af;
  }

  [data-color-mode="dark"] .product-details-quill .ql-snow .ql-stroke,
  [data-theme="dark"] .product-details-quill .ql-snow .ql-stroke,
  .dark .product-details-quill .ql-snow .ql-stroke {
    stroke: #9ca3af;
  }

  [data-color-mode="dark"] .product-details-quill .ql-snow .ql-fill,
  [data-theme="dark"] .product-details-quill .ql-snow .ql-fill,
  .dark .product-details-quill .ql-snow .ql-fill {
    fill: #9ca3af;
  }

  [data-color-mode="dark"] .product-details-quill .ql-snow button:hover .ql-stroke,
  [data-color-mode="dark"] .product-details-quill .ql-snow button.ql-active .ql-stroke,
  [data-theme="dark"] .product-details-quill .ql-snow button:hover .ql-stroke,
  [data-theme="dark"] .product-details-quill .ql-snow button.ql-active .ql-stroke,
  .dark .product-details-quill .ql-snow button:hover .ql-stroke,
  .dark .product-details-quill .ql-snow button.ql-active .ql-stroke {
    stroke: #60a5fa;
  }

  [data-color-mode="dark"] .product-details-quill .ql-snow button:hover .ql-fill,
  [data-color-mode="dark"] .product-details-quill .ql-snow button.ql-active .ql-fill,
  [data-theme="dark"] .product-details-quill .ql-snow button:hover .ql-fill,
  [data-theme="dark"] .product-details-quill .ql-snow button.ql-active .ql-fill,
  .dark .product-details-quill .ql-snow button:hover .ql-fill,
  .dark .product-details-quill .ql-snow button.ql-active .ql-fill {
    fill: #60a5fa;
  }

  [data-color-mode="dark"] .product-details-quill .ql-editor a,
  [data-theme="dark"] .product-details-quill .ql-editor a,
  .dark .product-details-quill .ql-editor a {
    color: #60a5fa;
  }
`

const modules = {
  toolbar: [
    ["bold", "italic", "underline"],
    ["link"],
  ],
}

const formats = ["bold", "italic", "underline", "link"]

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductValidityWidget
