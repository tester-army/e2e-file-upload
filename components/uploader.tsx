"use client";

import { upload } from "@vercel/blob/client";
import clsx from "clsx";
import Image from "next/image";
import { useState, type DragEvent } from "react";

import { LightButton } from "@/components/ui/light-button";
import { OUTLINE_BUTTON } from "@/components/ui/outline-button";
import { IMAGE_TYPES, LIMITS, checkFile, fileUrl, formatName, formatSize, uploadPathname } from "@/lib/files";

type Uploaded = { pathname: string; name: string; size: number; type: string };

export function Uploader() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<Uploaded | null>(null);

  // The picker and a drop both end here, so the same checks apply to both. `accept` only filters the picker.
  function pick(picked: File | undefined) {
    if (!picked || uploading) return;
    const problem = checkFile(picked);
    setFile(problem ? null : picked);
    setError(problem);
  }

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    pick(event.dataTransfer.files[0]);
  }

  // The file goes from the browser straight to Blob, with a token from POST /api/upload.
  async function send(image: File) {
    setUploading(true);
    setError(null);
    try {
      const blob = await upload(uploadPathname(image.name), image, {
        access: "private",
        handleUploadUrl: "/api/upload",
        contentType: image.type,
      });
      setUploaded({ pathname: blob.pathname, name: image.name, size: image.size, type: image.type });
      setFile(null);
    } catch (cause) {
      console.error(cause);
      setError(`Couldn't upload ${image.name}. Try again.`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section
      aria-label="Upload an image"
      className="flex flex-col gap-4 border border-e2e-hairline-strong bg-e2e-panel p-5"
    >
      <label
        data-testid="dropzone"
        data-dragging={dragging || undefined}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={drop}
        className={clsx(
          "flex cursor-pointer flex-col items-center gap-2 px-6 py-12 text-center",
          "border border-dashed border-e2e-field-stroke bg-e2e-field-fill transition-colors motion-reduce:transition-none",
          "hover:border-e2e-white-50 has-focus-visible:border-e2e-white-80",
          "data-dragging:border-e2e-paper-0 data-dragging:bg-e2e-white-6",
        )}
      >
        <input
          type="file"
          accept={IMAGE_TYPES.join(",")}
          aria-label="Choose an image"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => {
            pick(event.target.files?.[0]);
            // Lets the same file be picked again.
            event.target.value = "";
          }}
        />
        <span className="type-h3-display text-e2e-text-bright">
          {dragging ? "Drop to add it" : "Drop an image here"}
        </span>
        <span className="type-code-s text-e2e-text-soft underline underline-offset-4">or choose a file</span>
        <span className="mt-2 type-caption text-e2e-text-faint">{LIMITS}</span>
      </label>

      {file ? (
        <p data-testid="picked-file" className="type-code-s text-e2e-text-secondary">
          {file.name} · {formatSize(file.size)}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="type-body-s text-e2e-accent">
          {error}
        </p>
      ) : null}

      <LightButton disabled={!file || uploading} onClick={() => file && send(file)}>
        {uploading ? "Uploading…" : "Upload"}
      </LightButton>

      {uploaded ? <FileCard file={uploaded} /> : null}
    </section>
  );
}

function FileCard({ file }: { file: Uploaded }) {
  return (
    <div data-testid="file-card" className="mt-2 flex flex-col gap-4 border-t border-e2e-hairline pt-6">
      <div className="relative aspect-16/10 bg-e2e-canvas">
        <Image
          src={fileUrl(file.pathname)}
          alt={`Preview of ${file.name}`}
          fill
          unoptimized
          sizes="440px"
          className="object-contain"
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p data-testid="file-name" className="truncate type-code-s text-e2e-text-bright">
            {file.name}
          </p>
          <p data-testid="file-details" className="type-caption text-e2e-text-faint">
            {formatSize(file.size)} · {formatName(file.type)}
          </p>
        </div>
        <div className="w-36 shrink-0">
          <a href={fileUrl(file.pathname, { download: true })} download className={OUTLINE_BUTTON}>
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
