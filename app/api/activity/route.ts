import { jsonError, readJson, rejectCrossSite } from "@/lib/http";
import { getCurrentUser } from "@/lib/current";
import { getStore, StorageUnavailableError } from "@/lib/store";
import type { ActivityKind } from "@/lib/types";

const KINDS = new Set<ActivityKind>(["images-to-pdf", "merge-pdf", "split-pdf", "lottery"]);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("ادخل إلى حسابك أولًا.", 401);
  try {
    const store = await getStore();
    const activities = await store.listActivities(user.id, 50);
    return Response.json({ activities });
  } catch (error) {
    if (error instanceof StorageUnavailableError) return jsonError("السجل غير متاح.", 503);
    return jsonError("تعذر قراءة السجل.", 500);
  }
}

export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  const user = await getCurrentUser();
  if (!user) return jsonError("ادخل إلى حسابك أولًا.", 401);
  const body = await readJson(request);
  const kind = body?.kind as ActivityKind;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const detail = typeof body?.detail === "string" ? body.detail.trim() : "";
  if (!KINDS.has(kind) || title.length < 1 || title.length > 120 || detail.length > 300) {
    return jsonError("بيانات العملية غير صالحة.", 400);
  }
  try {
    const store = await getStore();
    const recent = await store.listActivities(user.id, 40);
    const hourAgo = Date.now() - 60 * 60 * 1000;
    const burst = recent.filter((item) => Date.parse(item.createdAt) > hourAgo).length;
    if (burst >= 30) return jsonError("حُفظ عدد كبير من العمليات خلال ساعة. حاول لاحقًا.", 429);
    const activity = await store.addActivity({ userId: user.id, kind, title, detail });
    return Response.json({ activity });
  } catch (error) {
    if (error instanceof StorageUnavailableError) return jsonError("السجل غير متاح.", 503);
    return jsonError("تعذر حفظ العملية.", 500);
  }
}
