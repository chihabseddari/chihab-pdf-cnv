import { cookies } from "next/headers";
import { connection } from "next/server";
import { readSession, SESSION_COOKIE } from "./session";
import { getStore, StorageUnavailableError } from "./store";
import type { PublicStats, PublicUser } from "./types";

const UNAVAILABLE =
  "قاعدة البيانات الدائمة غير موصولة. عدد المستخدمين يُعرض عندما يُقرأ من سجل الحسابات الفعلي.";

export async function getCurrentUser(): Promise<PublicUser | null> {
  await connection();
  const jar = await cookies();
  let userId: string | null = null;
  try {
    userId = await readSession(jar.get(SESSION_COOKIE)?.value);
  } catch {
    return null;
  }
  if (!userId) return null;
  try {
    const store = await getStore();
    return await store.findUserById(userId);
  } catch {
    return null;
  }
}

export async function getPublicStats(): Promise<PublicStats> {
  const asOf = new Date().toISOString();
  try {
    const store = await getStore();
    const stats = await store.stats();
    return { available: true, asOf, ...stats };
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      return { available: false, asOf, reason: UNAVAILABLE };
    }
    return {
      available: false,
      asOf,
      reason: "تعذر قراءة سجل المستخدمين في هذه اللحظة، لذلك لا يُعرض عدد.",
    };
  }
}

export function storageLabel(storage: "postgres" | "file") {
  if (storage === "postgres") return "مصدر العدد: جدول المستخدمين في قاعدة البيانات.";
  return "مصدر العدد: سجل الحسابات المحفوظ على هذا الخادم.";
}
