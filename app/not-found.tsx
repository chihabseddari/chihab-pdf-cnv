import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-5 py-20">
      <h1 className="font-display text-4xl">الصفحة غير موجودة</h1>
      <Link href="/" className="mt-6 inline-block text-sm text-stamp">
        العودة إلى الرئيسية
      </Link>
    </main>
  );
}
