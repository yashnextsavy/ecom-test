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

type ExamSeries = {
    id: string
    title: string
    category_id: string
    category_title: string
    created_at?: string
}

const ExamSeries = () => {
    const [rows, setRows] = useState<ExamSeries[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState("")
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    })
    const [deleteTarget, setDeleteTarget] = useState<ExamSeries | null>(null)
    const navigate = useNavigate()
    const location = useLocation()

    const load = async () => {
        setLoading(true)
        try {
            const { exam_series } = await sdk.client.fetch<{ exam_series: ExamSeries[] }>(
                "/admin/exam-series"
            )
            setRows(exam_series)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let mounted = true

        load().catch(() => {
            // no-op: errors handled by the UI state
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

    const handleDelete = async () => {
        if (!deleteTarget) return

        await sdk.client.fetch(`/admin/exam-series/${deleteTarget.id}`, {
            method: "delete",
        })

        setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id))
        setDeleteTarget(null)
    }

    const filteredRows = useMemo(() => {
        if (!search.trim()) return rows
        const q = search.trim().toLowerCase()
        return rows.filter((row) => {
            return (
                row.title.toLowerCase().includes(q) ||
                row.category_title.toLowerCase().includes(q)
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
        const columnHelper = createDataTableColumnHelper<ExamSeries>()

        return [
            columnHelper.accessor("title", {
                header: "Series",
                cell: (ctx) => (
                    <Text className="text-ui-fg-base">{ctx.getValue()}</Text>
                ),
            }),
            columnHelper.accessor("category_title", {
                header: "Category",
                cell: (ctx) => (
                    <Link
                        to={`/categories/${ctx.row.original.category_id}`}
                        className="text-ui-fg-subtle hover:text-ui-fg-base"
                    >
                        {ctx.getValue()}
                    </Link>
                ),
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
                                <DropdownMenu.Item className="gap-x-2" onSelect={() => navigate(`edit/${row.original.id}`)}>
                                    <PencilSquare className="text-ui-fg-subtle" /> Edit
                                </DropdownMenu.Item>

                                <DropdownMenu.Separator />

                                <DropdownMenu.Item className="gap-x-2" onSelect={() => setDeleteTarget(row.original)}>
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
                        <Heading level="h2">Exam Series</Heading>
                        <p className="font-normal font-sans txt-small text-ui-fg-subtle">Manage your exam series here.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button size="small" asChild>
                            <Link to="create">Create</Link>
                        </Button>
                    </div>
                </div>
                <div className="px-2 pb-2">
                    <DataTable instance={table}>
                        <DataTable.Toolbar>

                        </DataTable.Toolbar>
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
                                ? `You are about to delete the exam series "${deleteTarget.title}". This action cannot be undone.`
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
    label: "Exam Series",
    icon: ListTree,
    nested: "/products",
})

export const handle = {
    breadcrumb: () => "Exam Series",
}

export default ExamSeries
