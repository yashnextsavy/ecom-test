import { Button, Drawer, Input, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { sdk } from "../../../lib/sdk"

const ISO_4217_CODE_REGEX = /^[A-Z]{3}$/

const CreateCountry = () => {
  const [open, setOpen] = useState(true)
  const navigate = useNavigate()
  const [countryName, setCountryName] = useState("")
  const [currencyName, setCurrencyName] = useState("")
  const [loading, setLoading] = useState(false)
  const normalizedCurrencyCode = currencyName.trim().toUpperCase()
  const isCurrencyCodeValid = ISO_4217_CODE_REGEX.test(normalizedCurrencyCode)

  useEffect(() => {
    if (!open) {
      navigate(-1)
    }
  }, [open, navigate])

  const handleSave = async () => {
    if (!countryName.trim() || !isCurrencyCodeValid) return

    setLoading(true)
    try {
      await sdk.client.fetch("/admin/international-countries", {
        method: "post",
        body: {
          country_name: countryName.trim(),
          currency_name: normalizedCurrencyCode,
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
          <Drawer.Title>Create Country</Drawer.Title>
        </Drawer.Header>

        <Drawer.Body className="p-4 space-y-4">
          <div>
            <Text className="mb-1">Country name</Text>
            <Input
              placeholder="e.g. United States"
              value={countryName}
              onChange={(e) => setCountryName(e.target.value)}
            />
          </div>

          <div>
            <Text className="mb-1">Currency name</Text>
            <Input
              placeholder="e.g. USD"
              value={currencyName}
              onChange={(e) =>
                setCurrencyName(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))
              }
            />
            {currencyName.trim().length > 0 && !isCurrencyCodeValid && (
              <Text className="mt-1 text-ui-fg-error text-xs">
                Enter a valid 3-letter ISO 4217 currency code (for example: USD, INR, EUR).
              </Text>
            )}
          </div>
        </Drawer.Body>

        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Drawer.Close>
          <Button
            onClick={handleSave}
            disabled={!countryName.trim() || !isCurrencyCodeValid || loading}
            isLoading={loading}
          >
            Save
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

export default CreateCountry
