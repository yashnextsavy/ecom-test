import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Checkbox, Container, DropdownMenu, Input, Prompt, Text } from "@medusajs/ui"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { sdk } from "../lib/sdk"

type Country = {
  id: string
  country_name: string
  currency_name: string
}

type CountryOption = Country & {
  is_removed?: boolean
}

type CountryPricing = {
  country_id: string
  country_name: string
  currency_name: string
  our_price: string
  actual_price: string
}

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  if (typeof value === "string") {
    return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase())
  }
  return false
}

const normalizePriceInput = (value: string): string => {
  if (!value.trim()) return ""
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed.toFixed(2) : value
}

const parseCountryPricing = (value: unknown): CountryPricing[] => {
  const rows = Array.isArray(value) ? value : []

  return rows
    .map((row) => {
      if (!row || typeof row !== "object") return null
      const item = row as Record<string, unknown>
      return {
        country_id: typeof item.country_id === "string" ? item.country_id : "",
        country_name: typeof item.country_name === "string" ? item.country_name : "",
        currency_name: typeof item.currency_name === "string" ? item.currency_name : "",
        our_price:
          typeof item.our_price === "number"
            ? item.our_price.toFixed(2)
            : typeof item.our_price === "string"
              ? item.our_price
              : "",
        actual_price:
          typeof item.actual_price === "number"
            ? item.actual_price.toFixed(2)
            : typeof item.actual_price === "string"
              ? item.actual_price
              : "",
      }
    })
    .filter((row): row is CountryPricing => Boolean(row?.country_id))
}

const findSalesChannelByName = (
  channels: Array<{ id: string; name?: string | null }>,
  expectedName: string
) => {
  const target = expectedName.trim().toLowerCase()
  return channels.find((channel) => (channel.name || "").trim().toLowerCase() === target) || null
}

