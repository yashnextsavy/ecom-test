import { defineRouteConfig } from "@medusajs/admin-sdk"
import { EllipsisHorizontal, FilePlus } from "@medusajs/icons"
import {
  Button,
  Container,
  DataTable,
  DropdownMenu,
  Heading,
  IconButton,
  Text,
  createDataTableColumnHelper,
  useDataTable,
} from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { sdk } from "../../lib/sdk"

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

const ContactRequests = () => {
  const [rows, setRows] = useState<ContactRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const navigate = useNavigate()
  const location = useLocation()
  const isDetailPage = location.pathname.includes("/contact-requests/view/")

  const load = async () => {
    setLoading(true)
    try {
      const { contact_requests } = await sdk.client.fetch<{
        contact_requests: ContactRequest[]
      }>("/admin/contact-requests")
      setRows(contact_requests)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    load().catch(() => {
      // no-op
    })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (location.state && (location.state as { refresh?: boolean }).refresh) {
      load()
    }
  }, [location.state])

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      return (
        row.full_name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q) ||
        row.course.toLowerCase().includes(q) ||
        row.vendor.toLowerCase().includes(q) ||
        (row.page_url || "").toLowerCase().includes(q)
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
    const columnHelper = createDataTableColumnHelper<ContactRequest>()

    return [
      columnHelper.accessor("full_name", {
        header: "Name",
        cell: (ctx) => <Text className="text-ui-fg-base">{ctx.getValue()}</Text>,
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (ctx) => <Text className="text-ui-fg-subtle">{ctx.getValue()}</Text>,
      }),
      columnHelper.accessor("phone", {
        header: "Phone",
        cell: (ctx) => <Text className="text-ui-fg-subtle">{ctx.getValue()}</Text>,
      }),
      columnHelper.accessor("vendor", {
        header: "Vendor",
        cell: (ctx) => <Text className="text-ui-fg-subtle">{ctx.getValue()}</Text>,
      }),
      columnHelper.accessor("course", {
        header: "Course",
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
                  onSelect={() => navigate(`view/${row.original.id}`)}
                >
                  View
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
    onRowClick: (event, row) => {
      const target = event.target as HTMLElement

      if (target.closest("button, a, [role='menuitem']")) {
        return
      }

      navigate(`view/${row.id}`)
    },
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

  if (isDetailPage) {
    return <Outlet />
  }

  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h2">Contact Requests</Heading>
            <p className="font-normal font-sans txt-small text-ui-fg-subtle">
              Submissions from the contact form.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="small" asChild>
              <Link to="create">Create</Link>
            </Button>
          </div>
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

export const config = defineRouteConfig({
  label: "Contact Requests",
  icon: FilePlus, 
 
})

export const handle = {
  breadcrumb: () => "Contact Requests",
}

export default ContactRequests
