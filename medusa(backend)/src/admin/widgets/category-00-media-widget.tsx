import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { DetailWidgetProps, AdminProductCategory } from "@medusajs/framework/types"
import { useQuery } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { sdk } from "../lib/sdk"
import { CategoryImage } from "../types"
import { ThumbnailBadge } from "@medusajs/icons"
import { CategoryImageUpload } from "../components/category-media/category-image-upload"
import { useCategoryImageMutations } from "../hooks/use-category-image"

type CategoryImagesResponse = {
  category_images: CategoryImage[]
}

const CategoryMediaWidget = ({ data }: DetailWidgetProps<AdminProductCategory>) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const { data: response, isLoading } = useQuery({
    queryKey: ["category-images", data.id],
    queryFn: async () => {
      const result = await sdk.client.fetch<CategoryImagesResponse>(
        `/admin/categories/${data.id}/images`
      )
      return result
    },
  })

  const images = response?.category_images || []

  const {
    uploadFilesMutation,
    createImagesMutation,
    deleteImagesMutation,
  } = useCategoryImageMutations({
    categoryId: data.id,
  })

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    setUploading(true)
    try {
      const upload = await uploadFilesMutation.mutateAsync([file])

      if (images.length > 0) {
        const ids = images.map((i) => i.id).filter((id): id is string => Boolean(id))
        if (ids.length) {
          await deleteImagesMutation.mutateAsync(ids)
        }
      }

      const uploadedFile = upload.files?.[0]
      if (!uploadedFile) {
        throw new Error("Upload failed")
      }

      await createImagesMutation.mutateAsync([
        {
          url: uploadedFile.url,
          file_id: uploadedFile.id,
          type: "thumbnail",
        },
      ])
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = async () => {
    if (!images.length) return
    const ids = images.map((i) => i.id).filter((id): id is string => Boolean(id))
    if (!ids.length) return
    await deleteImagesMutation.mutateAsync(ids)
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Media</Heading>
        {images.length > 0 && (
          <Button size="small" variant="secondary" onClick={handleRemove}>
            Remove
          </Button>
        )}
      </div>
      <div className="px-6 py-4">
        <CategoryImageUpload
          fileInputRef={fileInputRef}
          isUploading={uploading || uploadFilesMutation.isPending}
          onFileSelect={handleFileSelect}
          required={images.length === 0}
        />
        <Text className="mt-3 text-xs text-ui-fg-subtle">
          Only one image is allowed. Uploading a new image will replace the existing one.
        </Text>
        <div className="grid grid-cols-[repeat(auto-fill,96px)] gap-4 border-t pt-4 mt-4">
          {isLoading && (
            <div className="col-span-full">
              <p className="text-ui-fg-subtle text-sm">Loading...</p>
            </div>
          )}
          {!isLoading && images.length === 0 && (
            <div className="col-span-full">
              <p className="text-ui-fg-subtle text-sm">No images added yet</p>
            </div>
          )}
          {images.map((image: CategoryImage) => (
            <div
              key={image.id}
              className="relative aspect-square overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-subtle"
            >
              <img
                src={image.url}
                alt={`Category ${image.type}`}
                className="h-full w-full object-cover"
              />
              {image.type === "thumbnail" && (
                <div className="absolute top-2 left-2">
                  <ThumbnailBadge />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.after",
})

export default CategoryMediaWidget
