import {
  Button,
  Container,
  DataTable,
  Heading,
  Text,
  createDataTableColumnHelper,
  useDataTable,
} from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { Link, Outlet } from "react-router-dom"

import { sdk } from "../../lib/sdk"

type Category = {
  id: string
  name: string
  handle: string
  is_active?: boolean
  is_internal?: boolean
  metadata?: Record<string, unknown> | null
}

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "number") {
    return value !== 0
  }

  if (typeof value === "string") {
    return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase())
  }

  return false
}

const toSortOrder = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value)
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value.trim(), 10)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const CategoriesPage = () => {
  const [rows, setRows] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { product_categories } = await sdk.client.fetch<{
          product_categories: Category[]
        }>("/admin/product-categories", {
          query: {
            fields: "id,name,handle,is_active,is_internal,metadata",
            limit: 500,
          },
        })

        setRows(product_categories)
      } finally {
        setLoading(false)
      }
    }

    load().catch(() => {
      // no-op: errors handled by table state
    })
  }, [])

  const filteredRows = useMemo(() => {
    if (!search.trim()) {
      return rows
    }

    const q = search.trim().toLowerCase()

    return rows.filter((row) => {
      return row.name.toLowerCase().includes(q) || row.handle.toLowerCase().includes(q)
    })
  }, [rows, search])

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [search, rows.length])

  const pagedRows = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    const end = start + pagination.pageSize

    return filteredRows.slice(start, end)
  }, [filteredRows, pagination.pageIndex, pagination.pageSize])

  const columns = useMemo(() => {
    const columnHelper = createDataTableColumnHelper<Category>()

    return [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (ctx) => <Text className="text-ui-fg-base">{ctx.getValue()}</Text>,
      }),
      columnHelper.accessor("handle", {
        header: "Handle",
        cell: (ctx) => <Text className="text-ui-fg-subtle">/{ctx.getValue()}</Text>,
      }),
      columnHelper.display({
        id: "sort_order",
        header: "Sort Order",
        cell: ({ row }) => {
          const sortOrder = toSortOrder(row.original.metadata?.sort_order)
          return (
            <Text className="text-ui-fg-subtle">
              {sortOrder === null ? "-" : String(sortOrder)}
            </Text>
          )
        },
      }),
      columnHelper.display({
        id: "international",
        header: "International",
        cell: ({ row }) => {
          const isInternational = toBoolean(
            row.original.metadata?.show_in_international_products
          )

          return (
            <span
              className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                isInternational
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-ui-bg-subtle text-ui-fg-subtle"
              }`}
            >
              {isInternational ? "International" : "-"}
            </span>
          )
        },
      }),
      columnHelper.display({
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Text className="text-ui-fg-subtle">
            {row.original.is_active ? "Active" : "Inactive"}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "visibility",
        header: "Visibility",
        cell: ({ row }) => (
          <Text className="text-ui-fg-subtle">
            {row.original.is_internal ? "Internal" : "Public"}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end pr-2">
            <Button size="small" variant="transparent" asChild>
              <Link to={`/categories/${row.original.id}`}>View</Link>
            </Button>
          </div>
        ),
      }),
    ]
  }, [])

  const table = useDataTable({
    data: pagedRows,
    columns,
    getRowId: (row) => row.id,
    rowCount: filteredRows.length,
    isLoading: loading,
    search: {
      state: search,
      onSearchChange: setSearch,
    },
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  })

  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h2">Categories</Heading>
            <p className="font-normal font-sans txt-small text-ui-fg-subtle">
              Manage product categories and see international visibility at a glance.
            </p>
          </div>

          <Button size="small" asChild>
            <Link to="create">Create</Link>
          </Button>
        </div>

        <div className="px-2 pb-2">
          <DataTable instance={table}>
            <DataTable.Toolbar />
            <DataTable.Table />
            <DataTable.Pagination />
          </DataTable>
        </div>
      </Container>

      <Outlet />
    </>
  )
}

export default CategoriesPage
