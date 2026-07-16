import { CreativeCanvasWorkspace } from "@/components/creative-center/creative-canvas";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ sessionId: string }> };

export default async function CreativeCanvasSessionPage({ params }: PageProps) {
  await requireSignedInUser("/tools/creative-center/canvas");
  const { sessionId } = await params;
  return <CreativeCanvasWorkspace sessionId={sessionId} />;
}
