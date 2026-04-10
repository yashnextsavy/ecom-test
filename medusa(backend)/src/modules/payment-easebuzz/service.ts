import crypto from "crypto"
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import {
  AbstractPaymentProvider,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"

type EasebuzzOptions = {
  key: string
  salt: string
  env?: "test" | "production"
  paymentUrl?: string
  refundUrl?: string
  refundApiVersion?: "v1" | "v2"
  successUrl: string
  failureUrl: string
  productInfo?: string
}

type LoggerLike = {
  info?: (message: string) => void
  warn?: (message: string) => void
}

class EasebuzzPaymentProviderService extends AbstractPaymentProvider<EasebuzzOptions> {
  static identifier = "easebuzz"
  protected logger_: LoggerLike

  constructor(cradle: Record<string, unknown>, config: EasebuzzOptions) {
    super(cradle, config)
    this.logger_ = (cradle.logger as LoggerLike) || {}
    this.logRuntimeConfiguration()
  }

  static validateOptions(options: EasebuzzOptions): void {
    if (!options?.key?.trim()) {
      throw new Error("Easebuzz option `key` is required.")
    }
    if (!options?.salt?.trim()) {
      throw new Error("Easebuzz option `salt` is required.")
    }
    if (!options?.successUrl?.trim()) {
      throw new Error("Easebuzz option `successUrl` is required.")
    }
    if (!options?.failureUrl?.trim()) {
      throw new Error("Easebuzz option `failureUrl` is required.")
    }

    try {
      new URL(options.successUrl.trim())
      new URL(options.failureUrl.trim())
      if (options.refundUrl?.trim()) {
        new URL(options.refundUrl.trim())
      }
    } catch {
      throw new Error("Easebuzz callback URLs must be absolute URLs.")
    }
  }

  protected get options_(): EasebuzzOptions {
    return this.config
  }

  private toStringOrEmpty(value: unknown): string {
    return typeof value === "string" ? value.trim() : ""
  }

  private normalizeHashField(value: unknown): string {
    if (value === undefined || value === null) {
      return ""
    }
    return String(value).trim()
  }

  private firstNonEmptyString(...values: unknown[]): string {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) {
        return value.trim()
      }
    }
    return ""
  }

  private getNestedString(record: Record<string, unknown>, ...path: string[]): string {
    let current: unknown = record

    for (const key of path) {
      if (!current || typeof current !== "object") {
        return ""
      }
      current = (current as Record<string, unknown>)[key]
    }

    return typeof current === "string" ? current.trim() : ""
  }

  private getAmountString(amount: unknown): string {
    if (typeof amount === "number" || typeof amount === "string") {
      return Number(amount).toFixed(2)
    }

    if (amount && typeof amount === "object") {
      const candidate =
        (amount as Record<string, unknown>).numeric ??
        (amount as Record<string, unknown>).value ??
        (amount as Record<string, unknown>).raw ??
        (amount as Record<string, unknown>).amount

      if (typeof candidate === "number" || typeof candidate === "string") {
        return Number(candidate).toFixed(2)
      }
    }

    return "0.00"
  }

  private sanitizeIdempotencyToken(value: string): string {
    let out = ""

    for (const ch of value.toLowerCase()) {
      if ((ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9") || ch === "_" || ch === "-") {
        out += ch
      } else {
        out += "_"
      }
    }

    out = out.replace(/^_+|_+$/g, "").replace(/_+/g, "_")
    return out.slice(0, 128)
  }

  private buildCompletionIdempotencyKey(cartId: string, sessionId: string, provided?: string): string {
    const explicit = this.sanitizeIdempotencyToken(provided || "")
    if (explicit) {
      return explicit
    }

    const safeCartId = this.sanitizeIdempotencyToken(cartId).slice(0, 64) || "cart"
    const safeAttemptId = this.sanitizeIdempotencyToken(sessionId).slice(0, 64) || "attempt"
    return `complete_${safeCartId}_${safeAttemptId}`.slice(0, 128)
  }

  private extractStatus(data: Record<string, unknown>): string {
    const nestedData =
      data.data && typeof data.data === "object"
        ? (data.data as Record<string, unknown>)
        : undefined
    const nestedPayload =
      data.payload && typeof data.payload === "object"
        ? (data.payload as Record<string, unknown>)
        : undefined

    const status = this.firstNonEmptyString(
      data.status,
      data.tx_status,
      data.payment_status,
      data.result,
      data.easebuzz_status,
      nestedData?.status,
      nestedData?.tx_status,
      nestedData?.payment_status,
      nestedData?.result,
      nestedData?.easebuzz_status,
      nestedPayload?.status,
      nestedPayload?.tx_status,
      nestedPayload?.payment_status,
      nestedPayload?.result,
      nestedPayload?.easebuzz_status
    )

    return status || "pending"
  }

  private normalizeStatus(status: string | undefined): PaymentSessionStatus {
    const normalized = (status ?? "").toLowerCase()

    // Easebuzz marks completed payments as "success"/"successful".
    // These should be treated as captured to avoid manual capture on orders.
    if (
      normalized === "success" ||
      normalized === "successful" ||
      normalized === "captured"
    ) {
      return PaymentSessionStatus.CAPTURED
    }

    if (normalized === "authorized") {
      return PaymentSessionStatus.AUTHORIZED
    }

    if (normalized === "pending") {
      return PaymentSessionStatus.PENDING
    }

    if (normalized === "requires_more") {
      return PaymentSessionStatus.REQUIRES_MORE
    }

    if (normalized === "usercancelled" || normalized === "cancelled") {
      return PaymentSessionStatus.CANCELED
    }

    if (normalized === "failed" || normalized === "error") {
      return PaymentSessionStatus.ERROR
    }

    return PaymentSessionStatus.PENDING
  }

  private buildHash(input: {
    key: string
    txnid: string
    amount: string
    productinfo: string
    firstname: string
    email: string
    udf1: string
    udf2: string
    udf3: string
    udf4: string
    udf5: string
    salt: string
  }): string {
    const raw = [
      this.normalizeHashField(input.key),
      this.normalizeHashField(input.txnid),
      this.normalizeHashField(input.amount),
      this.normalizeHashField(input.productinfo),
      this.normalizeHashField(input.firstname),
      this.normalizeHashField(input.email),
      this.normalizeHashField(input.udf1),
      this.normalizeHashField(input.udf2),
      this.normalizeHashField(input.udf3),
      this.normalizeHashField(input.udf4),
      this.normalizeHashField(input.udf5),
      "",
      "",
      "",
      "",
      "",
      this.normalizeHashField(input.salt),
    ].join("|")

    return crypto.createHash("sha512").update(raw).digest("hex")
  }

  private getGatewayUrl(): string {
    if (this.options_.paymentUrl?.trim()) {
      return this.options_.paymentUrl.trim()
    }

    return this.options_.env === "production"
      ? "https://pay.easebuzz.in/pay/secure"
      : "https://testpay.easebuzz.in/pay/secure"
  }

  private getRefundUrl(): string {
    if (this.options_.refundUrl?.trim()) {
      return this.options_.refundUrl.trim()
    }

    const apiVersion = this.options_.refundApiVersion === "v1" ? "v1" : "v2"

    if (apiVersion === "v2") {
      return this.options_.env === "production"
        ? "https://dashboard.easebuzz.in/transaction/v2/refund"
        : "https://testdashboard.easebuzz.in/transaction/v2/refund"
    }

    return this.options_.env === "production"
      ? "https://pay.easebuzz.in/transaction/v1/refund"
      : "https://testpay.easebuzz.in/transaction/v1/refund"
  }

  private buildRefundHash(input: {
    key: string
    txnid: string
    amount: string
    refund_amount: string
    refund_request_id: string
    email: string
    phone: string
    salt: string
  }): string {
    const raw = [
      this.normalizeHashField(input.key),
      this.normalizeHashField(input.txnid),
      this.normalizeHashField(input.amount),
      this.normalizeHashField(input.refund_amount),
      this.normalizeHashField(input.refund_request_id),
      this.normalizeHashField(input.email),
      this.normalizeHashField(input.phone),
      this.normalizeHashField(input.salt),
    ].join("|")

    return crypto.createHash("sha512").update(raw).digest("hex")
  }

  private buildRefundHashV2(input: {
    key: string
    merchant_refund_id: string
    easebuzz_id: string
    refund_amount: string
    salt: string
  }): string {
    const raw = [
      this.normalizeHashField(input.key),
      this.normalizeHashField(input.merchant_refund_id),
      this.normalizeHashField(input.easebuzz_id),
      this.normalizeHashField(input.refund_amount),
      this.normalizeHashField(input.salt),
    ].join("|")

    return crypto.createHash("sha512").update(raw).digest("hex")
  }

  private getRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  }

  private getPaymentDataRecord(data: Record<string, unknown>): Record<string, unknown> {
    return this.getRecord(data.data)
  }

  private getPayloadRecord(data: Record<string, unknown>): Record<string, unknown> {
    return this.getRecord(data.payload)
  }

  private parseGatewayResponse(text: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(text)
      return this.getRecord(parsed)
    } catch {
      return { raw_response: text }
    }
  }

  private isRefundSuccess(response: Record<string, unknown>): boolean {
    const statusCandidate = this.firstNonEmptyString(
      response.status,
      response.result,
      response.msg,
      response.message,
      this.getNestedString(response, "data", "status"),
      this.getNestedString(response, "data", "result"),
      this.getNestedString(response, "data", "msg"),
      this.getNestedString(response, "data", "message")
    )
    const normalizedStatus = statusCandidate.toLowerCase()

    if (
      ["success", "successful", "ok", "true", "1", "refund request initiated successfully"].includes(
        normalizedStatus
      )
    ) {
      return true
    }

    const statusNumber = Number(response.status)
    if (Number.isFinite(statusNumber) && statusNumber === 1) {
      return true
    }

    const successFlag = response.success
    if (typeof successFlag === "boolean" && successFlag) {
      return true
    }

    const errorMessage = this.firstNonEmptyString(
      response.error,
      response.message,
      this.getNestedString(response, "data", "error"),
      this.getNestedString(response, "data", "message")
    )

    if (errorMessage) {
      return false
    }

    const refundId = this.firstNonEmptyString(
      response.refund_request_id,
      response.refund_id,
      response.request_id,
      this.getNestedString(response, "data", "refund_request_id"),
      this.getNestedString(response, "data", "refund_id"),
      this.getNestedString(response, "data", "request_id")
    )

    return Boolean(refundId)
  }

  private logRuntimeConfiguration(): void {
    const env = this.options_.env ?? "test"
    const refundApiVersion = this.options_.refundApiVersion === "v1" ? "v1" : "v2"
    const key = this.options_.key ? `${this.options_.key.slice(0, 2)}***` : "missing"
    this.logger_.info?.(
      `[Easebuzz] Provider initialized. env=${env}, refund_api=${refundApiVersion}, key=${key}`
    )
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const data = (input.data ?? {}) as Record<string, unknown>
    const context = input.context ?? {}
    const customer = context.customer

    const txnid = `txn_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`
    const amount = this.getAmountString(input.amount)
    const firstname = this.firstNonEmptyString(
      data.firstname,
      data.first_name,
      customer?.first_name,
      "Customer"
    )
    const email = this.firstNonEmptyString(
      data.email,
      data.customer_email,
      customer?.email,
      this.getNestedString(data, "cart", "email")
    )
    const phone = this.firstNonEmptyString(
      data.phone,
      data.customer_phone,
      customer?.phone
    )
    const productinfo =
      this.firstNonEmptyString(data.productinfo, this.options_.productInfo) ||
      "Order Payment"

    const sessionId =
      this.firstNonEmptyString(
        data.session_id,
        data.payment_session_id,
        data.id
      ) || ""
    const cartId = this.firstNonEmptyString(
      data.udf5,
      data.cart_id,
      data.cartId,
      this.getNestedString(data, "cart", "id")
    )

    if (!email) {
      throw new Error("Easebuzz requires customer email.")
    }

    if (!phone) {
      throw new Error("Easebuzz requires customer phone.")
    }

    if (!sessionId) {
      throw new Error(
        "Easebuzz requires payment session id. Pass `session_id` or `payment_session_id`."
      )
    }

    if (!cartId) {
      throw new Error(
        "Easebuzz requires cart id for callback mapping. Pass `udf5`, `cart_id`, or `cartId`."
      )
    }

    const completionIdempotencyKey = this.buildCompletionIdempotencyKey(
      cartId,
      sessionId,
      this.firstNonEmptyString(
        data.udf2,
        data.idempotency_key,
        data.completion_idempotency_key
      )
    )

    const paymentFields = {
      key: this.options_.key.trim(),
      txnid,
      amount,
      productinfo: productinfo.trim(),
      firstname,
      email,
      phone,
      surl: this.options_.successUrl.trim(),
      furl: this.options_.failureUrl.trim(),
      udf1: sessionId,
      udf2: completionIdempotencyKey,
      udf3: "",
      udf4: "",
      udf5: cartId,
    }

    const hash = this.buildHash({
      ...paymentFields,
      salt: this.options_.salt.trim(),
    })

    return {
      id: txnid,
      status: PaymentSessionStatus.REQUIRES_MORE,
      data: {
        ...data,
        session_id: sessionId,
        payment_session_id: sessionId,
        completion_idempotency_key: completionIdempotencyKey,
        easebuzz_txnid: txnid,
        easebuzz_status: "initiated",
        payment_url: this.getGatewayUrl(),
        payment_method: "POST",
        payment_fields: {
          ...paymentFields,
          hash,
        },
      },
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const incomingData = (input.data ?? {}) as Record<string, unknown>
    const rawStatus = this.extractStatus(incomingData)
    const status = this.normalizeStatus(rawStatus)

    const sessionId = this.firstNonEmptyString(
      incomingData.udf1,
      incomingData.session_id,
      incomingData.payment_session_id,
      this.getNestedString(incomingData, "data", "udf1"),
      this.getNestedString(incomingData, "payload", "udf1")
    )
    const cartId = this.firstNonEmptyString(
      incomingData.udf5,
      incomingData.cart_id,
      incomingData.cartId,
      this.getNestedString(incomingData, "data", "udf5"),
      this.getNestedString(incomingData, "payload", "udf5")
    )

    const data: Record<string, unknown> = {
      ...incomingData,
      status: rawStatus,
      easebuzz_status: rawStatus,
    }

    if (sessionId) {
      data.udf1 = sessionId
      data.session_id = sessionId
      data.payment_session_id = sessionId
    }

    if (cartId) {
      data.udf5 = cartId
      if (!this.firstNonEmptyString(data.cart_id)) {
        data.cart_id = cartId
      }
    }

    return {
      data,
      status,
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = (input.data ?? {}) as Record<string, unknown>
    const status = this.normalizeStatus(this.extractStatus(data))

    return {
      data,
      status,
    }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const data = (input.data ?? {}) as Record<string, unknown>
    const status = this.normalizeStatus(this.extractStatus(data))

    return {
      status,
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const data = (input.data ?? {}) as Record<string, unknown>

    return {
      data: {
        ...data,
        status: "captured",
        tx_status: this.firstNonEmptyString(data.tx_status, "success"),
        payment_status: this.firstNonEmptyString(data.payment_status, "success"),
        easebuzz_status: "captured",
      },
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const data = (input.data ?? {}) as Record<string, unknown>
    const nestedData = this.getPaymentDataRecord(data)
    const nestedPayload = this.getPayloadRecord(data)
    const refundApiVersion = this.options_.refundApiVersion === "v1" ? "v1" : "v2"

    const txnid = this.firstNonEmptyString(
      data.txnid,
      data.easebuzz_txnid,
      data.transaction_id,
      nestedData.txnid,
      nestedData.easebuzz_txnid,
      nestedData.transaction_id,
      nestedPayload.txnid,
      nestedPayload.easebuzz_txnid,
      nestedPayload.transaction_id
    )

    if (!txnid) {
      throw new Error("Easebuzz refund failed: missing transaction id (txnid).")
    }

    const originalAmount = this.firstNonEmptyString(
      this.getAmountString(
        this.firstNonEmptyString(
          data.amount,
          nestedData.amount,
          nestedPayload.amount
        ) || 0
      ),
      this.getAmountString(input.amount)
    )
    const refundAmount = this.getAmountString(input.amount)

    const email = this.firstNonEmptyString(
      data.email,
      data.customer_email,
      nestedData.email,
      nestedPayload.email,
      input.context?.customer?.email
    )
    const phone = this.firstNonEmptyString(
      data.phone,
      data.customer_phone,
      nestedData.phone,
      nestedPayload.phone,
      input.context?.customer?.phone
    )

    if (!email) {
      throw new Error("Easebuzz refund failed: missing customer email.")
    }

    if (!phone) {
      throw new Error("Easebuzz refund failed: missing customer phone.")
    }

    const refundRequestId = `rfnd_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`
    const key = this.options_.key.trim()
    const salt = this.options_.salt.trim()
    const refundUrl = this.getRefundUrl()

    let response: Response
    if (refundApiVersion === "v2") {
      const easebuzzId = this.firstNonEmptyString(
        data.easebuzz_id,
        data.easepayid,
        nestedData.easebuzz_id,
        nestedData.easepayid,
        nestedPayload.easebuzz_id,
        nestedPayload.easepayid
      )

      if (!easebuzzId) {
        throw new Error(
          "Easebuzz refund failed: missing easebuzz_id/easepayid required for refund v2."
        )
      }

      const hash = this.buildRefundHashV2({
        key,
        merchant_refund_id: refundRequestId,
        easebuzz_id: easebuzzId,
        refund_amount: refundAmount,
        salt,
      })

      const v2Payload = {
        key,
        merchant_refund_id: refundRequestId,
        easebuzz_id: easebuzzId,
        refund_amount: Number(refundAmount),
        hash,
      }

      response = await fetch(refundUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify(v2Payload),
      })
    } else {
      const hash = this.buildRefundHash({
        key,
        txnid,
        amount: originalAmount,
        refund_amount: refundAmount,
        refund_request_id: refundRequestId,
        email,
        phone,
        salt,
      })

      const requestBody = new URLSearchParams({
        key,
        txnid,
        amount: originalAmount,
        refund_amount: refundAmount,
        refund_request_id: refundRequestId,
        email,
        phone,
        hash,
      })

      response = await fetch(refundUrl, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: requestBody.toString(),
      })
    }

    const rawResponse = await response.text()
    const parsedResponse = this.parseGatewayResponse(rawResponse)
    this.logger_.info?.(
      `[Easebuzz] Refund response received. api=${refundApiVersion}, url=${refundUrl}, txnid=${txnid}, request_id=${refundRequestId}, http=${response.status}, body=${rawResponse}`
    )

    if (!response.ok || !this.isRefundSuccess(parsedResponse)) {
      const gatewayMessage = this.firstNonEmptyString(
        parsedResponse.error,
        parsedResponse.message,
        parsedResponse.msg,
        this.getNestedString(parsedResponse, "data", "error"),
        this.getNestedString(parsedResponse, "data", "message"),
        this.getNestedString(parsedResponse, "data", "msg")
      )
      const statusInfo = `HTTP ${response.status}`
      throw new Error(
        `Easebuzz refund failed (${statusInfo})${gatewayMessage ? `: ${gatewayMessage}` : "."}`
      )
    }

    return {
      data: {
        ...data,
        status: "refunded",
        easebuzz_status: "refunded",
        refund_status: "success",
        refund_request_id: refundRequestId,
        refund_amount: refundAmount,
        refund_response: parsedResponse,
      },
    }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const data = (input.data ?? {}) as Record<string, unknown>
    return { data }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const data = (input.data ?? {}) as Record<string, unknown>
    return { data }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    const data = (input.data ?? {}) as Record<string, unknown>
    return { data }
  }

  async getWebhookActionAndData(
    _data: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    return { action: "not_supported" }
  }
}

export default EasebuzzPaymentProviderService
