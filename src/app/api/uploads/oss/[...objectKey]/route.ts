import { NextResponse } from "next/server";
import { readAliyunOssObject } from "@/server/oss-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OssUploadRouteProps = {
  params: Promise<{
    objectKey: string[];
  }>;
};

export async function GET(_request: Request, { params }: OssUploadRouteProps) {
  const { objectKey } = await params;
  if (!objectKey.length || objectKey.some((part) => !part || part === "." || part === "..")) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  try {
    const response = await readAliyunOssObject(objectKey.join("/"));
    const contentType = response.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentType,
      },
    });
  } catch {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}
