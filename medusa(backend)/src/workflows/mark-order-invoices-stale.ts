import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { markOrderInvoicesStaleStep } from "./steps/mark-order-invoices-stale"

export type MarkOrderInvoicesStaleInput = {
  order_id: string
}

export const markOrderInvoicesStaleWorkflow = createWorkflow(
  "mark-order-invoices-stale-workflow",
  (input: MarkOrderInvoicesStaleInput) => {
    const result = markOrderInvoicesStaleStep({
      order_id: input.order_id,
    })

    return new WorkflowResponse(result)
  }
)
