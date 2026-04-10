import {
  Button,
  Drawer,
  Input,
  Text,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { sdk } from "../../../lib/sdk"

const CreateContactRequest = () => {
  const [open, setOpen] = useState(true)
  const navigate = useNavigate()

  const [fullName, setFullName] = useState("")
  const [emailID, setEmailID] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [country, setCountry] = useState("")
  const [vendor, setVendor] = useState("")
  const [course, setCourse] = useState("")
  const [message, setMessage] = useState("")
  const [pageUrl, setPageUrl] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      navigate(-1)
    }
  }, [open, navigate])

  const handleSave = async () => {
    if (!fullName || !emailID || !mobileNumber || !country || !vendor || !course || !message) {
      return
    }

    setLoading(true)
    try {
      await sdk.client.fetch("/admin/contact-requests", {
        method: "post",
        body: {
          fullName,
          emailID,
          mobileNumber,
          country,
          vendor,
          course,
          message,
          pageUrl,
        },
      })

      navigate("..", { state: { refresh: true } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Create Contact Request</Drawer.Title>
        </Drawer.Header>

        <Drawer.Body className="p-4 space-y-4">
          <div>
            <Text className="mb-1">Full name</Text>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Text className="mb-1">Email</Text>
            <Input value={emailID} onChange={(e) => setEmailID(e.target.value)} />
          </div>
          <div>
            <Text className="mb-1">Mobile number</Text>
            <Input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
          </div>
          <div>
            <Text className="mb-1">Country</Text>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div>
            <Text className="mb-1">Vendor</Text>
            <Input value={vendor} onChange={(e) => setVendor(e.target.value)} />
          </div>
          <div>
            <Text className="mb-1">Course</Text>
            <Input value={course} onChange={(e) => setCourse(e.target.value)} />
          </div>
          <div>
            <Text className="mb-1">Message</Text>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div>
            <Text className="mb-1">Page URL</Text>
            <Input value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} />
          </div>
        </Drawer.Body>

        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Drawer.Close>
          <Button
            onClick={handleSave}
            disabled={!fullName || !emailID || !mobileNumber || !country || !vendor || !course || !message || loading}
            isLoading={loading}
          >
            Save
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

export default CreateContactRequest
