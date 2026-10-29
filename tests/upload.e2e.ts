import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, type Browser } from "@e2e-dev/web";
import { head } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import { expect, type Screen } from "e2e";

import { PDF, PHOTO, agentSkip, blobSkip, dropFile, panel, readTestFile, sha256, test, type Uploads } from "./fixtures";

// The same card and the same blob, whichever way the photo came in.
async function expectPhotoUploaded(
  screen: Screen,
  browser: Browser,
  uploads: Uploads,
  name = "photo.png",
): Promise<string> {
  const pathname = await uploads.fromCard(screen);
  await expect(screen.getByTestId("file-name")).toHaveText(name);
  await expect(screen.getByTestId("file-details")).toHaveText("207 KB · PNG");

  // The preview loaded through our file route, at the photo's own size.
  const previewSize = () =>
    browser.evaluate(() => {
      const preview = document.querySelector<HTMLImageElement>('[data-testid="file-card"] img');
      return preview?.complete ? `${preview.naturalWidth}x${preview.naturalHeight}` : null;
    });
  await expect.poll(previewSize).toBe("1200x630");

  const photo = await readTestFile(PHOTO);
  expect(await head(pathname)).toMatchObject({ size: photo.length, contentType: "image/png" });
  return pathname;
}

describe("Vercel Blob uploads", { tags: ["blob"], skip: blobSkip }, () => {
  test(
    "the agent uploads an image and sees its preview",
    { skip: agentSkip },
    async ({ app, screen, agent, browser, uploads }) => {
      await app.open("/");

      // One goal: the agent finds the dropzone, attaches the file, and presses Upload.
      await agent.act("upload the image {file}", { params: { file: PHOTO.path } });

      await expectPhotoUploaded(screen, browser, uploads);
      await agent.assert("the preview shows the e2e wordmark above the words Open Source AI Testing Framework", {
        vision: true,
      });
    },
  );

  test("the download returns the same bytes", async ({ app, screen, browser, uploads }) => {
    await app.open("/");
    await screen.getByLabel("Choose an image").setInputFiles(PHOTO.path);
    await panel(screen).getByRole("button", "Upload").tap();
    const pathname = await expectPhotoUploaded(screen, browser, uploads);

    const file = await browser.waitForDownload(() => screen.getByRole("link", "Download").tap());
    expect(file.suggestedFilename).toBe("photo.png");

    // The file on disk, the blob in the store, and the download are the same bytes.
    const photo = sha256(await readTestFile(PHOTO));
    expect(sha256(await readFile(file.absolutePath))).toBe(photo);
    expect(sha256(await uploads.bytes(pathname))).toBe(photo);
  });

  test("a name with spaces and symbols keeps working", async ({ app, screen, browser, uploads }) => {
    // #, %, and spaces mean something in a URL, so every step that builds one has to encode the name.
    const name = "café menu #1 (100%).png";
    const folder = await mkdtemp(join(tmpdir(), "e2e-file-upload-"));
    try {
      await writeFile(join(folder, name), await readTestFile(PHOTO));
      await app.open("/");
      await screen.getByLabel("Choose an image").setInputFiles(join(folder, name));
      await panel(screen).getByRole("button", "Upload").tap();
      await expectPhotoUploaded(screen, browser, uploads, name);

      const file = await browser.waitForDownload(() => screen.getByRole("link", "Download").tap());
      expect(file.suggestedFilename).toBe(name);
      expect(sha256(await readFile(file.absolutePath))).toBe(sha256(await readTestFile(PHOTO)));
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  });

  test("drag-and-drop works like the picker", async ({ app, screen, browser, uploads }) => {
    await app.open("/");

    await dropFile(browser, PHOTO, ["dragenter"]);
    await expect(screen.getByTestId("dropzone")).toContainText("Drop to add it");
    await dropFile(browser, PHOTO, ["dragover", "drop"]);
    await expect(screen.getByTestId("dropzone")).toContainText("Drop an image here");
    await expect(screen.getByTestId("picked-file")).toHaveText("photo.png · 207 KB");

    await panel(screen).getByRole("button", "Upload").tap();
    await expectPhotoUploaded(screen, browser, uploads);
  });

  test("Blob refuses what the page refuses", async ({ app, uploads }) => {
    // No page: Node asks our route for a token, as a script that skips the page's checks would.
    const handleUploadUrl = new URL("/api/upload", app.baseUrl).href;
    async function refusal(pathname: string, body: BlobPart, contentType: string): Promise<string> {
      uploads.track(pathname);
      try {
        await upload(pathname, new Blob([body], { type: contentType }), {
          access: "private",
          handleUploadUrl,
          contentType,
        });
        return "uploaded";
      } catch (error) {
        return error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error);
      }
    }

    const big = await refusal(`uploads/${randomUUID()}/big.png`, new Uint8Array(5_000_000), "image/png");
    expect(big).toMatch(/^BlobFileTooLargeError: .*cannot be greater than 4000000 bytes/);

    const pdf = await refusal(`uploads/${randomUUID()}/invoice.pdf`, await readTestFile(PDF), "application/pdf");
    expect(pdf).toMatch(/^BlobContentTypeNotAllowedError: .*application\/pdf is not allowed/);

    // Our route hands out no token outside uploads/<uuid>/.
    const elsewhere = await refusal("other/photo.png", await readTestFile(PHOTO), "image/png");
    expect(elsewhere).toMatch(/^BlobError: .*Failed to +retrieve the client token/);
  });
});
