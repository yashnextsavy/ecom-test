import { defineRouteConfig } from "@medusajs/admin-sdk"
import { EllipsisHorizontal, ListTree, PencilSquare, Trash } from "@medusajs/icons"
import {
  Button,
  Container,
  DataTable,
  DropdownMenu,
  Heading,
  IconButton,
  Prompt,
  Text,
  createDataTableColumnHelper,
  useDataTable,
} from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { sdk } from "../../lib/sdk"

type Country = {
  id: string
  country_name: string
  currency_name: string
  created_at?: string
}

const CountriesPage = () => {
  const [rows, setRows] = useState<Country[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [deleteTarget, setDeleteTarget] = useState<Country | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const load = async () => {
    setLoading(true)
    try {
      const { countries } = await sdk.client.fetch<{ countries: Country[] }>(
        "/admin/international-countries"
      )
      setRows(countries)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch(() => {
      // no-op: errors handled by UI state
    })
  }, [])

  useEffect(() => {
    if (location.state && (location.state as { refresh?: boolean }).refresh) {
      load()
    }
  }, [location.state])

  const handleDelete = async () => {
    if (!deleteTarget) return

    await sdk.client.fetch(`/admin/international-countries/${deleteTarget.id}`, {
      method: "delete",
    })

    setRows((prev) => prev.filter((row) => row.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.trim().toLowerCase()

    return rows.filter((row) => {
      return (
        row.country_name.toLowerCase().includes(q) ||
        row.currency_name.toLowerCase().includes(q)
      )
    })
  }, [rows, search])

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const at = a.created_at ? new Date(a.created_at).getTime() : 0
      const bt = b.created_at ? new Date(b.created_at).getTime() : 0
      return bt - at
    })
  }, [filteredRows])

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [search, rows.length])

  const pagedRows = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    const end = start + pagination.pageSize
    return sortedRows.slice(start, end)
  }, [sortedRows, pagination.pageIndex, pagination.pageSize])

  const columns = useMemo(() => {
    const columnHelper = createDataTableColumnHelper<Country>()

    return [
      columnHelper.accessor("country_name", {
        header: "Country",
        cell: (ctx) => <Text className="text-ui-fg-base">{ctx.getValue()}</Text>,
      }),
      columnHelper.accessor("currency_name", {
        header: "Currency",
        cell: (ctx) => <Text className="text-ui-fg-subtle">{ctx.getValue()}</Text>,
      }),
      columnHelper.accessor("created_at", {
        header: "Created",
        cell: (ctx) => {
          const value = ctx.getValue()
          return (
            <Text className="text-ui-fg-subtle">
              {value ? new Date(value).toLocaleDateString() : "-"}
            </Text>
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end pr-2">
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <IconButton size="small" variant="transparent">
                  <EllipsisHorizontal />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item
                  className="gap-x-2"
                  onSelect={() => navigate(`edit/${row.original.id}`)}
                >
                  <PencilSquare className="text-ui-fg-subtle" /> Edit
                </DropdownMenu.Item>

                <DropdownMenu.Separator />

                <DropdownMenu.Item
                  className="gap-x-2"
                  onSelect={() => setDeleteTarget(row.original)}
                >
                  <Trash className="text-ui-fg-subtle" />
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
        ),
      }),
    ]
  }, [navigate])

  const table = useDataTable({
    data: pagedRows,
    columns,
    getRowId: (row) => row.id,
    rowCount: sortedRows.length,
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
            <Heading level="h2">Countries</Heading>
            <p className="font-normal font-sans txt-small text-ui-fg-subtle">
              Configure country and currency codes for international products only.
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

      <Prompt
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        variant="danger"
      >
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>Are you sure?</Prompt.Title>
            <Prompt.Description>
              {deleteTarget
                ? `You are about to delete "${deleteTarget.country_name}". This action cannot be undone.`
                : "This action cannot be undone."}
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel>Cancel</Prompt.Cancel>
            <Prompt.Action onClick={handleDelete}>Delete</Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>

      <Outlet />
    </>
  )
}

export const config = defineRouteConfig({
  label: "Countries",
  icon: ListTree,
  nested: "/products",
})

export const handle = {
  breadcrumb: () => "Countries",
}

export default CountriesPage
