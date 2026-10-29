import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

import { test as base, type Browser } from "@e2e-dev/web";
import { del, get } from "@vercel/blob";
import { expect, type Screen } from "e2e";

export const blobSkip = process.env.BLOB_READ_WRITE_TOKEN ? false : "set BLOB_READ_WRITE_TOKEN to run the Blob tests";
// The AI Gateway takes an API key, or the OIDC token of a linked Vercel project.
export const agentSkip =
  process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
    ? false
    : "set AI_GATEWAY_API_KEY to run the agent test";

export type TestFile = { path: string; type: string };

// Project-relative, as `setInputFiles` and the agent's `upload` resolve them.
export const PHOTO: TestFile = { path: "tests/files/photo.png", type: "image/png" };
export const PDF: TestFile = { path: "tests/files/invoice.pdf", type: "application/pdf" };

const projectRoot = new URL("../", import.meta.url);

export function readTestFile(file: TestFile) {
  return readFile(new URL(file.path, projectRoot));
}

export function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

// Next.js adds its own role="alert" (the route announcer), so queries stay inside the upload panel.
export const panel = (screen: Screen) => screen.getByRole("region", "Upload an image");

/**
 * Drops a file on the dropzone. e2e can't drag a file from the desktop, so the page builds the File and gets the
 * events a real drop sends. Only the OS part is skipped: the events' `isTrusted` is false.
 */
export async function dropFile(
  browser: Browser,
  file: TestFile,
  events: string[] = ["dragenter", "dragover", "drop"],
): Promise<void> {
  const bytes = (await readTestFile(file)).toString("base64");
  await browser.evaluate(
    ({ name, type, bytes, events }) => {
      const dropzone = document.querySelector('[data-testid="dropzone"]');
      if (!dropzone) throw new Error("No dropzone on the page");
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(new File([Uint8Array.from(atob(bytes), (char) => char.charCodeAt(0))], name, { type }));
      for (const event of events) {
        dropzone.dispatchEvent(new DragEvent(event, { bubbles: true, cancelable: true, dataTransfer }));
      }
      return null;
    },
    { name: basename(file.path), type: file.type, bytes, events },
  );
}

export type Uploads = {
  /** Waits for the card and reads the blob's pathname from its Download link. */
  fromCard(screen: Screen): Promise<string>;
  /** Remembers a pathname a test may have uploaded to. */
  track(pathname: string): void;
  /** The blob's bytes, read from the store with the read-write token. */
  bytes(pathname: string): Promise<Buffer>;
};

// Every blob a test made is deleted after it, after a failure too. The tests never list or empty the store.
export const test = base.extend<{ uploads: Uploads }>({
  uploads: async ({}, use) => {
    const pathnames = new Set<string>();

    await use({
      fromCard: async (screen) => {
        await expect(screen.getByTestId("file-card")).toBeVisible({ timeout: 30_000 });
        const href = (await screen.getByRole("link", "Download").getAttribute("href")) ?? "";
        const path = new URL(href, "http://app").pathname.replace(/^\/api\/files\//, "");
        const pathname = path.split("/").map(decodeURIComponent).join("/");
        pathnames.add(pathname);
        return pathname;
      },
      track: (pathname) => {
        pathnames.add(pathname);
      },
      bytes: async (pathname) => {
        const result = await get(pathname, { access: "private", useCache: false });
        if (result?.statusCode !== 200) throw new Error(`${pathname} isn't in the store`);
        return Buffer.from(await new Response(result.stream).arrayBuffer());
      },
    });

    if (pathnames.size > 0) await del([...pathnames]);
  },
});
