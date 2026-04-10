import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ListTree } from "@medusajs/icons"
import { Button, Container, Heading, Input, Label, Text, Textarea, toast } from "@medusajs/ui"
import { useEffect, useRef, useState } from "react"
import { sdk } from "../../lib/sdk"

type InvoiceConfig = {
  id?: string
  company_name?: string
  company_address?: string
  company_phone?: string
  company_email?: string
  company_logo?: string
  secondary_logo?: string
  gstin?: string
  notes?: string
  copyright_text?: string
}

const EMPTY_FORM: InvoiceConfig = {
  company_name: "",
  company_address: "",
  company_phone: "",
  company_email: "",
  company_logo: "",
  secondary_logo: "",
  gstin: "",
  notes: "",
  copyright_text: "",
}

const InvoiceConfigPage = () => {
  const [form, setForm] = useState<InvoiceConfig>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingSecondaryLogo, setUploadingSecondaryLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const secondaryLogoInputRef = useRef<HTMLInputElement>(null)

  const loadConfig = async () => {
    setLoading(true)
    try {
      const { invoice_config } = await sdk.client.fetch<{ invoice_config: InvoiceConfig }>(
        "/admin/invoice-config"
      )
      setForm({
        ...EMPTY_FORM,
        ...(invoice_config || {}),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load invoice config"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const setField = <K extends keyof InvoiceConfig>(key: K, value: InvoiceConfig[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const logoValue = form.company_logo?.trim() || ""
      const secondaryLogoValue = form.secondary_logo?.trim() || ""
      if (logoValue.startsWith("data:image/")) {
        throw new Error("Base64 logos are not supported. Please upload an image or use a logo URL.")
      }
      if (secondaryLogoValue.startsWith("data:image/")) {
        throw new Error("Base64 logos are not supported. Please upload an image or use a logo URL.")
      }

      const payload: Record<string, string> = {
        company_name: form.company_name?.trim() || "",
        company_address: form.company_address?.trim() || "",
        company_phone: form.company_phone?.trim() || "",
        company_email: form.company_email?.trim() || "",
        gstin: form.gstin?.trim() || "",
        notes: form.notes?.trim() || "",
        copyright_text: form.copyright_text?.trim() || "",
        company_logo: logoValue,
        secondary_logo: secondaryLogoValue,
      }

      await sdk.client.fetch("/admin/invoice-config", {
        method: "post",
        body: payload,
      })
      toast.success("Invoice configuration saved")
      await loadConfig()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save invoice config"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoFileSelect = async (file: File | null) => {
    if (!file) {
      return
    }

    setUploadingLogo(true)
    try {
      const response = await sdk.admin.upload.create({ files: [file] })
      const uploaded = Array.isArray((response as any)?.files)
        ? (response as any).files[0]
        : null
      const url =
        (uploaded && typeof uploaded.url === "string" && uploaded.url) ||
        (uploaded && typeof uploaded.public_url === "string" && uploaded.public_url) ||
        ""

      if (!url) {
        throw new Error("Upload succeeded but no file URL was returned")
      }

      setField("company_logo", url)
      toast.success("Logo uploaded")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload logo"
      toast.error(message)
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) {
        logoInputRef.current.value = ""
      }
    }
  }

  const handleSecondaryLogoFileSelect = async (file: File | null) => {
    if (!file) {
      return
    }

    setUploadingSecondaryLogo(true)
    try {
      const response = await sdk.admin.upload.create({ files: [file] })
      const uploaded = Array.isArray((response as any)?.files)
        ? (response as any).files[0]
        : null
      const url =
        (uploaded && typeof uploaded.url === "string" && uploaded.url) ||
        (uploaded && typeof uploaded.public_url === "string" && uploaded.public_url) ||
        ""

      if (!url) {
        throw new Error("Upload succeeded but no file URL was returned")
      }

      setField("secondary_logo", url)
      toast.success("Secondary logo uploaded")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload secondary logo"
      toast.error(message)
    } finally {
      setUploadingSecondaryLogo(false)
      if (secondaryLogoInputRef.current) {
        secondaryLogoInputRef.current.value = ""
      }
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Invoice Configuration</Heading>
        <Text className="text-ui-fg-subtle txt-small mt-1">
          Configure seller and GST details used in generated tax invoices.
        </Text>
      </div>

      <div className="px-6 py-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input
              value={form.company_name || ""}
              onChange={(e) => setField("company_name", e.target.value)}
              disabled={loading || saving}
              placeholder="Global IT Success"
            />
          </div>
          <div className="space-y-2">
            <Label>GSTIN</Label>
            <Input
              value={form.gstin || ""}
              onChange={(e) => setField("gstin", e.target.value)}
              disabled={loading || saving}
              placeholder="22AAAAA0000A1Z5"
            />
          </div>
          <div className="space-y-2">
            <Label>Company Phone</Label>
            <Input
              value={form.company_phone || ""}
              onChange={(e) => setField("company_phone", e.target.value)}
              disabled={loading || saving}
              placeholder="+91 99999 99999"
            />
          </div>
          <div className="space-y-2">
            <Label>Company Email</Label>
            <Input
              value={form.company_email || ""}
              onChange={(e) => setField("company_email", e.target.value)}
              disabled={loading || saving}
              placeholder="support@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Company Address</Label>
          <Textarea
            value={form.company_address || ""}
            onChange={(e) => setField("company_address", e.target.value)}
            disabled={loading || saving}
            rows={3}
            placeholder="Full company address"
          />
        </div>

        <div className="space-y-2">
          <Label>Company Logo (URL)</Label>
          <div className="flex items-center gap-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                handleLogoFileSelect(file)
              }}
              disabled={loading || saving || uploadingLogo}
            />
            <Button
              type="button"
              variant="secondary"
              size="small"
              isLoading={uploadingLogo}
              disabled={loading || saving || uploadingLogo}
              onClick={() => logoInputRef.current?.click()}
            >
              Upload Logo
            </Button>
          </div>
          <Textarea
            value={form.company_logo || ""}
            onChange={(e) => setField("company_logo", e.target.value)}
            disabled={loading || saving}
            rows={3}
            placeholder="https://example.com/logo.png"
          />
          {form.company_logo ? (
            <img
              src={form.company_logo}
              alt="Company logo preview"
              className="h-10 w-auto rounded border border-ui-border-base bg-white p-1"
            />
          ) : null}
          <Text className="text-ui-fg-subtle txt-small">
            Recommended logo size: 120 x 44 px (or similar ratio) for best PDF alignment.
          </Text>
        </div>

        <div className="space-y-2">
          <Label>Secondary Logo (URL)</Label>
          <div className="flex items-center gap-2">
            <input
              ref={secondaryLogoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                handleSecondaryLogoFileSelect(file)
              }}
              disabled={loading || saving || uploadingSecondaryLogo}
            />
            <Button
              type="button"
              variant="secondary"
              size="small"
              isLoading={uploadingSecondaryLogo}
              disabled={loading || saving || uploadingSecondaryLogo}
              onClick={() => secondaryLogoInputRef.current?.click()}
            >
              Upload Secondary Logo
            </Button>
          </div>
          <Textarea
            value={form.secondary_logo || ""}
            onChange={(e) => setField("secondary_logo", e.target.value)}
            disabled={loading || saving}
            rows={3}
            placeholder="https://example.com/secondary-logo.png"
          />
          {form.secondary_logo ? (
            <img
              src={form.secondary_logo}
              alt="Secondary logo preview"
              className="h-10 w-auto rounded border border-ui-border-base bg-white p-1"
            />
          ) : null}
          <Text className="text-ui-fg-subtle txt-small">
            Keep both logos close to 120 x 44 px to maintain a balanced header layout.
          </Text>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={form.notes || ""}
            onChange={(e) => setField("notes", e.target.value)}
            disabled={loading || saving}
            rows={3}
            placeholder="Optional notes to show on invoice"
          />
        </div>

        <div className="space-y-2">
          <Label>Copyright Text</Label>
          <Input
            value={form.copyright_text || ""}
            onChange={(e) => setField("copyright_text", e.target.value)}
            disabled={loading || saving}
            placeholder="© 2026 Global IT Success. All rights reserved."
          />
        </div>

        <div className="flex items-center justify-end">
          <Button isLoading={saving} disabled={loading || saving} onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Invoice Config",
  icon: ListTree,
  nested: "/orders",
})

export const handle = {
  breadcrumb: () => "Invoice Config",
}

export default InvoiceConfigPage
