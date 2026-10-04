import { cookies } from "next/headers";
import { EmailTakenError, getStore, StorageUnavailableError } from "@/lib/store";
import { jsonError, readJson, rejectCrossSite } from "@/lib/http";
import { hashPassword } from "@/lib/passwords";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

const STORAGE_MESSAGE =
  "التسجيل متوقف لأن قاعدة البيانات الدائمة غير موصولة. لا يُحفظ حساب يختفي بعد قليل.";

export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  const body = await readJson(request);
  const name = typeof body?.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (name.length < 2 || name.length > 60) return jsonError("اكتب اسمًا بين حرفين و60 حرفًا.", 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
    return jsonError("البريد الإلكتروني غير صالح.", 400);
  }
  if (password.length < 8 || password.length > 72) {
    return jsonError("كلمة المرور من 8 إلى 72 حرفًا.", 400);
  }

  try {
    const store = await getStore();
    const user = await store.createUser({
      name,
      email,
      passwordHash: await hashPassword(password),
    });
    const jar = await cookies();
    jar.set(SESSION_COOKIE, await signSession(user.id), sessionCookieOptions());
    return Response.json({ user });
  } catch (error) {
    if (error instanceof EmailTakenError) return jsonError("هذا البريد مسجّل. ادخل إلى حسابك.", 409);
    if (error instanceof StorageUnavailableError) return jsonError(STORAGE_MESSAGE, 503);
    if (error instanceof Error && error.message === "AUTH_SECRET") {
      return jsonError("الخادم بحاجة إلى AUTH_SECRET قبل فتح الحسابات.", 500);
    }
    return jsonError("تعذر إنشاء الحساب.", 500);
  }
}
