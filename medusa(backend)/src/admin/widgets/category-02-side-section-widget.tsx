import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import ReactQuill from "react-quill"

import "react-quill/dist/quill.snow.css"

const sideSectionDescriptionQuillModules = {
  toolbar: [
    [{ header: [5, false] }],
    ["bold", "italic", "underline", "link"],
  ],
}

const sideSectionDescriptionQuillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "link",
]

const quillStyles = `
  .exam-series-quill {
    border: 1px solid #d6d6db;
    border-radius: 8px;
    overflow: hidden;
    background: #ffffff;
  }

  .exam-series-quill .ql-toolbar.ql-snow {
    border: none;
    border-bottom: 1px solid #d6d6db;
    background: #ffffff;
  }

  .exam-series-quill .ql-container.ql-snow {
    border: none;
    background: #ffffff;
  }

  .exam-series-quill .ql-editor {
    min-height: 70px;
    color: #171717;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.5;
  }

  .exam-series-quill .ql-editor.ql-blank::before {
    color: #6a6a74;
    font-style: italic;
  }

  .exam-series-quill .ql-snow .ql-stroke {
    stroke: #6a6a74;
  }

  .exam-series-quill .ql-snow .ql-fill {
    fill: #6a6a74;
  }

  .exam-series-quill .ql-snow .ql-picker {
    color: #171717;
  }

  .exam-series-quill .ql-snow .ql-picker-options {
    background: #ffffff;
    border-color: #d6d6db;
  }

  .exam-series-quill .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="5"]::before,
  .exam-series-quill .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="5"]::before {
    content: "Heading 5";
  }

  .exam-series-quill .ql-snow button:hover .ql-stroke,
  .exam-series-quill .ql-snow button.ql-active .ql-stroke {
    stroke: #2563eb;
  }

  .exam-series-quill .ql-snow button:hover .ql-fill,
  .exam-series-quill .ql-snow button.ql-active .ql-fill {
    fill: #2563eb;
  }

  .exam-series-quill .ql-editor a {
    color: #2563eb;
  }

  [data-color-mode="dark"] .exam-series-quill,
  [data-theme="dark"] .exam-series-quill,
  .dark .exam-series-quill {
    border-color: #3b3f4a;
    background: #1b1f2a;
  }

  [data-color-mode="dark"] .exam-series-quill .ql-toolbar.ql-snow,
  [data-theme="dark"] .exam-series-quill .ql-toolbar.ql-snow,
  .dark .exam-series-quill .ql-toolbar.ql-snow {
    border-bottom-color: #3b3f4a;
    background: #1b1f2a;
  }

  [data-color-mode="dark"] .exam-series-quill .ql-container.ql-snow,
  [data-theme="dark"] .exam-series-quill .ql-container.ql-snow,
  .dark .exam-series-quill .ql-container.ql-snow {
    background: #1b1f2a;
  }

  [data-color-mode="dark"] .exam-series-quill .ql-editor,
  [data-theme="dark"] .exam-series-quill .ql-editor,
  .dark .exam-series-quill .ql-editor {
    color: #f3f4f6;
  }

  [data-color-mode="dark"] .exam-series-quill .ql-editor.ql-blank::before,
  [data-theme="dark"] .exam-series-quill .ql-editor.ql-blank::before,
  .dark .exam-series-quill .ql-editor.ql-blank::before {
    color: #9ca3af;
  }

  [data-color-mode="dark"] .exam-series-quill .ql-snow .ql-picker,
  [data-theme="dark"] .exam-series-quill .ql-snow .ql-picker,
  .dark .exam-series-quill .ql-snow .ql-picker {
    color: #f3f4f6;
  }

  [data-color-mode="dark"] .exam-series-quill .ql-snow .ql-picker-options,
  [data-theme="dark"] .exam-series-quill .ql-snow .ql-picker-options,
  .dark .exam-series-quill .ql-snow .ql-picker-options {
    background: #1b1f2a;
    border-color: #3b3f4a;
  }
`

const CategoryListingSideSectionWidget = () => {
  const { id } = useParams() as { id?: string }
  const [sideSectionTitle, setSideSectionTitle] = useState("")
  const [sideSectionDescription, setSideSectionDescription] = useState("")
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
        const listingPageSideSection =
          metadata.listing_page_side_section && typeof metadata.listing_page_side_section === "object"
            ? (metadata.listing_page_side_section as Record<string, unknown>)
            : {}

        setSideSectionTitle(
          typeof metadata.listing_page_side_section_title === "string"
            ? metadata.listing_page_side_section_title
            : typeof listingPageSideSection.title === "string"
              ? listingPageSideSection.title
              : ""
        )
        setSideSectionDescription(
          typeof metadata.listing_page_side_section_description === "string"
            ? metadata.listing_page_side_section_description
            : typeof listingPageSideSection.description === "string"
              ? listingPageSideSection.description
              : ""
        )
      } catch (e) {
        console.error("Failed to load listing page side section metadata", e)
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
            listing_page_side_section_title: sideSectionTitle,
            listing_page_side_section_description: sideSectionDescription,
          },
        }),
      })

      if (!saveRes.ok) {
        throw new Error(await saveRes.text())
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      console.error("Failed to save listing page side section metadata", e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <>
      <style>{quillStyles}</style>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Listing Page Side Section (Only visible if fewer than 2 products)</Heading>
        </div>

        <div className="flex flex-col gap-3 px-6 py-4">
          <div className="flex flex-col gap-2">
            <Text>Title</Text>
            <Input
              placeholder="Enter side section title"
              value={sideSectionTitle}
              onChange={(e) => setSideSectionTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Text>Description</Text>
            <div className="listing-banner-quill exam-series-quill">
              <ReactQuill
                theme="snow"
                value={sideSectionDescription}
                onChange={setSideSectionDescription}
                placeholder="Enter side section description"
                modules={sideSectionDescriptionQuillModules}
                formats={sideSectionDescriptionQuillFormats}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={onSave} disabled={saving} isLoading={saving}>
              {saved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </Container>
    </>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.after",
})

export default CategoryListingSideSectionWidget
