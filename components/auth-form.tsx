"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonClass, fieldClass, labelClass } from "@/lib/styles";

export function AuthForm({
  mode,
  nextPath,
}: {
  mode: "login" | "register";
  nextPath: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [show, setShow] = useState(false);
  const register = mode === "register";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (register && password !== confirm) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    setPending(true);
    const payload = register
      ? { name: form.get("name"), email: form.get("email"), password }
      : { email: form.get("email"), password };
    const response = await fetch(register ? "/api/auth/register" : "/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setPending(false);
      setError(data?.error ?? "تعذر إكمال الطلب.");
      return;
    }
    window.location.assign(nextPath);
  }

  return (
    <form onSubmit={onSubmit} className="border border-line bg-card/90 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-8">
      <h1 className="font-display text-4xl">{register ? "حساب جديد" : "دخول"}</h1>
      <p className="mt-2 text-sm leading-7 text-ink-soft">
        {register
          ? "الاسم والبريد يبقىان في سجل chihab pdf cnv. الملفات التي تحوّلها تُعالَج في متصفحك."
          : "ادخل إلى مكتبك ومتابعة عملياتك."}
      </p>
      <div className="mt-6 space-y-4">
        {register ? (
          <label className="block">
            <span className={labelClass}>الاسم</span>
            <input name="name" required minLength={2} maxLength={60} className={fieldClass} />
          </label>
        ) : null}
        <label className="block">
          <span className={labelClass}>البريد الإلكتروني</span>
          <input
            name="email"
            type="email"
            required
            dir="ltr"
            autoComplete="email"
            className={`${fieldClass} text-left`}
          />
        </label>
        <label className="block">
          <span className={labelClass}>كلمة المرور</span>
          <input
            name="password"
            type={show ? "text" : "password"}
            required
            minLength={8}
            maxLength={72}
            dir="ltr"
            autoComplete={register ? "new-password" : "current-password"}
            className={`${fieldClass} text-left`}
          />
        </label>
        {register ? (
          <label className="block">
            <span className={labelClass}>تأكيد كلمة المرور</span>
            <input
              name="confirm"
              type={show ? "text" : "password"}
              required
              minLength={8}
              maxLength={72}
              dir="ltr"
              autoComplete="new-password"
              className={`${fieldClass} text-left`}
            />
          </label>
        ) : null}
      </div>
      <button
        type="button"
        className="mt-3 text-sm text-ink-soft underline-offset-4 hover:underline"
        onClick={() => setShow((value) => !value)}
      >
        {show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
      </button>
      {error ? (
        <p role="alert" className="mt-4 text-sm leading-7 text-seal">
          {error}
        </p>
      ) : null}
      <button className={`${buttonClass.stamp} mt-6 w-full`} disabled={pending}>
        {pending ? "جارٍ الحفظ…" : register ? "إنشاء الحساب" : "دخول"}
      </button>
      <p className="mt-4 text-sm text-ink-soft">
        {register ? (
          <>
            عندك حساب؟{" "}
            <Link href="/login" className="text-stamp">
              ادخل
            </Link>
          </>
        ) : (
          <>
            لا حساب بعد؟{" "}
            <Link href="/register" className="text-stamp">
              افتح حسابًا
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