const ProductInternationalPricingWidget = () => {
  const { id } = useParams() as { id?: string }
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const [isInternational, setIsInternational] = useState(false)
  const [selectedCountryIds, setSelectedCountryIds] = useState<string[]>([])
  const [countryPricing, setCountryPricing] = useState<CountryPricing[]>([])
  const [channelSyncMessage, setChannelSyncMessage] = useState("")
  const [channelSyncError, setChannelSyncError] = useState(false)
  const [countrySelectionError, setCountrySelectionError] = useState("")
  const [priceValidationError, setPriceValidationError] = useState("")
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        const [productRes, countriesRes] = await Promise.all([
          fetch(`/admin/products/${id}?fields=id,metadata`),
          fetch(`/admin/international-countries`),
        ])

        let allCountries: Country[] = []
        if (countriesRes.ok) {
          const countriesData = await countriesRes.json()
          allCountries = Array.isArray(countriesData.countries)
            ? countriesData.countries
            : []
          setCountries(allCountries)
        }

        if (productRes.ok) {
          const data = await productRes.json()
          const metadata = (data.product?.metadata || {}) as Record<string, unknown>
          const enabled = toBoolean(metadata.is_international)
          setIsInternational(enabled)

          const loadedPricing = parseCountryPricing(metadata.international_country_prices)
          setCountryPricing(loadedPricing)
          setSelectedCountryIds(loadedPricing.map((row) => row.country_id))
        }
      } catch (e) {
        console.error("Failed to load international product pricing data", e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  const countryOptions = useMemo<CountryOption[]>(() => {
    const byId = new Map<string, CountryOption>()

    for (const country of countries) {
      byId.set(country.id, {
        ...country,
        is_removed: false,
      })
    }

    for (const row of countryPricing) {
      if (!selectedCountryIds.includes(row.country_id)) {
        continue
      }

      if (!byId.has(row.country_id)) {
        byId.set(row.country_id, {
          id: row.country_id,
          country_name: row.country_name || "Deleted Country",
          currency_name: row.currency_name || "-",
          is_removed: true,
        })
      }
    }

    return Array.from(byId.values())
  }, [countries, countryPricing, selectedCountryIds])

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return countryOptions
    return countryOptions.filter((country) => {
      return (
        country.country_name.toLowerCase().includes(q) ||
        country.currency_name.toLowerCase().includes(q)
      )
    })
  }, [countryOptions, search])

  const clearInternationalData = () => {
    setCountrySelectionError("")
    setPriceValidationError("")
    setSelectedCountryIds([])
    setCountryPricing([])
  }

  const upsertCountryPricing = (country: CountryOption, nextSelected: boolean) => {
    setCountryPricing((prev) => {
      if (!nextSelected) {
        return prev.filter((row) => row.country_id !== country.id)
      }

      const existing = prev.find((row) => row.country_id === country.id)
      if (existing) return prev

      return [
        ...prev,
        {
          country_id: country.id,
          country_name: country.country_name,
          currency_name: country.currency_name,
          our_price: "",
          actual_price: "",
        },
      ]
    })
  }

  const toggleCountry = (country: CountryOption) => {
    const isSelected = selectedCountryIds.includes(country.id)
    const nextSelected = !isSelected
    setSelectedCountryIds((prev) =>
      nextSelected ? [...prev, country.id] : prev.filter((id) => id !== country.id)
    )
    if (nextSelected) {
      setCountrySelectionError("")
    }
    upsertCountryPricing(country, nextSelected)
  }

  const updatePrice = (countryId: string, key: "our_price" | "actual_price", value: string) => {
    setPriceValidationError("")
    setCountryPricing((prev) =>
      prev.map((row) =>
        row.country_id === countryId
          ? {
              ...row,
              [key]: value,
            }
          : row
      )
    )
  }

  const onSave = async () => {
    if (!id) return
    if (isInternational && selectedCountryIds.length === 0) {
      setCountrySelectionError(
        "At least one country must be selected for international products."
      )
      return
    }

    if (isInternational) {
      const selectedRows = countryPricing.filter((row) =>
        selectedCountryIds.includes(row.country_id)
      )
      const hasMissingPrices = selectedRows.some(
        (row) => !row.our_price.trim() || !row.actual_price.trim()
      )

      if (hasMissingPrices) {
        setPriceValidationError(
          "Our Price and Actual Price are required for all selected countries."
        )
        return
      }
    }

    setCountrySelectionError("")
    setPriceValidationError("")
    setSaving(true)
    setSaved(false)
    setChannelSyncMessage("")
    setChannelSyncError(false)

    try {
      const getRes = await fetch(`/admin/products/${id}`)
      if (!getRes.ok) {
        throw new Error(await getRes.text())
      }

      const { product } = await getRes.json()
      const metadata = (product?.metadata || {}) as Record<string, unknown>

      const normalizedCountryPricing = countryPricing
        .filter((row) => selectedCountryIds.includes(row.country_id))
        .map((row) => ({
          country_id: row.country_id,
          country_name: row.country_name,
          currency_name: row.currency_name,
          our_price: row.our_price.trim() ? Number.parseFloat(normalizePriceInput(row.our_price)) : null,
          actual_price: row.actual_price.trim()
            ? Number.parseFloat(normalizePriceInput(row.actual_price))
            : null,
        }))

      const saveRes = await fetch(`/admin/products/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            ...metadata,
            is_international: isInternational,
            international_country_prices: normalizedCountryPricing,
          },
        }),
      })

      if (!saveRes.ok) {
        throw new Error(await saveRes.text())
      }

      let channelSyncedSuccessfully = false
      try {
        const { sales_channels } = await sdk.admin.salesChannel.list({ limit: 200 })
        const internationalChannel = findSalesChannelByName(sales_channels, "International")
        const domesticChannel = findSalesChannelByName(sales_channels, "Domestic")

        if (!internationalChannel?.id || !domesticChannel?.id) {
          setChannelSyncMessage(
            "Sales channel sync skipped: Domestic or International channel not found."
          )
          setChannelSyncError(true)
        } else if (isInternational) {
          await sdk.admin.salesChannel.batchProducts(internationalChannel.id, {
            add: [id],
          })
          await sdk.admin.salesChannel.batchProducts(domesticChannel.id, {
            remove: [id],
          })
          setChannelSyncMessage("Sales channel synced to International.")
          setChannelSyncError(false)
          channelSyncedSuccessfully = true
        } else {
          await sdk.admin.salesChannel.batchProducts(domesticChannel.id, {
            add: [id],
          })
          await sdk.admin.salesChannel.batchProducts(internationalChannel.id, {
            remove: [id],
          })
          setChannelSyncMessage("Sales channel synced to Domestic.")
          setChannelSyncError(false)
          channelSyncedSuccessfully = true
        }
      } catch (channelSyncError) {
        console.error("Failed to sync sales channel with international checkbox", channelSyncError)
        setChannelSyncMessage("Failed to sync sales channel.")
        setChannelSyncError(true)
      }

      setCountryPricing((prev) =>
        prev.map((row) => ({
          ...row,
          our_price: normalizePriceInput(row.our_price),
          actual_price: normalizePriceInput(row.actual_price),
        }))
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 1400)
      if (channelSyncedSuccessfully) {
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const key = Array.isArray(query.queryKey) ? query.queryKey : []
            return key.some(
              (segment) =>
                typeof segment === "string" &&
                (segment.includes("product") || segment.includes("sales"))
            )
          },
        })
      }
    } catch (e) {
      console.error("Failed to save international product pricing", e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <Container className="p-0">
      <div className="flex flex-col gap-3 px-6 py-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">International Product Details</label>
          <Text className="text-ui-fg-subtle text-sm">
            {saving ? "Saving..." : saved ? "Saved" : ""}
          </Text>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={isInternational}
            disabled={saving}
            onCheckedChange={(value) => {
              const enabled = value === true
              if (!enabled) {
                const hasInternationalData =
                  selectedCountryIds.length > 0 || countryPricing.length > 0
                if (hasInternationalData) {
                  setConfirmDisableOpen(true)
                  return
                }
              }
              setIsInternational(enabled)
              window.dispatchEvent(
                new CustomEvent("international-product-toggle", { detail: { enabled } })
              )
              if (!enabled) {
                clearInternationalData()
              }
            }}
          />
          <Text className="text-sm">Is this product international?</Text>
        </div>

        {isInternational && (
          <>
            <div className="rounded-md border border-ui-border-base bg-ui-bg-subtle px-3 py-2">
              <Text className="text-xs font-medium text-ui-fg-base">
                Note: International products:
              </Text>
              <ul className="mt-1 list-disc pl-4 text-xs text-ui-fg-subtle">
                <li>Do not appear in regular categories & product listings</li>
                <li>Are automatically assigned to the International sales channel</li>
                <li>
                  Do not require SEO metadata, validity, delivery, or additional information
                </li>
                <li>Any values added to these fields will be automatically removed</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <Text className="text-xs font-medium">Countries</Text>
              <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenu.Trigger asChild>
                  <Button variant="secondary" className="justify-between w-full">
                    {selectedCountryIds.length
                      ? `${selectedCountryIds.length} country(s) selected`
                      : "Select countries"}
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="start" className="w-[360px] p-0">
                  <div className="p-2">
                    <Input
                      placeholder="Search country or currency"
                      value={search}
                      onChange={(e: any) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-64 overflow-auto px-2 pb-2">
                    {filteredCountries.map((country) => {
                      const checked = selectedCountryIds.includes(country.id)
                      return (
                        <div
                          key={country.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-ui-bg-base-hover"
                          onClick={() => toggleCountry(country)}
                        >
                          <Checkbox checked={checked} />
                          <Text
                            className={`text-ui-fg-base ${country.is_removed ? "line-through text-ui-fg-subtle" : ""}`}
                          >
                            {country.country_name} ({country.currency_name})
                            {country.is_removed ? " (Removed from master)" : ""}
                          </Text>
                        </div>
                      )
                    })}
                    {filteredCountries.length === 0 && (
                      <Text className="px-2 py-2 text-ui-fg-subtle">
                        No countries found.
                      </Text>
                    )}
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu>
              {countrySelectionError && (
                <Text className="text-rose-500 text-xs">{countrySelectionError}</Text>
              )}
              {priceValidationError && (
                <Text className="text-rose-500 text-xs">{priceValidationError}</Text>
              )}
            </div>

            {countryPricing
              .filter((row) => selectedCountryIds.includes(row.country_id))
              .map((row) => (
                <div key={row.country_id} className="rounded border border-ui-border-base p-3">
                  <div className="mb-2">
                    <Text className="text-sm font-medium">
                      {row.country_name} ({row.currency_name})
                    </Text>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Text className="mb-1 text-xs font-medium">Our Price</Text>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.our_price}
                        onChange={(e) => updatePrice(row.country_id, "our_price", e.target.value)}
                        placeholder="Enter our price"
                      />
                      {!row.our_price.trim() && (
                        <Text className="mt-1 text-rose-500 text-xs">Required</Text>
                      )}
                    </div>

                    <div>
                      <Text className="mb-1 text-xs font-medium">Actual Price</Text>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.actual_price}
                        onChange={(e) => updatePrice(row.country_id, "actual_price", e.target.value)}
                        placeholder="Enter actual price"
                      />
                      {!row.actual_price.trim() && (
                        <Text className="mt-1 text-rose-500 text-xs">Required</Text>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </>
        )}

        <div className="flex justify-end pt-2">
          <Button
          variant="secondary"
            onClick={onSave}
            disabled={
              saving ||
              (isInternational &&
                (selectedCountryIds.length === 0 ||
                  countryPricing
                    .filter((row) => selectedCountryIds.includes(row.country_id))
                    .some((row) => !row.our_price.trim() || !row.actual_price.trim())))
            }
          >
            Save
          </Button>
        </div>
        {channelSyncMessage && (
          <Text className={`text-sm ${channelSyncError ? "text-rose-500" : "text-ui-fg-subtle"}`}>
            {channelSyncMessage}
          </Text>
        )}
      </div>
      <Prompt
        open={confirmDisableOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDisableOpen(false)
          }
        }}
        variant="danger"
      >
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>Disable international product?</Prompt.Title>
            <Prompt.Description>
              Unchecking will remove all international pricing data. This action cannot be
              undone.
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel>Cancel</Prompt.Cancel>
            <Prompt.Action
              onClick={() => {
                setConfirmDisableOpen(false)
                setIsInternational(false)
                clearInternationalData()
                window.dispatchEvent(
                  new CustomEvent("international-product-toggle", { detail: { enabled: false } })
                )
              }}
            >
              Continue
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export default ProductInternationalPricingWidget
