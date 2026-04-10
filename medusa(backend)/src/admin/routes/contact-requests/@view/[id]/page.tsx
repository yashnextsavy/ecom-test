import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowLeft } from "@medusajs/icons"
import { Button, Container, Heading, Input, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { sdk } from "../../../../lib/sdk"

type ContactRequest = {
  id: string
  full_name: string
  email: string
  phone: string
  country: string
  vendor: string
  course: string
  message: string
  page_url: string
  created_at?: string
}

const ContactRequestView = () => {
  const { id } = useParams() as { id?: string }
  const [record, setRecord] = useState<ContactRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        const { contact_request } = await sdk.client.fetch<{ contact_request: ContactRequest }>(
          `/admin/contact-requests/${id}`
        )
        setRecord(contact_request)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  return (
    <Container className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Heading level="h2">Contact Request</Heading>
          <Text className="text-ui-fg-subtle">
            View complete details for this submission.
          </Text>
        </div>
        <Button variant="secondary" onClick={() => navigate("/contact-requests")}>
          <ArrowLeft />
          Back
        </Button>
      </div>

      <div className="space-y-4">
        {loading && <Text className="text-ui-fg-subtle">Loading...</Text>}
        {!loading && !record && (
          <Text className="text-ui-fg-subtle">Contact request not found.</Text>
        )}
        {!loading && record && (
          <>
            <div>
              <Text className="mb-1">Full name</Text>
              <Input value={record.full_name} readOnly />
            </div>
            <div>
              <Text className="mb-1">Email</Text>
              <Input value={record.email} readOnly />
            </div>
            <div>
              <Text className="mb-1">Mobile number</Text>
              <Input value={record.phone} readOnly />
            </div>
            <div>
              <Text className="mb-1">Country</Text>
              <Input value={record.country} readOnly />
            </div>
            <div>
              <Text className="mb-1">Vendor</Text>
              <Input value={record.vendor} readOnly />
            </div>
            <div>
              <Text className="mb-1">Course</Text>
              <Input value={record.course} readOnly />
            </div>
            <div>
              <Text className="mb-1">Message</Text>
              <textarea
                className="bg-ui-bg-field shadow-borders-base txt-compact-small text-ui-fg-base placeholder:text-ui-fg-muted hover:bg-ui-bg-field-hover focus:shadow-borders-interactive-with-active disabled:!bg-ui-bg-disabled disabled:!text-ui-fg-disabled flex min-h-[120px] w-full rounded-md px-3 py-2 outline-none transition-fg transition-shadow"
                value={record.message}
                readOnly
              />
            </div>
            <div>
              <Text className="mb-1">Page URL</Text>
              <Input value={record.page_url || "-"} readOnly />
            </div>
            <div>
              <Text className="mb-1">Created</Text>
              <Input
                value={record.created_at ? new Date(record.created_at).toLocaleString() : "-"}
                readOnly
              />
            </div>
          </>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "View Contact Request",
  
})

export default ContactRequestView
