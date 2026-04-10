import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Input, Text } from "@medusajs/ui"
import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"

type VariantPrice = {
  id?: string
  amount?: number
  currency_code?: string
  rules?: Record<string, unknown>
}

type ProductVariant = {
  id?: string
  prices?: VariantPrice[]
}

const toNumberOrEmpty = (value: unknown): string => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(2)
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) {
      return ""
    }

    const parsed = Number.parseFloat(trimmed)
    return Number.isFinite(parsed) ? parsed.toFixed(2) : ""
  }

  return ""
}

const normalizePrice = (value: number): number => {
  return Number.parseFloat(value.toFixed(2))
}

const hasRules = (rules: Record<string, unknown> | undefined): boolean => {
  return Boolean(rules && Object.keys(rules).length)
}

const isDefaultOrInrPrice = (price: VariantPrice): boolean => {
  const currency = (price.currency_code || "").toLowerCase()
  return currency === "inr" || !hasRules(price.rules)
}

const getLowestVariantPrice = (variants: ProductVariant[] | undefined): number | null => {
  const amounts = (variants || [])
    .flatMap((variant) => variant.prices || [])
    .filter((price) => isDefaultOrInrPrice(price))
    .map((price) => price.amount)
    .filter((amount): amount is number => typeof amount === "number" && Number.isFinite(amount))

  if (!amounts.length) {
    return null
  }

  return Math.min(...amounts)
}

const normalizePriceInput = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }

  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed.toFixed(2) : trimmed
}

const ProductActualPriceWidget = () => {
  const { id } = useParams() as { id?: string }
  const [ourPrice, setOurPrice] = useState("")
  const [actualPrice, setActualPrice] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const initializedRef = useRef(false)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSnapshotRef = useRef("")

  const buildSnapshot = (our: string, actual: string): string => {
    return `${normalizePriceInput(our)}::${normalizePriceInput(actual)}`
  }

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        const res = await fetch(
          `/admin/products/${id}?fields=id,metadata,variants.id,variants.prices.id,variants.prices.amount,variants.prices.currency_code,variants.prices.rules`
        )
        if (!res.ok) return

        const { product } = await res.json()
        const metadata = (product?.metadata || {}) as Record<string, unknown>
        const variantPrice = getLowestVariantPrice(product?.variants as ProductVariant[] | undefined)
        const loadedOurPrice =
          variantPrice !== null ? variantPrice.toFixed(2) : toNumberOrEmpty(metadata.our_price)
        const loadedActualPrice = toNumberOrEmpty(metadata.actual_price)

        setOurPrice(loadedOurPrice)
        setActualPrice(loadedActualPrice)
        lastSnapshotRef.current = buildSnapshot(loadedOurPrice, loadedActualPrice)
      } catch (e) {
        console.error("Failed to load price metadata", e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  const onSave = async () => {
    if (!id) return

    setSaving(true)
    setSaved(false)

    try {
      const getRes = await fetch(
        `/admin/products/${id}?fields=id,metadata,variants.id,variants.prices.id,variants.prices.amount,variants.prices.currency_code,variants.prices.rules`
      )
      if (!getRes.ok) {
        throw new Error(await getRes.text())
      }

      const { product } = await getRes.json()
      const variants = (product?.variants || []) as ProductVariant[]
      const existingMetadata = (product?.metadata || {}) as Record<string, unknown>
      const nextMetadata = { ...existingMetadata }

      const discountedRaw = ourPrice.trim()
      let normalizedOurPrice: number | null = null
      if (discountedRaw) {
        const parsed = Number.parseFloat(discountedRaw)
        if (!Number.isFinite(parsed)) {
          throw new Error("Discounted Price must be a valid number")
        }
        normalizedOurPrice = normalizePrice(parsed)
      }

      const actualRaw = actualPrice.trim()
      if (!actualRaw) {
        delete nextMetadata.actual_price
      } else {
        const parsed = Number.parseFloat(actualRaw)
        if (!Number.isFinite(parsed)) {
          throw new Error("Actual Price must be a valid number")
        }
        const normalizedActualPrice = normalizePrice(parsed)
        nextMetadata.actual_price = normalizedActualPrice
        setActualPrice(normalizedActualPrice.toFixed(2))
      }

      if (normalizedOurPrice !== null && variants.length) {
        const variantUpdates = variants
          .filter((variant) => variant.id)
          .map((variant) => {
            const existingPrices = Array.isArray(variant.prices) ? variant.prices : []
            const targetPrices = existingPrices.filter((price) => isDefaultOrInrPrice(price))

            const mappedPrices = (targetPrices.length ? targetPrices : [{ currency_code: "inr" }])
              .map((price) => ({
                ...(price.id ? { id: price.id } : {}),
                currency_code: price.currency_code || "inr",
                amount: normalizedOurPrice,
                ...(hasRules(price.rules) ? { rules: price.rules } : {}),
              }))

            return {
              id: variant.id,
              prices: mappedPrices,
            }
          })

        const variantSaveRes = await fetch(`/admin/products/${id}/variants/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            update: variantUpdates,
          }),
        })

        if (!variantSaveRes.ok) {
          throw new Error(await variantSaveRes.text())
        }

        nextMetadata.our_price = normalizedOurPrice
        setOurPrice(normalizedOurPrice.toFixed(2))
      } else if (!discountedRaw) {
        delete nextMetadata.our_price
      }

      const saveRes = await fetch(`/admin/products/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: nextMetadata,
        }),
      })

      if (!saveRes.ok) {
        throw new Error(await saveRes.text())
      }

      lastSnapshotRef.current = buildSnapshot(
        normalizedOurPrice !== null ? normalizedOurPrice.toFixed(2) : "",
        actualRaw ? normalizePrice(Number.parseFloat(actualRaw)).toFixed(2) : ""
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      console.error("Failed to save price metadata", e)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (loading) return
    initializedRef.current = true

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [loading])

  useEffect(() => {
    if (!id || loading || saving || !initializedRef.current) return

    if (buildSnapshot(ourPrice, actualPrice) === lastSnapshotRef.current) {
      return
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
    }

    autosaveTimerRef.current = setTimeout(() => {
      onSave()
    }, 600)

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [ourPrice, actualPrice, id, loading, saving])

  if (loading) return null

  return (
    <Container className="p-0">
      <div className="flex flex-col gap-3 px-6 py-4">
        <div className="flex items-center justify-between gap-2 pb-2">
          <label className="text-md font-medium">Prices (INR Only)</label>
          {saving && (
            <Text className="text-ui-fg-subtle text-sm">Saving...</Text>
          )}
          {!saving && saved && (
            <Text className="text-ui-fg-subtle text-sm">Saved</Text>
          )}
        </div>

        <Text className="text-xs font-medium">Discounted Price</Text>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="Enter discounted price"
          value={ourPrice}
          onChange={(e) => setOurPrice(e.target.value)}
        />

        <Text className="text-xs font-medium">Actual Price</Text>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="Enter actual price"
          value={actualPrice}
          onChange={(e) => setActualPrice(e.target.value)}
        />

      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export default ProductActualPriceWidget
