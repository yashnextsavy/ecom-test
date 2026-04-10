import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Copy, Heading, Text, toast } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useParams } from "react-router-dom"

type OrderResponse = {
  order?: {
    id?: string
    display_id?: string | number | null
    created_at?: string | null
    payment_status?: string | null
    transaction_id?: string
    payment_mode?: string
    bank_ref?: string
    refund_id?: string
  }
}

const isPaidStatus = (value: string | null | undefined): boolean => {
  const normalized = String(value || "").trim().toLowerCase()
  return normalized === "paid" || normalized === "captured"
}

const buildInvoiceId = (
  displayId: string | number | null | undefined,
  orderId: string | undefined,
  createdAt: string | null | undefined
): string => {
  const rawOrderNumber = String(displayId ?? orderId ?? "")
    .replace(/[^0-9A-Za-z]/g, "")
    .trim()

  if (!rawOrderNumber) {
    return "Not available"
  }

  const createdDate = createdAt ? new Date(createdAt) : new Date()
  const createdAtMs = createdDate.getTime()
  const safeDate = Number.isFinite(createdAtMs) ? createdDate : new Date()
  const createdYear = safeDate.getFullYear()
  const createdMonth = safeDate.getMonth()
  const fyStartYear = createdMonth >= 3 ? createdYear : createdYear - 1
  const fyEndYearShort = String((fyStartYear + 1) % 100).padStart(2, "0")
  const numericOrderNumber = rawOrderNumber.replace(/[^0-9]/g, "")
  const orderSegment = (numericOrderNumber || rawOrderNumber).slice(-6).padStart(6, "0")

  return `GIS/${fyStartYear}-${fyEndYearShort}/${orderSegment}`
}

