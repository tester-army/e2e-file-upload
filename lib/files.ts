// What the page accepts. The upload token carries the same limits, so Blob refuses what the page would.

const FORMATS: Record<string, string> = { "image/png": "PNG", "image/jpeg": "JPEG", "image/webp": "WebP" };

export const IMAGE_TYPES = Object.keys(FORMATS);

// 1 MB is 1,000,000 bytes here, as in Finder.
export const MAX_BYTES = 4_000_000;

export const LIMITS = "PNG, JPEG, or WebP, up to 4 MB";

/** Why the page refuses a file, or null when it can be uploaded. */
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

/** Where the app serves an uploaded file: the store is private, so a blob's own URL needs a token. */
export function fileUrl(pathname: string, { download = false } = {}): string {
  const path = pathname.split("/").map(encodeURIComponent).join("/");
  return `/api/files/${path}${download ? "?download=1" : ""}`;
}
