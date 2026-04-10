import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import ReactQuill from "react-quill"

import "react-quill/dist/quill.snow.css"

const quillModules = {
  toolbar: [
    [{ header: [3, 4, 5, false] }],
    ["bold", "italic", "underline", "link"],
    [{ list: "bullet" }],
  ],
}

const quillFormats = ["header", "bold", "italic", "underline", "link", "list", "bullet"]

const titleQuillModules = {
  toolbar: [[{ header: [1] }], ["bold", "italic", "underline"]],
}

const titleQuillFormats = ["header", "bold", "italic", "underline"]

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

  .exam-series-quill .ql-snow button:hover .ql-stroke,
  .exam-series-quill .ql-snow button.ql-active .ql-stroke {
    stroke: #2563eb;
  }

  .exam-series-quill .ql-snow button:hover .ql-fill,
  .exam-series-quill .ql-snow button.ql-active .ql-fill {
    fill: #2563eb;
  }

  .exam-series-quill .ql-snow .ql-picker {
    color: #171717;
  }

  .exam-series-quill .ql-snow .ql-picker-options {
    background: #ffffff;
    border-color: #d6d6db;
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

  [data-color-mode="dark"] .exam-series-quill .ql-snow .ql-stroke,
  [data-theme="dark"] .exam-series-quill .ql-snow .ql-stroke,
  .dark .exam-series-quill .ql-snow .ql-stroke {
    stroke: #9ca3af;
  }

  [data-color-mode="dark"] .exam-series-quill .ql-snow .ql-fill,
  [data-theme="dark"] .exam-series-quill .ql-snow .ql-fill,
  .dark .exam-series-quill .ql-snow .ql-fill {
    fill: #9ca3af;
  }

  [data-color-mode="dark"] .exam-series-quill .ql-snow button:hover .ql-stroke,
  [data-color-mode="dark"] .exam-series-quill .ql-snow button.ql-active .ql-stroke,
  [data-theme="dark"] .exam-series-quill .ql-snow button:hover .ql-stroke,
  [data-theme="dark"] .exam-series-quill .ql-snow button.ql-active .ql-stroke,
  .dark .exam-series-quill .ql-snow button:hover .ql-stroke,
  .dark .exam-series-quill .ql-snow button.ql-active .ql-stroke {
    stroke: #60a5fa;
  }

  [data-color-mode="dark"] .exam-series-quill .ql-snow button:hover .ql-fill,
  [data-color-mode="dark"] .exam-series-quill .ql-snow button.ql-active .ql-fill,
  [data-theme="dark"] .exam-series-quill .ql-snow button:hover .ql-fill,
  [data-theme="dark"] .exam-series-quill .ql-snow button.ql-active .ql-fill,
  .dark .exam-series-quill .ql-snow button:hover .ql-fill,
  .dark .exam-series-quill .ql-snow button.ql-active .ql-fill {
    fill: #60a5fa;
  }

  [data-color-mode="dark"] .exam-series-quill .ql-editor a,
  [data-theme="dark"] .exam-series-quill .ql-editor a,
  .dark .exam-series-quill .ql-editor a {
    color: #60a5fa;
  }
`

const CategoryListingHeroBannerWidget = () => {
  const { id } = useParams() as { id?: string }
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [button1Text, setButton1Text] = useState("")
  const [button1Link, setButton1Link] = useState("")
  const [button2Text, setButton2Text] = useState("")
  const [button2Link, setButton2Link] = useState("")
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
        const listingPageBanner =
          metadata.listing_page_banner && typeof metadata.listing_page_banner === "object"
            ? (metadata.listing_page_banner as Record<string, unknown>)
            : {}

        setTitle(
          typeof metadata.listing_page_banner_title === "string"
            ? metadata.listing_page_banner_title
            : typeof listingPageBanner.title === "string"
              ? listingPageBanner.title
              : ""
        )
        setDescription(
          typeof metadata.listing_page_banner_description === "string"
            ? metadata.listing_page_banner_description
            : typeof listingPageBanner.description === "string"
              ? listingPageBanner.description
              : ""
        )
        setButton1Text(
          typeof metadata.listing_page_banner_button_1_text === "string"
            ? metadata.listing_page_banner_button_1_text
            : typeof listingPageBanner.button_1_text === "string"
              ? listingPageBanner.button_1_text
              : ""
        )
        setButton1Link(
          typeof metadata.listing_page_banner_button_1_link === "string"
            ? metadata.listing_page_banner_button_1_link
            : typeof listingPageBanner.button_1_link === "string"
              ? listingPageBanner.button_1_link
              : ""
        )
        setButton2Text(
          typeof metadata.listing_page_banner_button_2_text === "string"
            ? metadata.listing_page_banner_button_2_text
            : typeof listingPageBanner.button_2_text === "string"
              ? listingPageBanner.button_2_text
              : ""
        )
        setButton2Link(
          typeof metadata.listing_page_banner_button_2_link === "string"
            ? metadata.listing_page_banner_button_2_link
            : typeof listingPageBanner.button_2_link === "string"
              ? listingPageBanner.button_2_link
              : ""
        )
      } catch (e) {
        console.error("Failed to load listing page banner metadata", e)
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
            listing_page_banner_title: title,
            listing_page_banner_description: description,
            listing_page_banner_button_1_text: button1Text,
            listing_page_banner_button_1_link: button1Link,
            listing_page_banner_button_2_text: button2Text,
            listing_page_banner_button_2_link: button2Link,
          },
        }),
      })

      if (!saveRes.ok) {
        throw new Error(await saveRes.text())
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      console.error("Failed to save listing page banner metadata", e)
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
          <Heading level="h2">Listing Page Hero Banner</Heading>
        </div>

        <div className="flex flex-col gap-3 px-6 py-4">
          <div className="flex flex-col gap-2">
            <Text>Banner title</Text>
            <div className="listing-banner-quill exam-series-quill">
              <ReactQuill
                theme="snow"
                value={title}
                onChange={setTitle}
                placeholder="Enter banner title"
                modules={titleQuillModules}
                formats={titleQuillFormats}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Text>Banner description</Text>
            <div className="listing-banner-quill exam-series-quill">
              <ReactQuill
                theme="snow"
                value={description}
                onChange={setDescription}
                placeholder="Enter banner description"
                modules={quillModules}
                formats={quillFormats}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Text>Button 1 text</Text>
              <Input
                placeholder="Enter first button text"
                value={button1Text}
                onChange={(e) => setButton1Text(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Text>Button 1 link</Text>
              <Input
                placeholder="https://example.com/page-1"
                value={button1Link}
                onChange={(e) => setButton1Link(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Text>Button 2 text</Text>
              <Input
                placeholder="Enter second button text"
                value={button2Text}
                onChange={(e) => setButton2Text(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Text>Button 2 link</Text>
              <Input
                placeholder="https://example.com/page-2"
                value={button2Link}
                onChange={(e) => setButton2Link(e.target.value)}
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

export default CategoryListingHeroBannerWidget
