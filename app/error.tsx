"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-5 py-20">
      <h1 className="font-display text-4xl">تعذر عرض الصفحة</h1>
      <p className="mt-3 text-sm leading-7 text-ink-soft">حدث خلل أثناء فتح هذه الشاشة.</p>
      <button className="mt-6 bg-ink px-4 py-2 text-sm text-paper" onClick={reset}>
        أعد المحاولة
      </button>
    </main>
  );
}
