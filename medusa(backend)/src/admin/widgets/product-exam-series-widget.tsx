import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Checkbox, Container, DropdownMenu, Input, Text } from "@medusajs/ui"
import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import ReactQuill from "react-quill"

import "react-quill/dist/quill.snow.css"

type ExamSeries = {
  id: string
  title: string
  category_id?: string
  category_title?: string
}

const ProductExamSeriesWidget = () => {
  const { id } = useParams() as { id?: string }
  const [examSeries, setExamSeries] = useState<ExamSeries[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [examSeriesText, setExamSeriesText] = useState("")
  const [examSeriesDescription, setExamSeriesDescription] = useState("")
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [productCategoryId, setProductCategoryId] = useState<string | null>(null)
  const [productCategoryTitle, setProductCategoryTitle] = useState<string | null>(null)
  const initializedRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedSnapshotRef = useRef("")
  const pendingSaveRef = useRef(false)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        const [seriesRes, productRes] = await Promise.all([
          fetch(`/admin/exam-series`),
          fetch(
            `/admin/products/${id}?fields=id,metadata,category_id,categories.id,categories.name,categories.metadata`
          ),
        ])

        let seriesData: { exam_series?: ExamSeries[] } = {}
        if (seriesRes.ok) {
          seriesData = await seriesRes.json()
          setExamSeries(seriesData.exam_series ?? [])
        }

        if (productRes.ok) {
          const data = await productRes.json()
          const product = data.product
          const metadata = product?.metadata ?? {}
          const existing = metadata?.exam_series

          if (Array.isArray(existing)) {
            setSelectedIds(existing.filter((v) => typeof v === "string"))
          } else if (typeof existing === "string") {
            try {
              const parsed = JSON.parse(existing)
              if (Array.isArray(parsed)) {
                setSelectedIds(parsed.filter((v) => typeof v === "string"))
              }
            } catch {
              // ignore legacy string format
            }
          }

          const existingText = metadata?.exam_series_text
          if (typeof existingText === "string") {
            setExamSeriesText(existingText)
          }

          const categoryFallbackDescription =
            typeof product?.categories?.[0]?.metadata?.fallbackDescription === "string"
              ? product.categories[0].metadata.fallbackDescription
              : undefined

          const existingDescription =
            typeof metadata?.exam_series_description === "string"
              ? metadata.exam_series_description
              : typeof metadata?.fallbackDescription === "string"
                ? metadata.fallbackDescription
                : typeof categoryFallbackDescription === "string"
                  ? categoryFallbackDescription
                : undefined
          if (typeof existingDescription === "string") {
            setExamSeriesDescription(existingDescription)
          }

          const inferredCategoryId =
            product?.category_id ||
            product?.category_ids?.[0] ||
            product?.categories?.[0]?.id ||
            null

          if (inferredCategoryId) {
            setProductCategoryId(inferredCategoryId)

            const categoryNameFromProduct =
              product?.categories?.[0]?.name || null
            if (categoryNameFromProduct) {
              setProductCategoryTitle(categoryNameFromProduct)
            } else {
              const match = (seriesData.exam_series ?? []).find(
                (s: ExamSeries) => s.category_id === inferredCategoryId
              )
              if (match?.category_title) {
                setProductCategoryTitle(match.category_title)
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load product metadata", err)
      } finally {
        initializedRef.current = true
      }
    }

    load()
  }, [id])

  useEffect(() => {
    if (!id || !initializedRef.current) return

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      onSave()
    }, 400)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [selectedIds, examSeriesText, id, productCategoryId])

  useEffect(() => {
    if (saving || !pendingSaveRef.current) return
    pendingSaveRef.current = false
    onSave()
  }, [saving, selectedIds, examSeriesText, examSeriesDescription, id, productCategoryId])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current)
      }
    }
  }, [])

  const buildSnapshot = () =>
    JSON.stringify({
      id,
      productCategoryId,
      selectedIds: [...selectedIds].sort(),
      examSeriesText,
      examSeriesDescription,
    })

  const onSave = async (options?: { force?: boolean }) => {
    if (!id) return
    const snapshot = buildSnapshot()

    if (!options?.force && snapshot === lastSavedSnapshotRef.current) {
      return
    }

    if (saving) {
      pendingSaveRef.current = true
      return
    }

    setSaving(true)
    setSaved(false)
    try {
      // Fetch existing product to merge metadata safely
      const getRes = await fetch(`/admin/products/${id}`)
      if (!getRes.ok) throw new Error("Failed to fetch product")
      const { product } = await getRes.json()
      const metadata = product?.metadata ?? {}

      const body = {
        metadata: {
          ...metadata,
          exam_series: selectedIds,
          exam_series_text: examSeriesText,
          exam_series_description: examSeriesDescription,
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

      if (productCategoryId) {
        const categoryRes = await fetch(`/admin/product-categories/${productCategoryId}`)
        if (categoryRes.ok) {
          const categoryData = await categoryRes.json()
          const categoryMetadata = categoryData?.product_category?.metadata ?? {}

          const categorySaveRes = await fetch(`/admin/product-categories/${productCategoryId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fallbackDescription: examSeriesDescription,
              metadata: {
                ...categoryMetadata,
                fallbackDescription: examSeriesDescription,
              },
            }),
          })

          if (!categorySaveRes.ok) {
            const categoryText = await categorySaveRes.text()
            console.error(
              categoryText || "Failed to save category fallbackDescription"
            )
          }
        }
      }

      lastSavedSnapshotRef.current = snapshot
      setSaved(true)
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current)
      }
      savedTimerRef.current = setTimeout(() => {
        setSaved(false)
      }, 1500)
    } catch (err) {
      console.error("Failed to save exam series", err)
    } finally {
      setSaving(false)
    }
  }

  const hasExamSeriesText = examSeriesText.trim().length > 0
  const hasSelectedSeries = selectedIds.length > 0
  const hasDescription = examSeriesDescription.replace(/<[^>]*>/g, "").trim().length > 0

  const disableDescription = hasExamSeriesText || hasSelectedSeries
  const disableTextAndSeries = hasDescription

  const showTextAndSeriesBlock = !hasDescription
  const showDescriptionBlock = hasDescription || (!hasExamSeriesText && !hasSelectedSeries)

  return (
    <>
      <style>{quillStyles}</style>
      <Container className="p-0">
        <div className="flex flex-col gap-3 px-6 py-4">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium">Exam Series Information</label>
          {saving && (
            <Text className="text-ui-fg-subtle text-sm">Saving...</Text>
          )}
          {!saving && saved && (
            <Text className="text-ui-fg-subtle text-sm">Saved</Text>
          )}
        </div>

        {showTextAndSeriesBlock && (
          <div className="relative flex flex-col gap-3">
            <Text className="text-ui-fg-subtle text-xs">
              Fill these fields together. If description is entered, this block will be hidden.
            </Text>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">Exam Series Text</label>
              <Input
                placeholder="Enter exam series text"
                value={examSeriesText}
                disabled={disableTextAndSeries}
                onChange={(e: any) => setExamSeriesText(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">Select Exam Series</label>
              <DropdownMenu
                open={disableTextAndSeries ? false : open}
                onOpenChange={(nextOpen) => {
                  if (!disableTextAndSeries) setOpen(nextOpen)
                }}
              >
                <DropdownMenu.Trigger asChild>
                  <Button
                    variant="secondary"
                    className="justify-between w-full"
                    disabled={disableTextAndSeries}
                  >
                    {selectedIds.length > 0
                      ? examSeries
                        .filter((s) => selectedIds.includes(s.id))
                        .map((s) => s.title)
                        .join(", ")
                      : "Select exam series"}
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="start" className="w-[320px] p-0">
                  <div className="p-2">
                    <Input
                      placeholder="Search exam series"
                      value={search}
                      onChange={(e: any) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-64 overflow-auto px-2 pb-2">
                    {(() => {
                      const q = search.trim().toLowerCase()
                      const filtered = examSeries.filter((s) =>
                        s.title.toLowerCase().includes(q)
                      )

                      const groups = filtered.reduce((acc, s) => {
                        const key = s.category_title || "Uncategorized"
                        if (!acc[key]) acc[key] = []
                        acc[key].push(s)
                        return acc
                      }, {} as Record<string, ExamSeries[]>)

                      const groupEntries = Object.entries(groups).sort(([a], [b]) => {
                        if (productCategoryTitle) {
                          if (a === productCategoryTitle) return -1
                          if (b === productCategoryTitle) return 1
                        }
                        return a.localeCompare(b)
                      })

                      return groupEntries.map(([groupTitle, items]) => (
                        <div key={groupTitle} className="pb-2">
                          <Text className="px-2 pb-1 pt-2 text-xs text-ui-fg-subtle">
                            {groupTitle}
                          </Text>
                          {items.map((s) => {
                            const checked = selectedIds.includes(s.id)
                            return (
                              <div
                                key={s.id}
                                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-ui-bg-base-hover"
                                onClick={() => {
                                  setSelectedIds((prev) =>
                                    prev.includes(s.id)
                                      ? prev.filter((id) => id !== s.id)
                                      : [...prev, s.id]
                                  )
                                }}
                              >
                                <Checkbox checked={checked} />
                                <Text className="text-ui-fg-base">{s.title}</Text>
                              </div>
                            )
                          })}
                        </div>
                      ))
                    })()}
                    {examSeries.length === 0 && (
                      <Text className="px-2 py-2 text-ui-fg-subtle">
                        No exam series found.
                      </Text>
                    )}
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu>
            </div>
          </div>
        )}

        {showTextAndSeriesBlock && showDescriptionBlock && (
          <div className="relative py-1">
            <div className="border-t border-ui-border-base" />
            <Text className="text-ui-fg-subtle text-xs absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-ui-bg-base px-2">
              OR
            </Text>
          </div>
        )}

        {showDescriptionBlock && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Exam Series Description</label>
            <Text className="text-ui-fg-subtle text-xs">
              If exam series text or selection is entered, this description will be hidden.
            </Text>
            <div className={`exam-series-quill ${disableDescription ? "opacity-60" : ""}`}>
              <ReactQuill
                theme="snow"
                value={examSeriesDescription}
                readOnly={disableDescription}
                onChange={(value) => setExamSeriesDescription(value)}
                onBlur={() => onSave()}
                placeholder="Write exam series description..."
                modules={modules}
                formats={formats}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            variant="secondary"
            onClick={() => onSave({ force: true })}
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
    min-height: 140px;
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

const modules = {
  toolbar: [
    [{ header: [2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
  ],
}

const formats = ["header", "bold", "italic", "underline", "list", "bullet", "link"]

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export default ProductExamSeriesWidget
