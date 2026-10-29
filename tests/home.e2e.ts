import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { test } from "@e2e-dev/web";
import { expect } from "e2e";

import { PDF, PHOTO, dropFile, panel } from "./fixtures";

test("the panel is ready for an image", async ({ app, screen }) => {
  await app.open("/");
  await expect(screen.getByTestId("dropzone")).toContainText("Drop an image here");
  await expect(screen.getByText("PNG, JPEG, or WebP, up to 4 MB")).toBeVisible();
  await expect(panel(screen).getByRole("button", "Upload")).not.toBeEnabled();
});

test("a PDF is refused", async ({ app, screen, browser }) => {
  await app.open("/");
  await dropFile(browser, PDF);
  await expect(panel(screen).getByRole("alert")).toHaveText("invoice.pdf isn't a PNG, JPEG, or WebP image.");
  await expect(panel(screen).getByRole("button", "Upload")).not.toBeEnabled();
});

test("an image over 4 MB is refused", async ({ app, screen }) => {
  // 5 MB stays out of git: the test writes it, and setInputFiles takes an absolute path.
  const folder = await mkdtemp(join(tmpdir(), "e2e-file-upload-"));
  try {
    const big = join(folder, "big.png");
    await writeFile(big, Buffer.alloc(5_000_000));

    await app.open("/");
    await screen.getByLabel("Choose an image").setInputFiles(big);
    await expect(panel(screen).getByRole("alert")).toHaveText("big.png is 5 MB. Images can be up to 4 MB.");
    await expect(panel(screen).getByRole("button", "Upload")).not.toBeEnabled();
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test("a failed upload says so", async ({ app, screen, browser }) => {
  // Our token route fails, so nothing reaches Blob and no key is needed.
  await browser.route("**/api/upload", (route) => route.fulfill({ status: 500, json: { error: "Down for the test" } }));
  await app.open("/");
  await screen.getByLabel("Choose an image").setInputFiles(PHOTO.path);
  await panel(screen).getByRole("button", "Upload").tap();

  await expect(panel(screen).getByRole("alert")).toHaveText("Couldn't upload photo.png. Try again.");
  await expect(screen.getByTestId("picked-file")).toHaveText("photo.png · 207 KB");
  await expect(panel(screen).getByRole("button", "Upload")).toBeEnabled();
});
