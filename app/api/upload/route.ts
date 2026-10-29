import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import { IMAGE_TYPES, MAX_BYTES, isUploadPathname } from "@/lib/files";

// Hands the browser a short-lived token for one upload, and Blob enforces its limits even when the page's own check
// is skipped. There's no sign-in here: a real app checks who is uploading before it returns a token.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!isUploadPathname(pathname)) throw new Error(`Not an upload pathname: ${pathname}`);
        return { allowedContentTypes: IMAGE_TYPES, maximumSizeInBytes: MAX_BYTES };
      },
    });
    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
