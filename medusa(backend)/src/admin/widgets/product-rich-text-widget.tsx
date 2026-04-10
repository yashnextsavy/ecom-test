import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Button, Heading } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import ReactQuill from "react-quill"

import "react-quill/dist/quill.snow.css"

/* ----------------------------------------
 * Styles
 * --------------------------------------*/
const quillStyles = `
  .quill-widget {
    background: #ffffff;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #d6d6db;
  }

  .quill-widget .ql-container {
    font-family: inherit;
    background: #ffffff;
    border: none;
  }

  .quill-widget .ql-editor {
    min-height: 250px;
    color: #171717;
    background: #ffffff;
    padding: 12px;
    line-height: 1.6;
  }

  .quill-widget .ql-editor.ql-blank::before {
    color: #6a6a74;
  }

  .quill-widget .ql-toolbar {
    background: #ffffff;
    border-bottom: 1px solid #d6d6db;
  }
  .quill-widget .ql-toolbar.ql-snow {
  border: none;
  }

  .quill-widget .ql-toolbar .ql-stroke {
    stroke: #6a6a74;
  }

  .quill-widget .ql-toolbar .ql-fill {
    fill: #6a6a74;
  }

  .quill-widget .ql-toolbar button.ql-active .ql-stroke,
  .quill-widget .ql-toolbar button:hover .ql-stroke {
    stroke: #3b82f6;
  }

  .quill-widget .ql-toolbar button.ql-active .ql-fill,
  .quill-widget .ql-toolbar button:hover .ql-fill {
    fill: #3b82f6;
  }

  .quill-widget .ql-editor a {
    color: #60a5fa;
  }

  [data-color-mode="dark"] .quill-widget,
  [data-theme="dark"] .quill-widget,
  .dark .quill-widget {
    background: #1f2937;
    border-color: rgba(255, 255, 255, 0.08);
  }

  [data-color-mode="dark"] .quill-widget .ql-container,
  [data-theme="dark"] .quill-widget .ql-container,
  .dark .quill-widget .ql-container {
    background: #1f2937;
  }

  [data-color-mode="dark"] .quill-widget .ql-editor,
  [data-theme="dark"] .quill-widget .ql-editor,
  .dark .quill-widget .ql-editor {
    color: #f3f4f6;
    background: #212121;
  }

  [data-color-mode="dark"] .quill-widget .ql-editor.ql-blank::before,
  [data-theme="dark"] .quill-widget .ql-editor.ql-blank::before,
  .dark .quill-widget .ql-editor.ql-blank::before {
    color: #9ca3af;
  }

  [data-color-mode="dark"] .quill-widget .ql-toolbar,
  [data-theme="dark"] .quill-widget .ql-toolbar,
  .dark .quill-widget .ql-toolbar {
    background: #18181a;
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }

  [data-color-mode="dark"] .quill-widget .ql-toolbar .ql-stroke,
  [data-theme="dark"] .quill-widget .ql-toolbar .ql-stroke,
  .dark .quill-widget .ql-toolbar .ql-stroke {
    stroke: #9ca3af;
  }

  [data-color-mode="dark"] .quill-widget .ql-toolbar .ql-fill,
  [data-theme="dark"] .quill-widget .ql-toolbar .ql-fill,
  .dark .quill-widget .ql-toolbar .ql-fill {
    fill: #9ca3af;
  }
`

/* ----------------------------------------
 * Widget
 * --------------------------------------*/
const CategoryRichTextWidget = () => {
  const { id } = useParams() as { id?: string }

  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  /* ----------------------------------------
   * Load existing category metadata
   * --------------------------------------*/
  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        const res = await fetch(`/admin/product-categories/${id}`)
        if (!res.ok) return

        const { product_category } = await res.json()
        setContent(product_category?.metadata?.rich_description || "")
      } catch (e) {
        console.error("Failed to load category description", e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  /* ----------------------------------------
   * Save to category metadata
   * --------------------------------------*/
  const onSave = async () => {
    if (!id) return

    setSaving(true)

    try {
      const categoryRes = await fetch(`/admin/product-categories/${id}`)
      if (!categoryRes.ok) {
        throw new Error(await categoryRes.text())
      }

      const { product_category } = await categoryRes.json()
      const existingMetadata = product_category?.metadata ?? {}

      const res = await fetch(`/admin/product-categories/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            ...existingMetadata,
            rich_description: content,
          },
        }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      console.log("Category rich description saved")
    } catch (e) {
      console.error("Save failed", e)
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
          <Heading level="h2">Category Detailed Description</Heading>

        </div>
        <div className="flex flex-col gap-3 px-6 py-4">


          <div className="quill-widget">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              placeholder="Write rich category description..."
              modules={modules}
              formats={formats}
            />
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
    </>
  ) 
}

/* ----------------------------------------
 * Quill Config
 * --------------------------------------*/
const modules = {
  toolbar: [
    [{ header: [2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
  ],
}

const formats = [
  "header",
  "bold",
  "italic",
  "strike",
  "list",
  "bullet",
  "link",
]

/* ----------------------------------------
 * Widget Placement
 * --------------------------------------*/
export const config = defineWidgetConfig({
  zone: "product_category.details.after",
})

export default CategoryRichTextWidget
