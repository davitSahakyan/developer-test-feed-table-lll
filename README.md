# Developer Test — Feed Table

A responsive React app that fetches data from an API and displays it in a clean, paginated table using `@tanstack/react-table` and `@tanstack/react-query`.

## Features
- **Server-side pagination** via POST `/api/developer/QueryFeed`
- **Smart caching** with React Query for better performance
- **Responsive design** - works great on desktop, tablet, and mobile
- **Automatic URL detection** - URLs are clickable and open in new tabs
- **Dynamic columns** - automatically inferred from API data
- **Sticky headers** - column headers stay visible while scrolling
- **Page size selector** - choose 25, 50, or 100 rows per page
- **Navigation controls** - First/Previous/Next/Last page buttons
- **Jump to page** - quick navigation input field
- **Info display** - shows current rows, columns, and page counts
- **Loading states** - smooth loading overlay with spinner
- **Error handling** - displays clear error messages
- **Row range display** - shows "1-50 of 19,080 total records"

## Tech Stack
- React 18
- Vite 5
- @tanstack/react-table v8
- @tanstack/react-query v5

## Getting Started
```bash
npm install
npm run dev
```
Open `http://localhost:5173`.

Note: In this repo we disabled React StrictMode in `src/main.jsx` to avoid double-mount aborts in dev.

## API

### Endpoint
- **URL**: `/api/developer/QueryFeed` (proxied in development)
- **Real host**: Configured in `vite.config.js` proxy to `http://130.61.77.93:50940`
- **Method**: POST
- **Headers**:
  - `DeveloperKey: usearch-dev-2025`
  - `Content-Type: application/json`

### Request Body
```json
{
  "pageNumber": 1,
  "pageSize": 50
}
```

### Response Format
The API returns data in this format:
```json
{
  "Items": [...],
  "PageNumber": 1,
  "PageSize": 50,
  "TotalItems": 19080
}
```

The table automatically:
- Extracts data from `Items`, `items`, or `data` arrays
- Detects total records from `TotalItems`, `totalItems`, `totalRecords`, etc.
- Calculates total pages automatically
- Renders all keys as columns with automatic URL detection

## Build
```bash
npm run build
npm run preview
```

## Project Structure
```
src/
  App.jsx
  main.jsx
  components/FeedTable.jsx
  styles.css
vite.config.js
```

## Optimizations

### Performance
- **Memoized event handlers** with `useCallback` to prevent unnecessary re-renders
- **Memoized column generation** with `useMemo`
- **React Query caching** with 5-second stale time for smooth pagination
- **Request deduplication** and automatic retry handling
- **Abort controller** support for cancelled requests

### Code Quality
- **No unnecessary dependencies** - removed lodash, using native `Array.isArray()`
- **Helper functions** - extracted reusable utilities for cleaner code
- **Responsive design** - mobile-first CSS with proper breakpoints
- **Accessibility** - ARIA labels and semantic HTML

## UI/UX Features

### Table Display
- **Sticky headers** - stay visible while scrolling vertically
- **Max height** - table scrolls at 600px with smooth touch scrolling
- **Text overflow** - long content truncated with ellipsis
- **Hover effects** - row highlight on hover
- **Clickable URLs** - automatic detection and styling

### Pagination
- **Info bar** - displays row count, column count, and page info
- **Visual feedback** - buttons highlight on hover
- **Smart navigation** - buttons disable when unavailable
- **Row range** - shows "1-50 of 19,080" for clarity

### Responsive
- **Desktop** - full-width layout (max 1800px)
- **Tablet** - optimized spacing and controls
- **Mobile** - stacked pagination controls, smaller fonts

## Notes
- `.gitignore` excludes `node_modules` and build artifacts
- React StrictMode disabled in `src/main.jsx` to avoid double-mount in dev
- Modern, clean UI with professional styling

