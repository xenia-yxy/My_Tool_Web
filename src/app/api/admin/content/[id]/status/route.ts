import {
  createAdminApiJsonResponse,
  createAdminApiPreflightResponse,
  createAdminApiUnauthorizedResponse,
  isAuthorizedAdminApiRequest,
} from "@/server/admin-api-auth";
import { updateAdminContentStatusPayload } from "@/server/admin-content-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminContentStatusRouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS(request: Request) {
  return createAdminApiPreflightResponse(request);
}

export async function PATCH(
  request: Request,
  context: AdminContentStatusRouteContext,
) {
  if (!isAuthorizedAdminApiRequest(request)) {
    return createAdminApiUnauthorizedResponse(request);
  }

  try {
    const { id } = await context.params;
    const asset = await updateAdminContentStatusPayload(id, await request.json());

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

function getPublicErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "状态更新失败";
}

