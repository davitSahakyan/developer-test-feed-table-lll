import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
} from '@tanstack/react-table'

const API_URL = 'http://130.61.77.93:50940/api/developer/QueryFeed'
const DEVELOPER_KEY = 'usearch-dev-2025'

const DEFAULT_PAGE_SIZE = 50
const PAGE_SIZE_OPTIONS = [25, 50, 100]

// Helper: Parse API response to extract data array
const parseApiResponse = (json) => {
  let rows = []
  if (Array.isArray(json)) {
    rows = json
  } else if (Array.isArray(json?.Items)) {
    rows = json.Items
  } else if (Array.isArray(json?.items)) {
    rows = json.items
  } else if (Array.isArray(json?.data)) {
    rows = json.data
  } else {
    if (json && typeof json === 'object') {
      const possibleArray = Object.values(json).find(v => Array.isArray(v))
      rows = Array.isArray(possibleArray) ? possibleArray : []
    }
  }
  return rows ?? []
}

// Helper: Extract total records from response
const extractTotalRecords = (json) => {
  const totalRecs =
    json?.TotalItems ??
    json?.totalItems ??
    json?.totalRecords ??
    json?.TotalRecords ??
    json?.total ??
    json?.count ??
    undefined
  return typeof totalRecs === 'number' ? totalRecs : undefined
}

// Helper: Extract or calculate total pages
const extractTotalPages = (json, totalRecords, pageSize) => {
  const totalPgs =
    json?.totalPages ??
    json?.TotalPages ??
    (typeof totalRecords === 'number' ? Math.max(1, Math.ceil(totalRecords / pageSize)) : undefined)
  return typeof totalPgs === 'number' ? totalPgs : undefined
}

// Helper: Check if string is a valid URL
const isUrl = (str) => {
  if (typeof str !== 'string') return false
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Helper: Render cell value with URL detection
const renderCellValue = (value) => {
  if (value === null || value === undefined) return ''
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  
  const strValue = String(value)
  
  // Check if it's a URL
  if (isUrl(strValue)) {
    return (
      <a 
        href={strValue} 
        target="_blank" 
        rel="noopener noreferrer"
        className="tableLink"
        title={strValue}
      >
        {strValue}
      </a>
    )
  }
  
  return strValue
}

// Helper: Generate columns from data
const generateColumnsFromData = (data) => {
  const columnHelper = createColumnHelper()
  const first = data?.[0]
  if (!first || typeof first !== 'object') return []

  return Object.keys(first).map((key) =>
    columnHelper.accessor(row => row?.[key], {
      id: key,
      header: () => key,
      cell: info => renderCellValue(info.getValue()),
    })
  )
}

export default function FeedTable() {
  const [data, setData] = useState([])
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [error, setError] = useState('')
  const [totalRecords, setTotalRecords] = useState(undefined)
  const [totalPages, setTotalPages] = useState(undefined)

  const abortRef = useRef(null)

  const {
    data: queryData,
    isLoading: queryLoading,
    isFetching,
    error: queryError,
  } = useQuery({
    queryKey: ['feed', pageNumber, pageSize],
    queryFn: async ({ signal }) => {
      // Track the latest signal in case we need it elsewhere
      abortRef.current = { abort: () => (signal?.abort ? signal.abort() : undefined) }
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'DeveloperKey': DEVELOPER_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pageNumber, pageSize }),
        signal,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Request failed (${res.status}): ${text || res.statusText}`)
      }
      const json = await res.json()
      const rows = parseApiResponse(json)
      const totalRecs = extractTotalRecords(json)
      const totalPgs = extractTotalPages(json, totalRecs, pageSize)
      return { rows, totalRecords: totalRecs, totalPages: totalPgs }
    },
    keepPreviousData: true,
    staleTime: 5_000,
  })

  useEffect(() => {
    setIsLoading(queryLoading)
    setError(queryError ? queryError.message : '')
    if (queryData) {
      setData(queryData.rows)
      setTotalRecords(queryData.totalRecords)
      setTotalPages(queryData.totalPages)
      setHasLoadedOnce(true)
    }
  }, [queryData, queryLoading, queryError])

  const columns = useMemo(() => generateColumnsFromData(data), [data])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const canGoPrev = pageNumber > 1
  const canGoNext = totalPages ? pageNumber < totalPages : data.length === pageSize

  const onFirst = useCallback(() => {
    if (canGoPrev) setPageNumber(1)
  }, [canGoPrev])

  const onPrev = useCallback(() => {
    if (canGoPrev) setPageNumber(p => Math.max(1, p - 1))
  }, [canGoPrev])

  const onNext = useCallback(() => {
    if (canGoNext) setPageNumber(p => p + 1)
  }, [canGoNext])

  const onLast = useCallback(() => {
    if (totalPages) setPageNumber(totalPages)
  }, [totalPages])

  const onJump = useCallback((e) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements['jumpPage']
    const raw = input.value.trim()
    if (!raw) return
    const num = Number(raw)
    if (Number.isNaN(num)) return

    if (totalPages) {
      const clamped = Math.min(Math.max(1, num), totalPages)
      setPageNumber(clamped)
    } else {
      setPageNumber(Math.max(1, num))
    }
  }, [totalPages])

  const visibleRows = data?.length ?? 0
  const visibleCols = columns?.length ?? 0

  // Calculate row range for current page
  const startRow = totalRecords ? (pageNumber - 1) * pageSize + 1 : 1
  const endRow = totalRecords 
    ? Math.min(pageNumber * pageSize, totalRecords)
    : (pageNumber - 1) * pageSize + visibleRows

  return (
    <div className="card">
      <div className="tableInfo">
        <div className="infoItem">
          <span className="infoLabel">Rows:</span>
          <strong className="infoValue">{visibleRows}</strong>
          {totalRecords && <span className="infoMuted"> (showing {startRow}-{endRow} of {totalRecords.toLocaleString()})</span>}
        </div>
        <div className="infoItem">
          <span className="infoLabel">Columns:</span>
          <strong className="infoValue">{visibleCols}</strong>
        </div>
        {totalPages && (
          <div className="infoItem">
            <span className="infoLabel">Page:</span>
            <strong className="infoValue">{pageNumber} / {totalPages}</strong>
          </div>
        )}
      </div>

      <div className="tableWrap">
        {(!hasLoadedOnce || isLoading) && (
          <div className="loadingOverlay" aria-live="polite" aria-busy="true">
            <div className="spinner" />
            <div className="loadingText">Loading…</div>
          </div>
        )}
        <table>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {(!hasLoadedOnce || isLoading) ? (
              <tr>
                <td colSpan={Math.max(1, visibleCols)} className="center">
                  Loading…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={Math.max(1, visibleCols)} className="error">
                  {error}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={Math.max(1, visibleCols)} className="center">
                  No data
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="paginationBar">
        <div className="pager">
          <div className="pagerNav">
            <button onClick={onFirst} disabled={!canGoPrev} aria-label="First page" title="First page">«</button>
            <button onClick={onPrev} disabled={!canGoPrev} aria-label="Previous page" title="Previous page">‹</button>
            <span className="pageInfo">Page {pageNumber}{totalPages ? ` of ${totalPages}` : ''}</span>
            <button onClick={onNext} disabled={!canGoNext} aria-label="Next page" title="Next page">›</button>
            <button onClick={onLast} disabled={!totalPages || pageNumber === totalPages} aria-label="Last page" title="Last page">»</button>
          </div>

          <div className="pagerControls">
            <form className="jumpForm" onSubmit={onJump}>
              <label htmlFor="jumpPage" className="srOnly">Go to page</label>
              <span>Jump to:</span>
              <input
                id="jumpPage"
                name="jumpPage"
                type="number"
                min={1}
                max={totalPages || undefined}
                inputMode="numeric"
                placeholder="Page"
              />
              <button type="submit">Go</button>
            </form>

            <div className="pageSize">
              <label htmlFor="pageSize" className="srOnly">Rows per page</label>
              <span>Show:</span>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => {
                  const next = Number(e.target.value)
                  setPageSize(next)
                  setPageNumber(1)
                }}
              >
                {PAGE_SIZE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt} rows</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
