import { jsonError, readJson, rejectCrossSite } from "@/lib/http";
import { getCurrentUser } from "@/lib/current";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { getStore, StorageUnavailableError } from "@/lib/store";

export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  const user = await getCurrentUser();
  if (!user) return jsonError("ادخل إلى حسابك أولًا.", 401);
  const body = await readJson(request);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  if (newPassword.length < 8 || newPassword.length > 72) {
    return jsonError("كلمة المرور الجديدة من 8 إلى 72 حرفًا.", 400);
  }

  try {
    const store = await getStore();
    const stored = await store.findUserByEmail(user.email);
    const valid = await verifyPassword(currentPassword, stored?.passwordHash ?? null);
    if (!stored || !valid) return jsonError("كلمة المرور الحالية غير صحيحة.", 401);
    await store.updatePassword(user.id, await hashPassword(newPassword));
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof StorageUnavailableError) return jsonError("السجل غير متاح.", 503);
    return jsonError("تعذر تغيير كلمة المرور.", 500);
  }
}
