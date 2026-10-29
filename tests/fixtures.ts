import { readFile } from "node:fs/promises";
import { basename } from "node:path";

import type { Browser } from "@e2e-dev/web";

export type TestFile = { path: string; type: string };

// Project-relative, as `setInputFiles` and the agent's `upload` resolve them.
export const PHOTO: TestFile = { path: "tests/files/photo.png", type: "image/png" };
export const PDF: TestFile = { path: "tests/files/invoice.pdf", type: "application/pdf" };

const projectRoot = new URL("../", import.meta.url);

/**
 * Drops a file on the dropzone. e2e can't drag a file from the desktop, so the page builds the File and gets the
 * events a real drop sends. Only the OS part is skipped: the events' `isTrusted` is false.
 */
export async function dropFile(browser: Browser, file: TestFile): Promise<void> {
  const bytes = (await readFile(new URL(file.path, projectRoot))).toString("base64");
  await browser.evaluate(
    ({ name, type, bytes }) => {
      const dropzone = document.querySelector('[data-testid="dropzone"]');
      if (!dropzone) throw new Error("No dropzone on the page");
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(new File([Uint8Array.from(atob(bytes), (char) => char.charCodeAt(0))], name, { type }));
      for (const event of ["dragenter", "dragover", "drop"]) {
        dropzone.dispatchEvent(new DragEvent(event, { bubbles: true, cancelable: true, dataTransfer }));
      }
      return null;
    },
    { name: basename(file.path), type: file.type, bytes },
  );
}
