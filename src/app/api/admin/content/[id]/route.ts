import {
  createAdminApiJsonResponse,
  createAdminApiPreflightResponse,
  createAdminApiUnauthorizedResponse,
  isAuthorizedAdminApiRequest,
} from "@/server/admin-api-auth";
import {
  deleteAdminContentPayload,
  getAdminContentPayload,
  updateAdminContentPayload,
} from "@/server/admin-content-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminContentRouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS(request: Request) {
  return createAdminApiPreflightResponse(request);
}

export async function GET(request: Request, context: AdminContentRouteContext) {
  if (!isAuthorizedAdminApiRequest(request)) {
    return createAdminApiUnauthorizedResponse(request);
  }

  const { id } = await context.params;
  const asset = await getAdminContentPayload(id);

  if (!asset) {
    return createAdminApiJsonResponse(request, { error: "NOT_FOUND" }, { status: 404 });
  }

  return createAdminApiJsonResponse(request, { asset });
}

export async function PATCH(request: Request, context: AdminContentRouteContext) {
  if (!isAuthorizedAdminApiRequest(request)) {
    return createAdminApiUnauthorizedResponse(request);
  }

  try {
    const { id } = await context.params;
    const asset = await updateAdminContentPayload(id, await request.json());

    if (!asset) {
      return createAdminApiJsonResponse(
        request,
        { error: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return createAdminApiJsonResponse(request, { asset });
  } catch (error) {
    return createAdminApiJsonResponse(
      request,
      { error: getPublicErrorMessage(error) },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: AdminContentRouteContext,
) {
  if (!isAuthorizedAdminApiRequest(request)) {
    return createAdminApiUnauthorizedResponse(request);
  }

  const { id } = await context.params;
  const deleted = await deleteAdminContentPayload(id);

  if (!deleted) {
    return createAdminApiJsonResponse(request, { error: "NOT_FOUND" }, { status: 404 });
  }

  return createAdminApiJsonResponse(request, { ok: true });
}

function getPublicErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "内容保存失败";
}

