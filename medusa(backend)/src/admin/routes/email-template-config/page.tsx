import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ListTree } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useEffect, useRef, useState } from "react"
import { sdk } from "../../lib/sdk"

type EmailTemplateConfig = {
  id?: string
  website_name?: string
  logo_url?: string
  support_email?: string
  contact_admin_email?: string
  order_admin_email?: string
  order_support_email?: string
  contact_url?: string
  whatsapp_url?: string
  call_url?: string
  about_url?: string
  terms_url?: string
  privacy_url?: string
  facebook_url?: string
  x_url?: string
  linkedin_url?: string
  instagram_url?: string
  social_facebook_icon?: string
  social_x_icon?: string
  social_linkedin_icon?: string
  social_instagram_icon?: string
  copyright_text?: string
}

const EMPTY_FORM: EmailTemplateConfig = {
  website_name: "",
  logo_url: "",
  support_email: "",
  contact_admin_email: "",
  order_admin_email: "",
  order_support_email: "",
  contact_url: "",
  whatsapp_url: "",
  call_url: "",
  about_url: "",
  terms_url: "",
  privacy_url: "",
  facebook_url: "",
  x_url: "",
  linkedin_url: "",
  instagram_url: "",
  social_facebook_icon: "",
  social_x_icon: "",
  social_linkedin_icon: "",
  social_instagram_icon: "",
  copyright_text: "",
}

