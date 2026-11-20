# ImagePicker Specification

## Overview

The ImagePicker allows users to select images for display on dashboard cards. Images are stored on the server and served only through the API; no file under the data directory is served directly.

## Image Storage & Serving

### Storage Location

- **Path**: `images/` inside the data directory (`data/images/` in the default Docker setup, mounted into the container)
- **Files**: JPEG, PNG, GIF, WebP uploads (an administrator may also place SVG files there; uploads of SVG are rejected)

### Serving

- **Everywhere (Docker and dev)**: `GET /api/images/{filename}`, served by the Node.js backend.
  - Public (no sign-in), so dashboards render images without extra requests; listing, upload and delete require an editor session.
  - Optional resizing: `?width=`, `?height=` (capped at 4096), `?quality=`, `?format=`.
  - Responses carry `X-Content-Type-Options: nosniff` and a sandboxing Content-Security-Policy.
- Nginx and the Vite proxy forward `/api/` to the backend. Nginx serves nothing below `/data/` (404).

## API Endpoints

### GET `/api/images`

**Purpose**: List all available images (editor session required)

**Response**:

```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": "photo.jpg",
        "url": "/api/images/photo.jpg",
        "name": "photo",
        "size": 102400,
        "mtime": "2026-03-22T08:00:00Z"
      }
    ]
  }
}
```

**Key Point**: `url` is the API path `/api/images/{filename}` and can be used as an `<img src>` as-is.

### POST `/api/images/upload`

**Purpose**: Upload new images (editor session required; content is verified, never overwrites)

**Response**: Returns array of newly uploaded images with their `/api/images/` URLs

### DELETE `/api/images/{id}`

**Purpose**: Delete an image by filename (editor session required)

---

## Frontend Behavior (ImagePicker.vue)

### Display Images in Picker

1. Fetch list from `GET /api/images`
2. For each image, use `image.url` directly as the preview `<img src>`
3. Preview displays: `<img :src="image.url" />` → loads from `/api/images/`

### Select an Image

1. User clicks image in picker
2. Store the `image.url` value directly: `/api/images/{filename}`
3. Emit to parent: `update:modelValue` with `/api/images/{filename}`

### Selected Image Display

1. When a card displays the selected image, it uses the stored URL
2. `<img :src="selectedImageUrl" />` → loads from `/api/images/`
3. Only `/api/...` paths, absolute `http(s)://` URLs and `data:` URLs are resolved; anything else (such as the old `/data/images/...` static paths) shows the card's empty state.

---

## URL Consistency

| Operation            | URL Format               | Example                 |
| -------------------- | ------------------------ | ----------------------- |
| API returns URLs     | `/api/images/{filename}` | `/api/images/photo.jpg` |
| Frontend stores URLs | `/api/images/{filename}` | `/api/images/photo.jpg` |
| Frontend displays    | `/api/images/{filename}` | `/api/images/photo.jpg` |
| HTML img src         | `/api/images/{filename}` | `/api/images/photo.jpg` |

**No Conversion Needed**: Use URLs as-is throughout the entire flow.

---

## Vite Configuration (Dev Mode)

Only the API needs to be proxied; no static data path exists:

```javascript
server: {
  proxy: {
    "/api": "http://localhost:3000",
  },
}
```
