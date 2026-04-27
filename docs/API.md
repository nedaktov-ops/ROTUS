# ROTUS API Reference

Base URL: `http://localhost:3000` (or your deployed domain)

All endpoints return JSON.

---

## Health & Stats

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-27T18:51:29.323Z",
  "uptime": 2.015971758
}
```

### `GET /api/stats`

Overall statistics about the quote collection.

**Response:**
```json
{
  "total": 54,
  "verified": 54,
  "sources": 3,
  "byCategory": [
    {"category": "funny", "count": 12},
    {"category": "lie", "count": 13}
  ]
}
```

---

## Quotes

### `GET /api/quotes`

List quotes with optional filters and pagination.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Full-text search across quote text and context |
| `platform` | string | Filter by platform (exact match) |
| `category` | string | Filter by category |
| `limit` | integer | Number of results to return (default: all) |
| `offset` | integer | Number of results to skip (for pagination) |
| `sort` | `date` \| `category` \| `platform` | Sort field (default: `date`) |
| `order` | `asc` \| `desc` | Sort direction (default: `desc` for date, `asc` otherwise) |

**Example:**
```
GET /api/quotes?q=best&limit=10&offset=20&sort=category&order=asc
```

**Response:** Array of quote objects

### `GET /api/quotes/random`

Return a single random verified quote. Same structure as `GET /api/quotes/:id` but with `sources` array populated.

**Response:** Quote object with `sources` array.

### `GET /api/quotes/:id`

Get a specific quote by ID, with embedded sources.

**Response:** Quote object with `sources` array.

### `POST /api/quotes`

Create a new quote (admin use). All fields accept JSON payload.

**Payload:**
```json
{
  "quote_text": "string",
  "date_spoken": "YYYY-MM-DD",
  "platform": "Speech",
  "context": "string",
  "source_url": "string",
  "source_name": "string",
  "category": "funny",
  "sources": [{ "url": "...", "title": "...", "source_type": "factcheck", "publication_date": "...", "verified_by": "..." }],
  "entities": [{ "name": "...", "type": "person|place|organization|event" }],
  "tags": ["tag1", "tag2"]
}
```

The `sources`, `entities`, and `tags` arrays are optional. If `sources` omitted, falls back to `source_url` and `source_name` single source.

**Response:**
```json
{ "id": 42 }
```

---

## Related Resources

### `GET /api/quotes/:id/sources`
List sources for a quote.

### `GET /api/quotes/:id/entities`
List entities for a quote.

### `GET /api/quotes/:id/tags`
List tags for a quote.

### `GET /api/tags`
All tags with occurrence counts.

**Response:**
```json
[
  { "tag": "funny", "count": 12 },
  { "tag": "lie", "count": 13 }
]
```

---

## Notes

- Search uses SQLite FTS5 for efficient full-text search.
- Pagination uses `limit`/`offset`. For large datasets, use a reasonable limit.
- Authentication and rate limiting not implemented (assumed local or trusted network).

---

*Last updated: 2026-04-27*