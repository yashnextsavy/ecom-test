import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

export default async function productCategoryCreated({
  event,
}: SubscriberArgs<{ id: string }>) {
  await fetch("http://localhost:3000/api/medusa/category-sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MEDUSA_WEBHOOK_TOKEN}`,
    },
    body: JSON.stringify({
      data: { id: event.data.id },
      event: event.name,
    }),
  })
}

export const config: SubscriberConfig = {
  event: "product-category.created", // check your exact event name in your Medusa version
}
