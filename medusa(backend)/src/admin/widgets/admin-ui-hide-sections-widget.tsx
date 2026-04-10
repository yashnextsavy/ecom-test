import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"

const HIDE_CLASS = "hide-product-media-card"
const HIDE_CARD_HEADINGS = new Set([
  "Media",
  "Options",
  "Variants",
])
const HIDE_ATTRIBUTE_LABELS = new Set([
  "Height",
  "Width",
  "Length",
  "Weight",
])

const hideCardsByHeading = () => {
  const headings = Array.from(
    document.querySelectorAll("h2")
  ) as HTMLHeadingElement[]

  for (const h of headings) {
    const headingText = h.textContent?.trim() || ""
    if (!HIDE_CARD_HEADINGS.has(headingText)) continue

    const card = h.closest("div.shadow-elevation-card-rest")
    if (card && !card.classList.contains(HIDE_CLASS)) {
      card.classList.add(HIDE_CLASS)
      ;(card as HTMLElement).style.display = "none"
    }
  }
}

const hideAttributeRows = () => {
  const headings = Array.from(
    document.querySelectorAll("h2")
  ) as HTMLHeadingElement[]

  for (const h of headings) {
    if (h.textContent?.trim() !== "Attributes") continue

    const card = h.closest("div.shadow-elevation-card-rest")
    if (!card) continue

    const rows = Array.from(
      card.querySelectorAll("div.grid.w-full.grid-cols-2")
    ) as HTMLDivElement[]

    for (const row of rows) {
      const label = row.querySelector("p")
      const text = label?.textContent?.trim() || ""
      if (HIDE_ATTRIBUTE_LABELS.has(text)) {
        ;(row as HTMLElement).style.display = "none"
      }
    }
  }
}

const AdminUiHideSectionsWidget = () => {
  useEffect(() => {
    hideCardsByHeading()
    hideAttributeRows()

    const observer = new MutationObserver(() => {
      hideCardsByHeading()
      hideAttributeRows()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export default AdminUiHideSectionsWidget
