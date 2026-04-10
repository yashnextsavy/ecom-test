import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Text, Textarea } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import ReactQuill from "react-quill"

import "react-quill/dist/quill.snow.css"

type FaqItem = {
  question: string
  answer: string
}

const defaultFaqItem = (): FaqItem => ({
  question: "",
  answer: "",
})

const toPlainText = (value: unknown): string => {
  if (typeof value !== "string") {
    return ""
  }
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const answerQuillModules = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "bullet" }],
    ["link"],
  ],
}

const quillFormats = ["bold", "italic", "underline", "link", "list", "bullet"]

const quillStyles = `
  .faq-quill {
    border: 1px solid #d6d6db;
    border-radius: 8px;
    overflow: hidden;
    background: #ffffff;
  }

  .faq-quill .ql-toolbar.ql-snow {
    border: none;
    border-bottom: 1px solid #d6d6db;
    background: #ffffff;
  }

  .faq-quill .ql-container.ql-snow {
    border: none;
    background: #ffffff;
  }

  .faq-quill .ql-editor {
    min-height: 70px;
    color: #171717;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.5;
  }

  .faq-quill .ql-editor.ql-blank::before {
    color: #6a6a74;
    font-style: italic;
  }

  .faq-quill .ql-snow .ql-stroke {
    stroke: #6a6a74;
  }

  .faq-quill .ql-snow .ql-fill {
    fill: #6a6a74;
  }

  .faq-quill .ql-snow button:hover .ql-stroke,
  .faq-quill .ql-snow button.ql-active .ql-stroke {
    stroke: #2563eb;
  }

  .faq-quill .ql-snow button:hover .ql-fill,
  .faq-quill .ql-snow button.ql-active .ql-fill {
    fill: #2563eb;
  }

  .faq-quill .ql-editor a {
    color: #2563eb;
  }

  [data-color-mode="dark"] .faq-quill,
  [data-theme="dark"] .faq-quill,
  .dark .faq-quill {
    border-color: #3b3f4a;
    background: #1b1f2a;
  }

  [data-color-mode="dark"] .faq-quill .ql-toolbar.ql-snow,
  [data-theme="dark"] .faq-quill .ql-toolbar.ql-snow,
  .dark .faq-quill .ql-toolbar.ql-snow {
    border-bottom-color: #3b3f4a;
    background: #1b1f2a;
  }

  [data-color-mode="dark"] .faq-quill .ql-container.ql-snow,
  [data-theme="dark"] .faq-quill .ql-container.ql-snow,
  .dark .faq-quill .ql-container.ql-snow {
    background: #1b1f2a;
  }

  [data-color-mode="dark"] .faq-quill .ql-editor,
  [data-theme="dark"] .faq-quill .ql-editor,
  .dark .faq-quill .ql-editor {
    color: #f3f4f6;
  }

  [data-color-mode="dark"] .faq-quill .ql-editor.ql-blank::before,
  [data-theme="dark"] .faq-quill .ql-editor.ql-blank::before,
  .dark .faq-quill .ql-editor.ql-blank::before {
    color: #9ca3af;
  }

  [data-color-mode="dark"] .faq-quill .ql-snow .ql-stroke,
  [data-theme="dark"] .faq-quill .ql-snow .ql-stroke,
  .dark .faq-quill .ql-snow .ql-stroke {
    stroke: #9ca3af;
  }

  [data-color-mode="dark"] .faq-quill .ql-snow .ql-fill,
  [data-theme="dark"] .faq-quill .ql-snow .ql-fill,
  .dark .faq-quill .ql-snow .ql-fill {
    fill: #9ca3af;
  }

  [data-color-mode="dark"] .faq-quill .ql-editor a,
  [data-theme="dark"] .faq-quill .ql-editor a,
  .dark .faq-quill .ql-editor a {
    color: #60a5fa;
  }
`

const CategoryFaqWidget = () => {
  const { id } = useParams() as { id?: string }
  const [sectionTitle, setSectionTitle] = useState("")
  const [sectionDescription, setSectionDescription] = useState("")
  const [faqItems, setFaqItems] = useState<FaqItem[]>([defaultFaqItem()])
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
        const rawFaq = metadata.category_faqs
        setSectionTitle(
          typeof metadata.category_faq_section_title === "string"
            ? metadata.category_faq_section_title
            : ""
        )
        setSectionDescription(
          typeof metadata.category_faq_section_description === "string"
            ? metadata.category_faq_section_description
            : ""
        )

        if (Array.isArray(rawFaq) && rawFaq.length) {
          const normalized = rawFaq
            .map((item) => {
              if (!item || typeof item !== "object") {
                return null
              }

              const candidate = item as Record<string, unknown>
              return {
                question: toPlainText(candidate.question),
                answer: typeof candidate.answer === "string" ? candidate.answer : "",
              }
            })
            .filter((item): item is FaqItem => Boolean(item))

          if (normalized.length) {
            setFaqItems(normalized)
          }
        }
      } catch (e) {
        console.error("Failed to load category FAQs", e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  const updateFaqItem = (index: number, key: "question" | "answer", value: string) => {
    setFaqItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    )
  }

  const addFaqItem = () => {
    setFaqItems((prev) => [...prev, defaultFaqItem()])
  }

  const removeFaqItem = (index: number) => {
    setFaqItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

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

      const cleanedFaqItems = faqItems.map((item) => ({
        question: item.question.trim(),
        answer: item.answer,
      }))

      const saveRes = await fetch(`/admin/product-categories/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            ...existingMetadata,
            category_faq_section_title: sectionTitle,
            category_faq_section_description: sectionDescription,
            category_faqs: cleanedFaqItems,
          },
        }),
      })

      if (!saveRes.ok) {
        throw new Error(await saveRes.text())
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      console.error("Failed to save category FAQs", e)
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
          <Heading level="h2">FAQ Section</Heading>
          <Button variant="secondary" size="small" onClick={addFaqItem}>
            Add FAQ
          </Button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-4">
          <div className="flex flex-col gap-1">
            <Text className="text-ui-fg-subtle text-xs">Section title</Text>
            <Input
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              placeholder="e.g. Frequently Asked Questions"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Text className="text-ui-fg-subtle text-xs">Section description</Text>
            <div className="faq-quill">
              <ReactQuill
                theme="snow"
                value={sectionDescription}
                onChange={setSectionDescription}
                placeholder="Optional description shown above FAQs"
                modules={answerQuillModules}
                formats={quillFormats}
              />
            </div>
          </div>

          {faqItems.map((item, index) => (
            <div key={index} className="rounded-lg border border-ui-border-base p-4">
              <div className="mb-3 flex items-center justify-between">
                <Text className="font-medium">FAQ {index + 1}</Text>
                <Button
                  variant="transparent"
                  size="small"
                  onClick={() => removeFaqItem(index)}
                  disabled={faqItems.length <= 1}
                >
                  Remove
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <Text className="text-ui-fg-subtle text-xs">Question</Text>
                  <Textarea
                    value={item.question}
                    onChange={(e) => updateFaqItem(index, "question", e.target.value)}
                    placeholder="Enter FAQ question"
                    rows={3}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Text className="text-ui-fg-subtle text-xs">Answer</Text>
                  <div className="faq-quill">
                    <ReactQuill
                      theme="snow"
                      value={item.answer}
                      onChange={(value) => updateFaqItem(index, "answer", value)}
                      placeholder="Enter FAQ answer"
                      modules={answerQuillModules}
                      formats={quillFormats}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

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

export default CategoryFaqWidget
