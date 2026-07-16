import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IpPrototypeUploadRouteProps = {
  params: Promise<{
    fileName: string;
  }>;
};

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: IpPrototypeUploadRouteProps,
) {
  const { fileName } = await params;

  if (!/^(draft|style)-\d{4}-\d{2}-\d{2}-[a-f0-9-]+\.(png|jpg|jpeg|webp)$/i.test(fileName)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  try {
    const filePath = path.join(
      process.cwd(),
      ".runtime",
      "uploads",
      "ip-prototypes",
      fileName,
    );
    const image = await readFile(filePath);
    const extension = path.extname(fileName).toLowerCase();

    return new NextResponse(image, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentTypes[extension] || "application/octet-stream",
      },
    });
  } catch {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}
