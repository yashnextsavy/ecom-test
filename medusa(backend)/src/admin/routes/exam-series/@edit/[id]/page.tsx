import {
  Button,
  Drawer,
  Text,
  Input,
  Select,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import ReactQuill from "react-quill"
import { sdk } from "../../../../lib/sdk"
import "react-quill/dist/quill.snow.css"

type ProductCategory = {
  id: string
  name: string
}

type ExamSeries = {
  id: string
  title: string
  description: string
  category_id: string
}

const EditExamSeries = () => {
  const [open, setOpen] = useState(true)
  const navigate = useNavigate()
  const { id } = useParams()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(false)

  // Close drawer → go back
  useEffect(() => {
    if (!open) {
      navigate(-1)
    }
  }, [open, navigate])

  // Load categories + record
  useEffect(() => {
    let mounted = true

    const load = async () => {
      const [{ product_categories }, record] = await Promise.all([
        sdk.admin.productCategory.list(),
        sdk.client.fetch<{ exam_series: ExamSeries }>(`/admin/exam-series/${id}`),
      ])

      if (!mounted) return

      setCategories(product_categories)
      setTitle(record.exam_series.title)
      setDescription(record.exam_series.description || "")
      setCategoryId(record.exam_series.category_id)
    }

    load()

    return () => {
      mounted = false
    }
  }, [id])

  const handleSave = async () => {
    if (!id) return
    if (!title || !categoryId) return

    setLoading(true)

    try {
      await sdk.client.fetch(`/admin/exam-series/${id}`, {
        method: "post",
        body: {
          title,
          description,
          category_id: categoryId,
        },
      })

      navigate("..", { state: { refresh: true } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Content>
        <style>{quillStyles}</style>
        <Drawer.Header>
          <Drawer.Title>Edit Exam Series</Drawer.Title>
        </Drawer.Header>

        <Drawer.Body className="p-4 space-y-4">
          <div>
            <Text className="mb-1">Series name</Text>
            <Input
              placeholder="e.g. 350-XX"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Text className="mb-1">Category</Text>
            <Select
              value={categoryId ?? undefined}
              onValueChange={setCategoryId}
            >
              <Select.Trigger>
                <Select.Value placeholder="Select category" />
              </Select.Trigger>
              <Select.Content>
                {categories.map((category) => (
                  <Select.Item
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>

          <div>
            <Text className="mb-1">Description</Text>
            <div className="exam-series-quill">
              <ReactQuill
                theme="snow"
                value={description}
                onChange={setDescription}
                placeholder="Write exam series description..."
                modules={modules}
                formats={formats}
              />
            </div>
          </div>
        </Drawer.Body>

        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Drawer.Close>

          <Button
            onClick={handleSave}
            disabled={!title || !categoryId || loading}
            isLoading={loading}
          >
            Save
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

export default EditExamSeries

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
    min-height: 110px;
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

const modules = {
  toolbar: [
    ["bold", "italic", "underline"],
    ["link"],
  ],
}

const formats = [
  "bold",
  "italic",
  "underline",
  "link",
]
