import { cookies } from "next/headers";
import { jsonError, readJson, rejectCrossSite } from "@/lib/http";
import { getCurrentUser } from "@/lib/current";
import { verifyPassword } from "@/lib/passwords";
import { getStore, StorageUnavailableError } from "@/lib/store";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  const user = await getCurrentUser();
  if (!user) return jsonError("ادخل إلى حسابك أولًا.", 401);
  const body = await readJson(request);
  const password = typeof body?.password === "string" ? body.password : "";
  const confirm = typeof body?.confirm === "string" ? body.confirm.trim() : "";
  if (confirm !== "احذف حسابي") return jsonError("اكتب عبارة التأكيد كما هي: احذف حسابي", 400);

  try {
    const store = await getStore();
    const stored = await store.findUserByEmail(user.email);
    const valid = await verifyPassword(password, stored?.passwordHash ?? null);
    if (!stored || !valid) return jsonError("كلمة المرور غير صحيحة.", 401);
    await store.deleteUser(user.id);
    const jar = await cookies();
    jar.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof StorageUnavailableError) return jsonError("السجل غير متاح.", 503);
    return jsonError("تعذر حذف الحساب.", 500);
  }
}
