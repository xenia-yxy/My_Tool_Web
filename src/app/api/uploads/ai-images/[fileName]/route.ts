import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AiImageUploadRouteProps = {
  params: Promise<{
    fileName: string;
  }>;
};

export async function GET(_request: Request, { params }: AiImageUploadRouteProps) {
  const { fileName } = await params;

  if (!/^(ref-)?\d{4}-\d{2}-\d{2}-[a-f0-9-]+\.png$/i.test(fileName)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  try {
    const filePath = path.join(
      process.cwd(),
      ".runtime",
      "uploads",
      "ai-images",
      fileName,
    );
    const image = await readFile(filePath);

    return new NextResponse(image, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "image/png",
      },
    });
  } catch {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}
