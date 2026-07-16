import {
  createAdminApiJsonResponse,
  createAdminApiPreflightResponse,
  createAdminApiUnauthorizedResponse,
  isAuthorizedAdminApiRequest,
} from "@/server/admin-api-auth";
import { getAdminDashboardPayload } from "@/server/admin-content-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return createAdminApiPreflightResponse(request);
}

export async function GET(request: Request) {
  if (!isAuthorizedAdminApiRequest(request)) {
    return createAdminApiUnauthorizedResponse(request);
  }

  const payload = await getAdminDashboardPayload();

  return createAdminApiJsonResponse(request, payload);
}

