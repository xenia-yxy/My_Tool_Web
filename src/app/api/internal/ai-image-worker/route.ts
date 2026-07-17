import { NextResponse } from "next/server";
import { claimNextAiImageJob, requeueStaleAiImageJobs } from "@/server/ai-image-assets";
import { processAiImageJob } from "@/server/ai-image-queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = request.headers.get("x-internal-worker-token");
  const workerToken = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!workerToken || token !== workerToken) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  await requeueStaleAiImageJobs();
  const job = await claimNextAiImageJob();
  if (!job) {
    return NextResponse.json({ claimed: false });
  }

  const result = await processAiImageJob(job);
  return NextResponse.json({ claimed: true, jobId: job.id, result });
}
