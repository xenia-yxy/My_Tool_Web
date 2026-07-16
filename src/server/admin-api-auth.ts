import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const defaultAllowedOrigins = "http://localhost:3002";

export function getAdminApiCorsHeaders(
  origin: string | null,
  allowedOrigins = process.env.ADMIN_API_ALLOWED_ORIGINS ||
    defaultAllowedOrigins,
) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  const allowList = allowedOrigins
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (origin && allowList.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

export function isAuthorizedAdminApiRequest(
  request: Request,
  expectedToken = process.env.ADMIN_API_TOKEN || "",
) {
  if (!expectedToken) {
    return false;
  }

  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return false;
  }

  return safeTokenEquals(match[1], expectedToken);
}

export function createAdminApiPreflightResponse(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: getAdminApiCorsHeaders(request.headers.get("origin")),
  });
}

export function createAdminApiUnauthorizedResponse(request: Request) {
  return NextResponse.json(
    { error: "UNAUTHORIZED" },
    {
      status: 401,
      headers: getAdminApiCorsHeaders(request.headers.get("origin")),
    },
  );
}

export function createAdminApiJsonResponse(
  request: Request,
  data: unknown,
  init: ResponseInit = {},
) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...getAdminApiCorsHeaders(request.headers.get("origin")),
      ...Object.fromEntries(new Headers(init.headers).entries()),
    },
  });
}

function safeTokenEquals(input: string, expected: string) {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, expectedBuffer);
}
