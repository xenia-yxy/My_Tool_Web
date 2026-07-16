import {
  createAdminApiJsonResponse,
  createAdminApiPreflightResponse,
  createAdminApiUnauthorizedResponse,
  isAuthorizedAdminApiRequest,
} from "@/server/admin-api-auth";
import {
  createAdminContentPayload,
  findAdminAuthorId,
  listAdminContentPayload,
} from "@/server/admin-content-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return createAdminApiPreflightResponse(request);
}

export async function GET(request: Request) {
  if (!isAuthorizedAdminApiRequest(request)) {
    return createAdminApiUnauthorizedResponse(request);
  }

  const payload = await listAdminContentPayload(new URL(request.url));

  return createAdminApiJsonResponse(request, payload);
}

export async function POST(request: Request) {
  if (!isAuthorizedAdminApiRequest(request)) {
    return createAdminApiUnauthorizedResponse(request);
  }

  try {
    const authorId = await findAdminAuthorId();
    const asset = await createAdminContentPayload(await request.json(), authorId);

    return createAdminApiJsonResponse(request, { asset }, { status: 201 });
  } catch (error) {
    return createAdminApiJsonResponse(
      request,
      { error: getPublicErrorMessage(error) },
      { status: 400 },
    );
  }
}

function getPublicErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "内容保存失败";
}

