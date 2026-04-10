import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"

const HIDE_MARKER_ATTR = "data-hide-copy-payment-link-applied"

const hideCopyPaymentLinkButtons = () => {
  const clickableNodes = Array.from(
    document.querySelectorAll("button, [role='button']")
  ) as HTMLElement[]

  for (const node of clickableNodes) {
    const label = (node.textContent || "").trim().toLowerCase()
    if (!label.startsWith("copy payment link")) {
      continue
    }

    if (!node.getAttribute(HIDE_MARKER_ATTR)) {
      node.style.display = "none"
      node.setAttribute(HIDE_MARKER_ATTR, "true")
    }
  }
}

const OrderHideCopyPaymentLinkWidget = () => {
  useEffect(() => {
    hideCopyPaymentLinkButtons()

    const observer = new MutationObserver(() => {
      hideCopyPaymentLinkButtons()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [])

  return null
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderHideCopyPaymentLinkWidget
