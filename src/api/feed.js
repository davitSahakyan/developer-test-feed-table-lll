const API_URL = 'http://130.61.77.93:50940/api/developer/QueryFeed'
const DEVELOPER_KEY = 'usearch-dev-2025'

export const parseApiResponse = (json) => {
  let rows = []
  if (Array.isArray(json)) {
    rows = json
  } else if (Array.isArray(json?.data)) {
    rows = json.data
  } else if (Array.isArray(json?.items)) {
    rows = json.items
  } else if (json && typeof json === 'object') {
    const possibleArray = Object.values(json).find(v => Array.isArray(v))
    rows = Array.isArray(possibleArray) ? possibleArray : []
  }
  return rows ?? []
}

export const extractTotalRecords = (json) => {
  const totalRecs =
    json?.totalRecords ??
    json?.total ??
    json?.count ??
    json?.TotalRecords ??
    undefined
  return typeof totalRecs === 'number' ? totalRecs : undefined
}

export const extractTotalPages = (json, totalRecords, pageSize) => {
  const totalPgs =
    json?.totalPages ??
    json?.TotalPages ??
    (typeof totalRecords === 'number' ? Math.max(1, Math.ceil(totalRecords / pageSize)) : undefined)
  return typeof totalPgs === 'number' ? totalPgs : undefined
}

// React Query fetcher: receives pageNumber/pageSize and optional AbortSignal
export async function queryFeed({ pageNumber, pageSize, signal }) {
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
  const totalRecords = extractTotalRecords(json)
  const totalPages = extractTotalPages(json, totalRecords, pageSize)

  return { rows, totalRecords, totalPages }
}


