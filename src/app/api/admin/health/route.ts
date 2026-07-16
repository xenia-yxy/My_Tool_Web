import {
  createAdminApiJsonResponse,
  createAdminApiPreflightResponse,
  createAdminApiUnauthorizedResponse,
  isAuthorizedAdminApiRequest,
} from "@/server/admin-api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return createAdminApiPreflightResponse(request);
}

export function GET(request: Request) {
  if (!isAuthorizedAdminApiRequest(request)) {
    return createAdminApiUnauthorizedResponse(request);
  }

  return createAdminApiJsonResponse(request, {
    ok: true,
    service: "my-web-admin-api",
  });
}

