# e2e-file-upload

An image upload to Vercel Blob, used as an example of end-to-end testing file uploads, drag-and-drop, and downloads with [e2e](https://www.npmjs.com/package/e2e).

## How it works

- **Upload panel** (`components/uploader.tsx`) takes an image from the file picker or a drop, and checks its type and size before anything is sent.
- **`POST /api/upload`** (`app/api/upload/route.ts`) gives the browser a short-lived upload token with the same limits, and the browser sends the file straight to a private Vercel Blob store.
- **`GET /api/files/…`** (`app/api/files/[...pathname]/route.ts`) streams the stored file back for the preview and the Download button.

The page takes PNG, JPEG, and WebP images up to 4 MB (`lib/files.ts`). There is no database: Blob holds the files.

### Test files

| File                       | Result                                  |
| -------------------------- | --------------------------------------- |
| `tests/files/photo.png`    | Uploaded                                |
| `tests/files/invoice.pdf`  | Refused: not a PNG, JPEG, or WebP image |
| A 5 MB PNG the test writes | Refused: over 4 MB                      |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
