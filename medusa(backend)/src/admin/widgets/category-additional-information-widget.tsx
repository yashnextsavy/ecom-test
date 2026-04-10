import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Text } from "@medusajs/ui"
import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import { useParams } from "react-router-dom"
import ReactQuill from "react-quill"

import "react-quill/dist/quill.snow.css"

type ExamInformationItem = {
  title: string
  description: string
  values: string[]
}

const defaultExamInformationItem = (): ExamInformationItem => ({
  title: "",
  description: "",
  values: [""],
})

const valueModules = {
  toolbar: [
    ["bold", "italic", "underline"],
    ["link"],
  ],
}

const valueFormats = ["bold", "italic", "underline", "link"]

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

const CategoryAdditionalInformationWidget = () => {
  const { id } = useParams() as { id?: string }
  const [sectionTitle, setSectionTitle] = useState("")
  const [sectionDescription, setSectionDescription] = useState("")
  const [examInformation, setExamInformation] = useState<ExamInformationItem[]>([
    defaultExamInformationItem(),
  ])
  const [certificationLevels, setCertificationLevels] = useState<ExamInformationItem[]>([
    defaultExamInformationItem(),
  ])
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
        const additionalInformation =
          metadata.additional_information && typeof metadata.additional_information === "object"
            ? (metadata.additional_information as Record<string, unknown>)
            : {}

        setSectionTitle(
          typeof metadata.additional_information_section_title === "string"
            ? metadata.additional_information_section_title
            : typeof additionalInformation.title === "string"
              ? additionalInformation.title
              : ""
        )
        setSectionDescription(
          typeof metadata.additional_information_section_description === "string"
            ? metadata.additional_information_section_description
            : typeof additionalInformation.description === "string"
              ? additionalInformation.description
              : ""
        )

        const rawExamInformation = Array.isArray(metadata.additional_information_exam_information)
          ? metadata.additional_information_exam_information
          : additionalInformation.exam_information
        if (Array.isArray(rawExamInformation) && rawExamInformation.length) {
          const normalized = rawExamInformation
            .map((item) => {
              if (!item || typeof item !== "object") {
                return null
              }

              const candidate = item as Record<string, unknown>
              const values = Array.isArray(candidate.values)
                ? candidate.values.filter((v): v is string => typeof v === "string")
                : []

              return {
                title: typeof candidate.title === "string" ? candidate.title : "",
                description:
                  typeof candidate.description === "string" ? candidate.description : "",
                values: values.length ? values : [""],
              }
            })
            .filter((item): item is ExamInformationItem => Boolean(item))

          if (normalized.length) {
            setExamInformation(normalized)
          }
        }

        const rawCertificationLevels = Array.isArray(metadata.additional_information_certification_levels)
          ? metadata.additional_information_certification_levels
          : additionalInformation.certification_levels
        if (Array.isArray(rawCertificationLevels) && rawCertificationLevels.length) {
          const normalized = rawCertificationLevels
            .map((item) => {
              if (!item || typeof item !== "object") {
                return null
              }

              const candidate = item as Record<string, unknown>
              const values = Array.isArray(candidate.values)
                ? candidate.values.filter((v): v is string => typeof v === "string")
                : []

              return {
                title: typeof candidate.title === "string" ? candidate.title : "",
                description:
                  typeof candidate.description === "string" ? candidate.description : "",
                values: values.length ? values : [""],
              }
            })
            .filter((item): item is ExamInformationItem => Boolean(item))

          if (normalized.length) {
            setCertificationLevels(normalized)
          }
        }
      } catch (e) {
        console.error("Failed to load additional information section", e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  const updateListItem = (
    setList: Dispatch<SetStateAction<ExamInformationItem[]>>,
    index: number,
    updater: (current: ExamInformationItem) => ExamInformationItem
  ) => {
    setList((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? updater(item) : item))
    )
  }

  const addItem = (setList: Dispatch<SetStateAction<ExamInformationItem[]>>) => {
    setList((prev) => [...prev, defaultExamInformationItem()])
  }

  const removeItem = (
    setList: Dispatch<SetStateAction<ExamInformationItem[]>>,
    index: number
  ) => {
    setList((prev) =>
      prev.length > 1 ? prev.filter((_, itemIndex) => itemIndex !== index) : prev
    )
  }

  const addValue = (
    setList: Dispatch<SetStateAction<ExamInformationItem[]>>,
    index: number
  ) => {
    updateListItem(setList, index, (current) => ({
      ...current,
      values: [...current.values, ""],
    }))
  }

  const removeValue = (
    setList: Dispatch<SetStateAction<ExamInformationItem[]>>,
    index: number,
    valueIndex: number
  ) => {
    updateListItem(setList, index, (current) => {
      if (current.values.length <= 1) return current
      return {
        ...current,
        values: current.values.filter((_, idx) => idx !== valueIndex),
      }
    })
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

      const cleanedExamInformation = examInformation.map((item) => ({
        title: item.title,
        description: item.description,
        values: item.values,
      }))
      const cleanedCertificationLevels = certificationLevels.map((item) => ({
        title: item.title,
        description: item.description,
        values: item.values,
      }))

      const saveRes = await fetch(`/admin/product-categories/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            ...existingMetadata,
            additional_information_section_title: sectionTitle,
            additional_information_section_description: sectionDescription,
            additional_information_exam_information: cleanedExamInformation,
            additional_information_certification_levels: cleanedCertificationLevels,
          },
        }),
      })

      if (!saveRes.ok) {
        throw new Error(await saveRes.text())
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      console.error("Failed to save additional information section", e)
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
          <Heading level="h2">Additional Information Section</Heading>
        </div>

        <div className="flex flex-col px-6 py-4">

          <div className="flex flex-col gap-2 mb-5">
            <Text>Section title</Text>
            <Input
              placeholder="Enter section title"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
            />

            <Text>Description</Text>
            <Input
              placeholder="Enter section description"
              value={sectionDescription}
              onChange={(e) => setSectionDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-4 mb-4 flex-col lg:flex-row">

            <div className="rounded-lg border border-ui-border-base w-full pb-3">
              <div className="mb-3 flex items-center justify-between !m-0 p-3">
                <Text className="font-medium">Exam Information</Text>
                <Button variant="secondary" size="small" onClick={() => addItem(setExamInformation)}>
                  Add Item
                </Button>
              </div>


              <div className="flex flex-col gap-4">
                {examInformation.map((examInfo, index) => (
                  <div key={index} className="border border-ui-border-base border-l-0 border-r-0 border-b-0 pb-0 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <Text className="font-medium">Item {index + 1}</Text>
                      <Button
                        variant="transparent"
                        size="small"
                        onClick={() => removeItem(setExamInformation, index)}
                        disabled={examInformation.length <= 1}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Input
                        placeholder="Title"
                        value={examInfo.title}
                        onChange={(e) =>
                          updateListItem(setExamInformation, index, (current) => ({
                            ...current,
                            title: e.target.value,
                          }))
                        }
                      />

                      <Input
                        placeholder="Description"
                        value={examInfo.description}
                        onChange={(e) =>
                          updateListItem(setExamInformation, index, (current) => ({
                            ...current,
                            description: e.target.value,
                          }))
                        }
                      />

                      <div className="border border-ui-border-base p-3 border-l-0 border-r-0 border-b-0 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <Text className="font-medium">Values (min 1)</Text>
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => addValue(setExamInformation, index)}
                          >
                            Add New
                          </Button>
                        </div>

                        {examInfo.values.map((value, valueIndex) => (
                          <div key={valueIndex} className="flex items-start gap-2">
                            <div className="w-full">
                              <div className="exam-series-quill">
                                <ReactQuill
                                  theme="snow"
                                  value={value}
                                  onChange={(nextValue) =>
                                    updateListItem(setExamInformation, index, (current) => ({
                                      ...current,
                                      values: current.values.map((itemValue, itemValueIndex) =>
                                        itemValueIndex === valueIndex ? nextValue : itemValue
                                      ),
                                    }))
                                  }
                                  placeholder={`Value ${valueIndex + 1}`}
                                  modules={valueModules}
                                  formats={valueFormats}
                                />
                              </div>
                            </div>
                            <Button
                              variant="transparent"
                              size="small"
                              onClick={() => removeValue(setExamInformation, index, valueIndex)}
                              disabled={examInfo.values.length <= 1}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>



            </div>

            <div className="rounded-lg border border-ui-border-base w-full">
              <div className="mb-3 flex items-center justify-between !m-0 p-3">
                <Text className="font-medium">Certification Levels</Text>
                <Button variant="secondary" size="small" onClick={() => addItem(setCertificationLevels)}>
                  Add Item
                </Button>
              </div>


              <div className="flex flex-col gap-4">
                {certificationLevels.map((examInfo, index) => (
                  <div key={index} className="border border-ui-border-base border-l-0 border-r-0 border-b-0 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <Text className="font-medium">Item {index + 1}</Text>
                      <Button
                        variant="transparent"
                        size="small"
                        onClick={() => removeItem(setCertificationLevels, index)}
                        disabled={certificationLevels.length <= 1}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Input
                        placeholder="Title"
                        value={examInfo.title}
                        onChange={(e) =>
                          updateListItem(setCertificationLevels, index, (current) => ({
                            ...current,
                            title: e.target.value,
                          }))
                        }
                      />

                      <Input
                        placeholder="Description"
                        value={examInfo.description}
                        onChange={(e) =>
                          updateListItem(setCertificationLevels, index, (current) => ({
                            ...current,
                            description: e.target.value,
                          }))
                        }
                      />

                      <div className="border border-ui-border-base border-l-0 border-r-0 border-b-0 p-3 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <Text className="font-medium">Values (min 1)</Text>
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => addValue(setCertificationLevels, index)}
                          >
                            Add New
                          </Button>
                        </div>

                        {examInfo.values.map((value, valueIndex) => (
                          <div key={valueIndex} className="flex items-start gap-2">
                            <div className="w-full">
                              <div className="exam-series-quill">
                                <ReactQuill
                                  theme="snow"
                                  value={value}
                                  onChange={(nextValue) =>
                                    updateListItem(setCertificationLevels, index, (current) => ({
                                      ...current,
                                      values: current.values.map((itemValue, itemValueIndex) =>
                                        itemValueIndex === valueIndex ? nextValue : itemValue
                                      ),
                                    }))
                                  }
                                  placeholder={`Value ${valueIndex + 1}`}
                                  modules={valueModules}
                                  formats={valueFormats}
                                />
                              </div>
                            </div>
                            <Button
                              variant="transparent"
                              size="small"
                              onClick={() => removeValue(setCertificationLevels, index, valueIndex)}
                              disabled={examInfo.values.length <= 1}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>



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

export default CategoryAdditionalInformationWidget
