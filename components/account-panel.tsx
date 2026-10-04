"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass, fieldClass, labelClass } from "@/lib/styles";

export function AccountPanel() {
  const router = useRouter();
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);
    const form = new FormData(event.currentTarget);
    setPending(true);
    const response = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    setPending(false);
    if (!response.ok) {
      setPasswordError(data?.error ?? "تعذر التغيير.");
      return;
    }
    event.currentTarget.reset();
    setPasswordMessage("تغيرت كلمة المرور.");
  }

  async function deleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteError(null);
    const form = new FormData(event.currentTarget);
    setPending(true);
    const response = await fetch("/api/auth/account", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        password: form.get("password"),
        confirm: form.get("confirm"),
      }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setPending(false);
      setDeleteError(data?.error ?? "تعذر الحذف.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={changePassword} className="border border-line bg-card p-5">
        <h2 className="font-display text-3xl">كلمة المرور</h2>
        <label className="mt-4 block">
          <span className={labelClass}>الحالية</span>
          <input name="currentPassword" type="password" required dir="ltr" className={fieldClass} />
        </label>
        <label className="mt-4 block">
          <span className={labelClass}>الجديدة</span>
          <input name="newPassword" type="password" required minLength={8} maxLength={72} dir="ltr" className={fieldClass} />
        </label>
        {passwordError ? <p className="mt-3 text-sm text-seal">{passwordError}</p> : null}
        {passwordMessage ? <p className="mt-3 text-sm text-stamp">{passwordMessage}</p> : null}
        <button className={`${buttonClass.stamp} mt-4`} disabled={pending}>
          حفظ
        </button>
      </form>
      <form onSubmit={deleteAccount} className="border border-seal/40 bg-card p-5">
        <h2 className="font-display text-3xl">حذف الحساب</h2>
        <p className="mt-2 text-sm leading-7 text-ink-soft">
          يُحذف الاسم والبريد وسجل العمليات. اكتب العبارة: احذف حسابي
        </p>
        <label className="mt-4 block">
          <span className={labelClass}>كلمة المرور</span>
          <input name="password" type="password" required dir="ltr" className={fieldClass} />
        </label>
        <label className="mt-4 block">
          <span className={labelClass}>عبارة التأكيد</span>
          <input name="confirm" required className={fieldClass} />
        </label>
        {deleteError ? <p className="mt-3 text-sm text-seal">{deleteError}</p> : null}
        <button className={`${buttonClass.danger} mt-4`} disabled={pending}>
          حذف الحساب
        </button>
      </form>
    </div>
  );
}
