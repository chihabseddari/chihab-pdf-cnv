import { getStore, StorageUnavailableError } from "@/lib/store";
import { jsonError, readJson, rejectCrossSite } from "@/lib/http";
import { verifyPassword } from "@/lib/passwords";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  const body = await readJson(request);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return jsonError("أدخل البريد وكلمة المرور.", 400);

  try {
    const store = await getStore();
    const user = await store.findUserByEmail(email);
    const valid = await verifyPassword(password, user?.passwordHash ?? null);
    if (!user || !valid) return jsonError("البريد أو كلمة المرور غير صحيحة.", 401);
    const token = await signSession(user.id);
    const jar = await cookies();
    jar.set(SESSION_COOKIE, token, sessionCookieOptions());
    return Response.json({
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    });
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      return jsonError("الدخول متوقف لأن سجل الحسابات غير موصول.", 503);
    }
    if (error instanceof Error && error.message === "AUTH_SECRET") {
      return jsonError("الخادم بحاجة إلى AUTH_SECRET قبل فتح الحسابات.", 500);
    }
    return jsonError("تعذر الدخول.", 500);
  }
}
