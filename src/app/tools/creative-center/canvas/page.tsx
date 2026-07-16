import { CreativeCanvasWorkspace } from "@/components/creative-center/creative-canvas";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function CreativeCanvasPage() {
  await requireSignedInUser("/tools/creative-center/canvas");
  return <CreativeCanvasWorkspace />;
}