const OrderTransactionIdWidget = () => {
  const { id } = useParams() as { id?: string }
  const [downloading, setDownloading] = useState(false)
  const [downloadingInvoice, setDownloadingInvoice] = useState(false)
  const [downloadingRefund, setDownloadingRefund] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-order-transaction-id", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await fetch(`/admin/orders/${id}`)
      if (!res.ok) {
        throw new Error("Failed to load order")
      }

      return (await res.json()) as OrderResponse
    },
  })

  if (!id) {
    return null
  }

  const transactionId = data?.order?.transaction_id
  const invoiceId = buildInvoiceId(
    data?.order?.display_id,
    data?.order?.id,
    data?.order?.created_at
  )
  const paymentMode = data?.order?.payment_mode
  const paymentStatus = data?.order?.payment_status
  const canGenerateDocs = isPaidStatus(paymentStatus)
  const bankRef = data?.order?.bank_ref
  const refundId = data?.order?.refund_id

  const handleDownloadReceipt = async () => {
    if (!id || downloading) {
      return
    }

    setDownloading(true)
    try {
      const response = await fetch(
        `/admin/orders/${id}/receipt?receipt_label=${encodeURIComponent("Payment Receipt")}`
      )
      if (!response.ok) {
        throw new Error("Failed to generate receipt")
      }

      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = `order-receipt-${id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download receipt"
      toast.error(message)
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadRefundReceipt = async () => {
    if (!id || downloadingRefund || !refundId) {
      return
    }

    setDownloadingRefund(true)
    try {
      const response = await fetch(
        `/admin/orders/${id}/receipt?receipt_label=${encodeURIComponent(
          "Payment Refund Receipt"
        )}`
      )
      if (!response.ok) {
        throw new Error("Failed to generate refund receipt")
      }

      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = `refund-receipt-${id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to download refund receipt"
      toast.error(message)
    } finally {
      setDownloadingRefund(false)
    }
  }

  const handleDownloadInvoice = async () => {
    if (!id || downloadingInvoice) {
      return
    }

    setDownloadingInvoice(true)
    try {
      const response = await fetch(`/admin/orders/${id}/invoice?force_regenerate=true`)
      if (!response.ok) {
        throw new Error("Failed to generate invoice")
      }

      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = `tax-invoice-${id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download invoice"
      toast.error(message)
    } finally {
      setDownloadingInvoice(false)
    }
  }

  return (
    <Container className="p-0 overflow-hidden">
      <div className="px-6 py-4">
        <Heading level="h3">Payment Details</Heading>
      </div>

      <div className="border-t border-ui-border-base bg-ui-bg-subtle px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          Downloads
        </Text>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button
            variant="secondary"
            size="small"
            className="w-full justify-center"
            isLoading={downloading}
            disabled={downloading || !canGenerateDocs}
            onClick={handleDownloadReceipt}
          >
            Download Receipt
          </Button>
          <Button
            variant="secondary"
            size="small"
            className="w-full justify-center"
            isLoading={downloadingInvoice}
            disabled={downloadingInvoice || !canGenerateDocs}
            onClick={handleDownloadInvoice}
          >
            Download Invoice
          </Button>
          <Button
            variant="secondary"
            size="small"
            className="w-full justify-center"
            isLoading={downloadingRefund}
            disabled={downloadingRefund || !refundId}
            onClick={handleDownloadRefundReceipt}
          >
            Download Refund Receipt
          </Button>
        </div>
      </div>

      <div className="border-t border-ui-border-base px-6 py-4">
        <div className="grid grid-cols-[130px_minmax(0,1fr)_auto] items-start gap-x-4">
          <Text size="small" className="text-ui-fg-subtle">
            Invoice ID
          </Text>
          <Text
            size="small"
            className="truncate font-mono"
            title={isLoading ? "Loading..." : invoiceId}
          >
            {isLoading ? "Loading..." : invoiceId}
          </Text>
          <div className="pt-0.5">
            {!isLoading && invoiceId !== "Not available" ? (
              <Copy content={invoiceId} className="text-ui-fg-muted" />
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-ui-border-base px-6 py-4">
        <div className="grid grid-cols-[130px_minmax(0,1fr)_auto] items-start gap-x-4">
          <Text size="small" className="text-ui-fg-subtle">
            Transaction ID
          </Text>
          <Text
            size="small"
            className="truncate font-mono"
            title={isLoading ? "Loading..." : transactionId || "Not available"}
          >
            {isLoading ? "Loading..." : transactionId || "Not available"}
          </Text>
          <div className="pt-0.5">
            {!isLoading && transactionId ? (
              <Copy content={transactionId} className="text-ui-fg-muted" />
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-ui-border-base px-6 py-4">
        <div className="grid grid-cols-[130px_minmax(0,1fr)] items-start gap-x-4">
          <Text size="small" className="text-ui-fg-subtle">
            Payment Mode
          </Text>
          <Text size="small">
            {isLoading ? "Loading..." : paymentMode || "Not available"}
          </Text>
        </div>
      </div>

      <div className="border-t border-ui-border-base px-6 py-4">
        <div className="grid grid-cols-[130px_minmax(0,1fr)_auto] items-start gap-x-4">
          <Text size="small" className="text-ui-fg-subtle">
            Bank Ref
          </Text>
          <Text
            size="small"
            className="truncate font-mono"
            title={isLoading ? "Loading..." : bankRef || "Not available"}
          >
            {isLoading ? "Loading..." : bankRef || "Not available"}
          </Text>
          <div className="pt-0.5">
            {!isLoading && bankRef ? (
              <Copy content={bankRef} className="text-ui-fg-muted" />
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-ui-border-base px-6 py-4">
        <div className="grid grid-cols-[130px_minmax(0,1fr)_auto] items-start gap-x-4">
          <Text size="small" className="text-ui-fg-subtle">
            Refund ID
          </Text>
          <Text
            size="small"
            className="truncate font-mono"
            title={isLoading ? "Loading..." : refundId || "Not available"}
          >
            {isLoading ? "Loading..." : refundId || "Not available"}
          </Text>
          <div className="pt-0.5">
            {!isLoading && refundId ? (
              <Copy content={refundId} className="text-ui-fg-muted" />
            ) : null}
          </div>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderTransactionIdWidget
