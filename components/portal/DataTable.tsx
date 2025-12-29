'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, ChevronDown, ChevronUp, X } from 'lucide-react'

interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  filterable?: boolean
  filterOptions?: string[]
  render?: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchKeys?: (keyof T)[]
  searchPlaceholder?: string
  emptyMessage?: string
  emptyIcon?: React.ReactNode
  onRowClick?: (item: T) => void
  loading?: boolean
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchKeys = [],
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data found',
  emptyIcon,
  onRowClick,
  loading = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)

  // Get filterable columns
  const filterableColumns = columns.filter(col => col.filterable && col.filterOptions)

  // Get unique values for filterable columns if not provided
  const getFilterOptions = (column: Column<T>): string[] => {
    if (column.filterOptions) return column.filterOptions
    const key = column.key as keyof T
    const uniqueValues = [...new Set(data.map(item => String(item[key] || '')))]
    return uniqueValues.filter(v => v).sort()
  }

  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...data]

    // Apply search
    if (searchQuery && searchKeys.length > 0) {
      const query = searchQuery.toLowerCase()
      result = result.filter(item =>
        searchKeys.some(key => {
          const value = item[key]
          return value && String(value).toLowerCase().includes(query)
        })
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(item => String(item[key]) === value)
      }
    })

    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]
        
        if (aVal === bVal) return 0
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1
        
        const comparison = aVal < bVal ? -1 : 1
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [data, searchQuery, searchKeys, filters, sortColumn, sortDirection])

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const activeFilterCount = Object.values(filters).filter(v => v).length + (searchQuery ? 1 : 0)

  if (loading) {
    return (
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
      {/* Search and Filter Bar */}
      <div className="p-4 border-b border-[#2D3B5F]">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          {/* Filter Toggle */}
          {filterableColumns.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-[#0EA5E9]/20 border-[#0EA5E9] text-[#0EA5E9]'
                  : 'bg-[#0A0F2C] border-[#2D3B5F] text-[#94A3B8] hover:text-white'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#0EA5E9] text-white text-xs rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-[#94A3B8] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        {showFilters && filterableColumns.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[#2D3B5F]">
            {filterableColumns.map(column => (
              <div key={String(column.key)} className="min-w-[150px]">
                <label className="block text-[#64748B] text-xs mb-1">{column.label}</label>
                <select
                  value={filters[String(column.key)] || ''}
                  onChange={(e) => setFilters({ ...filters, [String(column.key)]: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                >
                  <option value="">All</option>
                  {getFilterOptions(column).map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2D3B5F]">
              {columns.map(column => (
                <th
                  key={String(column.key)}
                  className={`text-left px-4 py-3 text-[#64748B] text-sm font-medium ${column.className || ''}`}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(String(column.key))}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      {column.label}
                      <span className="flex flex-col">
                        <ChevronUp className={`w-3 h-3 -mb-1 ${
                          sortColumn === column.key && sortDirection === 'asc' 
                            ? 'text-[#0EA5E9]' 
                            : 'text-[#64748B]'
                        }`} />
                        <ChevronDown className={`w-3 h-3 ${
                          sortColumn === column.key && sortDirection === 'desc' 
                            ? 'text-[#0EA5E9]' 
                            : 'text-[#64748B]'
                        }`} />
                      </span>
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  {emptyIcon && <div className="flex justify-center mb-4">{emptyIcon}</div>}
                  <div className="text-[#64748B]">{emptyMessage}</div>
                </td>
              </tr>
            ) : (
              processedData.map((item, index) => (
                <tr
                  key={item.id || index}
                  onClick={() => onRowClick?.(item)}
                  className={`border-b border-[#2D3B5F] last:border-0 ${
                    onRowClick ? 'cursor-pointer hover:bg-[#0A0F2C]/50' : ''
                  }`}
                >
                  {columns.map(column => (
                    <td
                      key={String(column.key)}
                      className={`px-4 py-3 ${column.className || ''}`}
                    >
                      {column.render 
                        ? column.render(item) 
                        : String(item[column.key as keyof T] ?? '-')
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      <div className="px-4 py-3 border-t border-[#2D3B5F] text-[#64748B] text-sm">
        Showing {processedData.length} of {data.length} results
      </div>
    </div>
  )
}