const EmailTemplateConfigPage = () => {
  const [form, setForm] = useState<EmailTemplateConfig>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})

  const logoInputRef = useRef<HTMLInputElement>(null)
  const facebookIconRef = useRef<HTMLInputElement>(null)
  const xIconRef = useRef<HTMLInputElement>(null)
  const linkedinIconRef = useRef<HTMLInputElement>(null)
  const instagramIconRef = useRef<HTMLInputElement>(null)

  const loadConfig = async () => {
    setLoading(true)
    try {
      const { email_template_config } = await sdk.client.fetch<{
        email_template_config: EmailTemplateConfig
      }>("/admin/email-template-config")

      setForm({
        ...EMPTY_FORM,
        ...(email_template_config || {}),
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load email template config"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const setField = <K extends keyof EmailTemplateConfig>(
    key: K,
    value: EmailTemplateConfig[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const setUploadingField = (key: string, value: boolean) => {
    setUploading((prev) => ({ ...prev, [key]: value }))
  }

  const uploadToField = async (
    file: File | null,
    field: keyof EmailTemplateConfig,
    uploadKey: string,
    successLabel: string
  ) => {
    if (!file) {
      return
    }

    setUploadingField(uploadKey, true)
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

      setField(field, url)
      toast.success(`${successLabel} uploaded`)
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to upload ${successLabel}`
      toast.error(message)
    } finally {
      setUploadingField(uploadKey, false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supportEmail = form.support_email?.trim() || ""
      const adminEmail = form.contact_admin_email?.trim() || ""

      const payload: Record<string, string> = {
        website_name: form.website_name?.trim() || "",
        logo_url: form.logo_url?.trim() || "",
        support_email: supportEmail,
        order_support_email: supportEmail,
        contact_admin_email: adminEmail,
        order_admin_email: adminEmail,
        contact_url: form.contact_url?.trim() || "",
        whatsapp_url: form.whatsapp_url?.trim() || "",
        call_url: form.call_url?.trim() || "",
        about_url: form.about_url?.trim() || "",
        terms_url: form.terms_url?.trim() || "",
        privacy_url: form.privacy_url?.trim() || "",
        facebook_url: form.facebook_url?.trim() || "",
        x_url: form.x_url?.trim() || "",
        linkedin_url: form.linkedin_url?.trim() || "",
        instagram_url: form.instagram_url?.trim() || "",
        social_facebook_icon: form.social_facebook_icon?.trim() || "",
        social_x_icon: form.social_x_icon?.trim() || "",
        social_linkedin_icon: form.social_linkedin_icon?.trim() || "",
        social_instagram_icon: form.social_instagram_icon?.trim() || "",
        copyright_text: form.copyright_text?.trim() || "",
      }

      await sdk.client.fetch("/admin/email-template-config", {
        method: "post",
        body: payload,
      })

      toast.success("Email configuration saved")
      await loadConfig()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save email template config"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Email Configuration</Heading>
        <Text className="text-ui-fg-subtle txt-small mt-1">
          Manage email template branding, links, recipients, and social assets.
        </Text>
      </div>

      <div className="px-6 py-5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Website Name</Label>
            <Input
              value={form.website_name || ""}
              onChange={(e) => setField("website_name", e.target.value)}
              disabled={loading || saving}
              placeholder="Global IT Success"
            />
          </div>

          <div className="space-y-2">
            <Label>Support Email</Label>
            <Input
              value={form.support_email || ""}
              onChange={(e) => setField("support_email", e.target.value)}
              disabled={loading || saving}
              placeholder="support@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Admin Email</Label>
            <Input
              value={form.contact_admin_email || ""}
              onChange={(e) => setField("contact_admin_email", e.target.value)}
              disabled={loading || saving}
              placeholder="admin@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Logo URL</Label>
          <div className="flex items-center gap-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                uploadToField(file, "logo_url", "logo", "Logo")
                e.currentTarget.value = ""
              }}
              disabled={loading || saving || uploading.logo}
            />
            <Button
              type="button"
              size="small"
              variant="secondary"
              isLoading={Boolean(uploading.logo)}
              disabled={loading || saving || uploading.logo}
              onClick={() => logoInputRef.current?.click()}
            >
              Upload Logo
            </Button>
          </div>
          <Input
            value={form.logo_url || ""}
            onChange={(e) => setField("logo_url", e.target.value)}
            disabled={loading || saving}
            placeholder="https://example.com/logo.png"
          />
          {form.logo_url ? (
            <img
              src={form.logo_url}
              alt="Logo preview"
              className="h-10 w-auto rounded border border-ui-border-base bg-white p-1"
            />
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Contact Page URL</Label>
            <Input
              value={form.contact_url || ""}
              onChange={(e) => setField("contact_url", e.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp URL</Label>
            <Input
              value={form.whatsapp_url || ""}
              onChange={(e) => setField("whatsapp_url", e.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-2">
            <Label>Call URL</Label>
            <Input
              value={form.call_url || ""}
              onChange={(e) => setField("call_url", e.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-2">
            <Label>About URL</Label>
            <Input
              value={form.about_url || ""}
              onChange={(e) => setField("about_url", e.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-2">
            <Label>Terms URL</Label>
            <Input
              value={form.terms_url || ""}
              onChange={(e) => setField("terms_url", e.target.value)}
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-2">
            <Label>Privacy URL</Label>
            <Input
              value={form.privacy_url || ""}
              onChange={(e) => setField("privacy_url", e.target.value)}
              disabled={loading || saving}
            />
          </div>
        </div>

        <div className="border-t border-ui-border-base pt-5">
          <Heading level="h3">Social Media</Heading>
          <Text className="text-ui-fg-subtle txt-small mt-1 mb-4">
            Configure social profile URLs and upload icon images.
          </Text>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Facebook URL</Label>
              <Input
                value={form.facebook_url || ""}
                onChange={(e) => setField("facebook_url", e.target.value)}
                disabled={loading || saving}
              />
            </div>
            <div className="space-y-2">
              <Label>X URL</Label>
              <Input
                value={form.x_url || ""}
                onChange={(e) => setField("x_url", e.target.value)}
                disabled={loading || saving}
              />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input
                value={form.linkedin_url || ""}
                onChange={(e) => setField("linkedin_url", e.target.value)}
                disabled={loading || saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram URL</Label>
              <Input
                value={form.instagram_url || ""}
                onChange={(e) => setField("instagram_url", e.target.value)}
                disabled={loading || saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Facebook Icon URL</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={facebookIconRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    uploadToField(file, "social_facebook_icon", "facebook", "Facebook icon")
                    e.currentTarget.value = ""
                  }}
                  disabled={loading || saving || uploading.facebook}
                />
                <Button
                  type="button"
                  size="small"
                  variant="secondary"
                  isLoading={Boolean(uploading.facebook)}
                  disabled={loading || saving || uploading.facebook}
                  onClick={() => facebookIconRef.current?.click()}
                >
                  Upload Icon
                </Button>
              </div>
              <Input
                value={form.social_facebook_icon || ""}
                onChange={(e) => setField("social_facebook_icon", e.target.value)}
                disabled={loading || saving}
              />
              {form.social_facebook_icon ? (
                <img
                  src={form.social_facebook_icon}
                  alt="Facebook icon preview"
                  className="h-10 w-10 rounded border border-ui-border-base bg-white p-1 object-contain"
                />
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>X Icon URL</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={xIconRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    uploadToField(file, "social_x_icon", "x", "X icon")
                    e.currentTarget.value = ""
                  }}
                  disabled={loading || saving || uploading.x}
                />
                <Button
                  type="button"
                  size="small"
                  variant="secondary"
                  isLoading={Boolean(uploading.x)}
                  disabled={loading || saving || uploading.x}
                  onClick={() => xIconRef.current?.click()}
                >
                  Upload Icon
                </Button>
              </div>
              <Input
                value={form.social_x_icon || ""}
                onChange={(e) => setField("social_x_icon", e.target.value)}
                disabled={loading || saving}
              />
              {form.social_x_icon ? (
                <img
                  src={form.social_x_icon}
                  alt="X icon preview"
                  className="h-10 w-10 rounded border border-ui-border-base bg-white p-1 object-contain"
                />
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>LinkedIn Icon URL</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={linkedinIconRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    uploadToField(
                      file,
                      "social_linkedin_icon",
                      "linkedin",
                      "LinkedIn icon"
                    )
                    e.currentTarget.value = ""
                  }}
                  disabled={loading || saving || uploading.linkedin}
                />
                <Button
                  type="button"
                  size="small"
                  variant="secondary"
                  isLoading={Boolean(uploading.linkedin)}
                  disabled={loading || saving || uploading.linkedin}
                  onClick={() => linkedinIconRef.current?.click()}
                >
                  Upload Icon
                </Button>
              </div>
              <Input
                value={form.social_linkedin_icon || ""}
                onChange={(e) => setField("social_linkedin_icon", e.target.value)}
                disabled={loading || saving}
              />
              {form.social_linkedin_icon ? (
                <img
                  src={form.social_linkedin_icon}
                  alt="LinkedIn icon preview"
                  className="h-10 w-10 rounded border border-ui-border-base bg-white p-1 object-contain"
                />
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Instagram Icon URL</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={instagramIconRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    uploadToField(
                      file,
                      "social_instagram_icon",
                      "instagram",
                      "Instagram icon"
                    )
                    e.currentTarget.value = ""
                  }}
                  disabled={loading || saving || uploading.instagram}
                />
                <Button
                  type="button"
                  size="small"
                  variant="secondary"
                  isLoading={Boolean(uploading.instagram)}
                  disabled={loading || saving || uploading.instagram}
                  onClick={() => instagramIconRef.current?.click()}
                >
                  Upload Icon
                </Button>
              </div>
              <Input
                value={form.social_instagram_icon || ""}
                onChange={(e) => setField("social_instagram_icon", e.target.value)}
                disabled={loading || saving}
              />
              {form.social_instagram_icon ? (
                <img
                  src={form.social_instagram_icon}
                  alt="Instagram icon preview"
                  className="h-10 w-10 rounded border border-ui-border-base bg-white p-1 object-contain"
                />
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Copyright Text</Label>
          <Textarea
            value={form.copyright_text || ""}
            onChange={(e) => setField("copyright_text", e.target.value)}
            disabled={loading || saving}
            rows={2}
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
  label: "Email Config",
  icon: ListTree,
  nested: "/orders",
})

export const handle = {
  breadcrumb: () => "Email Config",
}

export default EmailTemplateConfigPage
