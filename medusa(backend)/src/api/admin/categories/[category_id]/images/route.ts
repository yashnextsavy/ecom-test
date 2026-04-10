import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createCategoryImagesWorkflow } from "../../../../../workflows/create-category-images"
import { z } from "@medusajs/framework/zod"

export const CreateCategoryImagesSchema = z.object({
  images: z.array(
    z.object({
      type: z.enum(["thumbnail", "image"]),
      url: z.string(),
      file_id: z.string(),
    })
  ).min(1, "At least one image is required").max(1, "Only one image is allowed"),
})

type CreateCategoryImagesInput = z.infer<typeof CreateCategoryImagesSchema>

const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"])

const getMediaBaseOrigin = (): string => {
  const configuredUrl =
    process.env.FILE_BACKEND_URL ||
    (process.env.MEDUSA_BACKEND_URL
      ? `${process.env.MEDUSA_BACKEND_URL.replace(/\/$/, "")}/static`
      : "")

  if (!configuredUrl) {
    return ""
  }

  try {
    return new URL(configuredUrl).origin
  } catch {
    return ""
  }
}

const MEDIA_BASE_ORIGIN = getMediaBaseOrigin()

const normalizeMediaUrl = (url: string): string => {
  if (!url || !MEDIA_BASE_ORIGIN) {
    return url
  }

  if (url.startsWith("/")) {
    return `${MEDIA_BASE_ORIGIN}${url}`
  }

  if (!/^https?:\/\//i.test(url)) {
    return `${MEDIA_BASE_ORIGIN}/${url.replace(/^\/+/, "")}`
  }

  try {
    const parsedUrl = new URL(url)

    if (!LOCALHOST_HOSTNAMES.has(parsedUrl.hostname)) {
      return url
    }

    return `${MEDIA_BASE_ORIGIN}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
  } catch {
    return url
  }
}

export async function POST(
  req: MedusaRequest<CreateCategoryImagesInput>,
  res: MedusaResponse
): Promise<void> {
  const { category_id } = req.params
  const { images } = req.validatedBody

  // Add category_id to each image
  const category_images = images.map((image) => ({
    ...image,
    category_id,
  }))

  const { result } = await createCategoryImagesWorkflow(req.scope).run({
    input: {
      category_images,
    },
  })

  res.status(200).json({ category_images: result })
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { category_id } = req.params
  const query = req.scope.resolve("query")

  const { data: categoryImages } = await query.graph({
    entity: "product_category_image",
    fields: ["*"],
    filters: {
      category_id,
    },
  })

  res.status(200).json({
    category_images: categoryImages.map((image) => ({
      ...image,
      url: normalizeMediaUrl(image.url),
    })),
  })
}
