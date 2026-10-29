// What the page accepts. The upload token carries the same limits, so Blob refuses what the page would.

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

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
