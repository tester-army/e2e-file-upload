// Shared by the page and the upload token, so Blob refuses what the page would.

const FORMATS: Record<string, string> = { "image/png": "PNG", "image/jpeg": "JPEG", "image/webp": "WebP" };

export const IMAGE_TYPES = Object.keys(FORMATS);

// 1 MB is 1,000,000 bytes here, as in Finder.
export const MAX_BYTES = 4_000_000;

export const LIMITS = "PNG, JPEG, or WebP, up to 4 MB";

export function checkFile(file: { name: string; type: string; size: number }): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return `${file.name} isn't a PNG, JPEG, or WebP image.`;
  if (file.size > MAX_BYTES) return `${file.name} is ${formatSize(file.size)}. Images can be up to 4 MB.`;
  return null;
}

const decimal = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });

export function formatSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${decimal.format(bytes / 1000)} KB`;
  return `${decimal.format(bytes / 1_000_000)} MB`;
}

export function formatName(type: string): string {
  return FORMATS[type] ?? type;
}

// Each upload gets its own folder, so names never collide and the download keeps the file's own name.
const UPLOAD_PATHNAME = /^uploads\/[0-9a-f-]{36}\/[^/]{1,200}$/;

export function uploadPathname(name: string): string {
  return `uploads/${crypto.randomUUID()}/${name}`;
}

export function isUploadPathname(pathname: string): boolean {
  return UPLOAD_PATHNAME.test(pathname);
}

// Blob's get() puts the pathname into the blob's URL as it is, so a name with #, ?, or % needs encoding.
export function encodePathname(pathname: string): string {
  return pathname.split("/").map(encodeURIComponent).join("/");
}

// The store is private, so files are served by our route, not by the blob's own URL.
export function fileUrl(pathname: string, { download = false } = {}): string {
  return `/api/files/${encodePathname(pathname)}${download ? "?download=1" : ""}`;
}
