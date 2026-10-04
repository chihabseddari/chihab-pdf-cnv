export function jsonError(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function rejectCrossSite(request: Request) {
  const host = request.headers.get("host");
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return jsonError("طلب غير مسموح", 403);
  }
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return jsonError("طلب غير مسموح", 403);
    } catch {
      return jsonError("طلب غير مسموح", 403);
    }
  }
  return null;
}

export function safeNext(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/studio";
  }
  return value;
}
