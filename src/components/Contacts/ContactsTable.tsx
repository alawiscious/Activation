import React, { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
  ColumnDef,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowUpDown,
  Users,
  CheckCircle,
  XCircle,
  Mail,
  Building2,
} from 'lucide-react'
import { usePharmaVisualPivotStore } from '@/data/store'
import { selectors } from '@/data/selectors'
import type { Contact } from '@/types/domain'
import { formatDerivedLabel, getLabelPalette } from '@/lib/contactLabeling'

const columnHelper = createColumnHelper<Contact>()

export function ContactsTable() {
  const {
    currentCompanySlug,
    companies,
    toggleContactKnown,
  } = usePharmaVisualPivotStore()

  const [sorting, setSorting] = React.useState<SortingState>([])

  const currentCompany = currentCompanySlug ? companies[currentCompanySlug] : null
  // Get all contacts from all companies instead of requiring company selection
  const allContacts = useMemo(() => {
    const allContactsList: Contact[] = []
    Object.values(companies).forEach(company => {
      allContactsList.push(...company.contacts.filter(contact => !contact.isIrrelevant))
    })
    return allContactsList
  }, [companies])
  
  const filteredContacts = allContacts

  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  const columns = useMemo(
    () => [
      columnHelper.accessor('known', {
        id: 'known',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const contact = row.original
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleContactKnown(contact.id)}
              className="h-8 w-8 p-0"
            >
              {contact.known ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          )
        },
        enableSorting: true,
        size: 60,
      }),
      columnHelper.accessor('firstName', {
        id: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const contact = row.original
          return (
            <div className="font-medium">
              {contact.firstName} {contact.lastName}
            </div>
          )
        },
        enableSorting: true,
        size: 150,
      }),
      columnHelper.accessor('email', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a 
              href={`mailto:${row.getValue('email')}`}
              className="text-primary hover:underline"
            >
              {row.getValue('email')}
            </a>
          </div>
        ),
        enableSorting: true,
        size: 200,
      }),
      columnHelper.accessor('title', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate" title={row.getValue('title')}>
            {row.getValue('title')}
          </div>
        ),
        enableSorting: true,
        size: 200,
      }),
      columnHelper.accessor('level', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Level
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const level = row.getValue('level') as string
          const getLevelColor = (level: string) => {
            switch (level) {
              case 'C-Suite':
                return 'bg-purple-100 text-purple-800 border-purple-200'
              case 'VP':
                return 'bg-blue-100 text-blue-800 border-blue-200'
              case 'Director':
                return 'bg-green-100 text-green-800 border-green-200'
              case 'Manager':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
              default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
            }
          }
          return (
            <Badge className={getLevelColor(level)}>
              {level}
            </Badge>
          )
        },
        enableSorting: true,
        size: 120,
      }),
      columnHelper.accessor('functionalArea', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Functional Area
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="max-w-[150px] truncate" title={row.getValue('functionalArea')}>
            {row.getValue('functionalArea')}
          </div>
        ),
        enableSorting: true,
        size: 150,
      }),
      columnHelper.accessor('derivedLabel', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Relationship
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const contact = row.original
          const palette = getLabelPalette(contact.derivedLabel)
          const badgeStyle = {
            backgroundColor: palette.badgeBackground,
            color: palette.badgeText,
            borderColor: palette.badgeText,
          }
          return (
            <span
              className="inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wide rounded border"
              style={badgeStyle}
            >
              {formatDerivedLabel(contact.derivedLabel, contact.dispositionToKlick, contact.agencyAlignment)}
            </span>
          )
        },
        enableSorting: true,
        size: 180,
      }),
      columnHelper.accessor('brand', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Brand
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const brand = row.getValue('brand') as string | undefined
          return brand ? (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="max-w-[120px] truncate" title={brand}>
                {brand}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
        enableSorting: true,
        size: 120,
      }),
      columnHelper.accessor('therapeuticArea', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Therapeutic Area
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const ta = row.getValue('therapeuticArea') as string | undefined
          return ta ? (
            <span className="max-w-[120px] truncate" title={ta}>
              {ta}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
        enableSorting: true,
        size: 120,
      }),
    ] as ColumnDef<Contact>[],
    [toggleContactKnown]
  )

  const table = useReactTable({
    data: filteredContacts,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 50,
    overscan: 10,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0
  const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0) : 0

  if (!currentCompany) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Contacts ({filteredContacts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div
            ref={tableContainerRef}
            className="h-[600px] overflow-auto"
          >
            <table className="w-full">
              <thead className="sticky top-0 bg-background border-b">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {paddingTop > 0 && (
                  <tr>
                    <td style={{ height: `${paddingTop}px` }} />
                  </tr>
                )}
                {virtualRows.map(virtualRow => {
                  const row = rows[virtualRow.index]
                  return (
                    <tr
                      key={row.id}
                      className="border-b hover:bg-muted/50"
                    >
                      {row.getVisibleCells().map(cell => (
                        <td
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                          className="px-4 py-3 text-sm"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  )
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td style={{ height: `${paddingBottom}px` }} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
