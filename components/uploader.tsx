"use client";

import clsx from "clsx";
import { useState, type DragEvent } from "react";

import { LightButton } from "@/components/ui/light-button";
import { IMAGE_TYPES, LIMITS, checkFile, formatSize } from "@/lib/files";

export function Uploader() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // The picker and a drop both end here, so the same checks apply to both. `accept` only filters the picker.
  function pick(picked: File | undefined) {
    if (!picked) return;
    const problem = checkFile(picked);
    setFile(problem ? null : picked);
    setError(problem);
  }

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    pick(event.dataTransfer.files[0]);
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

      {error ? (
        <p role="alert" className="type-body-s text-e2e-accent">
          {error}
        </p>
      ) : file ? (
        <p data-testid="picked-file" className="type-code-s text-e2e-text-secondary">
          {file.name} · {formatSize(file.size)}
        </p>
      ) : null}

      <LightButton disabled={!file}>Upload</LightButton>
    </section>
  );
}
