import { get } from "@vercel/blob";
import type { NextRequest } from "next/server";

import { isUploadPathname } from "@/lib/files";

// Streams an uploaded file from the private store. The preview shows it; ?download=1 saves it under its own name.
export async function GET(request: NextRequest, ctx: RouteContext<"/api/files/[...pathname]">) {
  const pathname = (await ctx.params).pathname.join("/");
  if (!isUploadPathname(pathname)) return new Response("Not found", { status: 404 });

  const result = await get(pathname, { access: "private" });
  if (result?.statusCode !== 200) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": result.blob.contentType ?? "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-cache",
  });
  if (result.blob.size !== null) headers.set("Content-Length", String(result.blob.size));
  if (request.nextUrl.searchParams.has("download")) {
    const name = pathname.slice(pathname.lastIndexOf("/") + 1);
    headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(name)}`);
  }
  return new Response(result.stream, { headers });
}
