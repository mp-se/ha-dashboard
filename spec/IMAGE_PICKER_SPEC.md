# ImagePicker Specification

## Overview
The ImagePicker allows users to select images for display on dashboard cards. Images are stored on the server and served via HTTP.

## Image Storage & Serving

### Storage Location
- **Path**: `/public/data/images/`
- **Files**: JPEG, PNG, GIF, WebP, SVG images

### Serving
- **Docker (Production)**:
  - Nginx serves `/data/images/` directly from mounted volume
  - URL to use: `GET /data/images/{filename}` → static file from Nginx

- **Dev Mode**:
  - Vite dev server needs to serve `/data/images/`
  - Vite proxy should forward requests to this directory
  - URL to use: `GET /data/images/{filename}` → served by Vite

## API Endpoints

### GET `/api/images`
**Purpose**: List all available images in `/public/data/images/`

**Response**:
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": "photo.jpg",
        "url": "/data/images/photo.jpg",
        "name": "photo",
        "size": 102400,
        "mtime": "2026-03-22T08:00:00Z"
      }
    ]
  }
}
```

**Key Point**: `url` field returns `/data/images/{filename}` - the direct static path that can be used to display the image.

### POST `/api/images/upload`
**Purpose**: Upload new images

**Response**: Returns array of newly uploaded images with their `/data/images/` URLs

### DELETE `/api/images/{id}`
**Purpose**: Delete an image by filename

---

## Frontend Behavior (ImagePicker.vue)

### Display Images in Picker
1. Fetch list from `GET /api/images`
2. For each image, use `image.url` directly as the preview `<img src>`
3. Preview displays: `<img :src="image.url" />` → loads from `/data/images/`

### Select an Image
1. User clicks image in picker
2. Store the `image.url` value directly: `/data/images/{filename}`
3. Emit to parent: `update:modelValue` with `/data/images/{filename}`

### Selected Image Display
1. When card displays selected image, use the stored URL
2. `<img :src="selectedImageUrl" />` → loads from `/data/images/`

---

## URL Consistency

| Operation | URL Format | Example |
|-----------|-----------|---------|
| API returns URLs | `/data/images/{filename}` | `/data/images/photo.jpg` |
| Frontend stores URLs | `/data/images/{filename}` | `/data/images/photo.jpg` |
| Frontend displays | `/data/images/{filename}` | `/data/images/photo.jpg` |
| HTML img src | `/data/images/{filename}` | `/data/images/photo.jpg` |

**No Conversion Needed**: Use URLs as-is throughout the entire flow.

---

## Vite Configuration (Dev Mode)

Vite's dev server must allow static asset access:
```javascript
server: {
  proxy: {
    "/api": "http://localhost:3000",
    "/data": "http://localhost:3000"  // Forward /data/ requests
  }
}
```

Or serve from `public/data/` directory.
