import Link from "next/link";
import { LocalTime } from "@/components/local-time";
import { getCurrentUser } from "@/lib/current";
import { formatCount } from "@/lib/format";
import { getStore } from "@/lib/store";
import { KIND_LABEL } from "@/lib/types";
import { redirect } from "next/navigation";

export const metadata = { title: "المكتب" };

const TOOLS = [
  ["صور إلى PDF", "رتّب الصور ونزّل ملفًا واحدًا.", "/studio/images"],
  ["دمج PDF", "اجمع عدة ملفات بالترتيب.", "/studio/merge"],
  ["تقسيم PDF", "استخرج الصفحات التي تحتاجها.", "/studio/split"],
  ["فحص اليانصيب", "قارن صورة التذكرة بأرقام السحب.", "/studio/lottery"],
];

export default async function StudioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const store = await getStore();
  const [activities, counts] = await Promise.all([
    store.listActivities(user.id, 5),
    store.countForUser(user.id),
  ]);

  return (
    <section className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <p className="text-sm text-stamp">مكتبك</p>
      <h1 className="mt-2 font-display text-5xl">أهلًا {user.name}</h1>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="border border-line bg-card px-4 py-3">
          <dt className="text-sm text-ink-soft">عملياتك المحفوظة</dt>
          <dd className="font-display text-4xl tabular-nums">{formatCount(counts.conversions)}</dd>
        </div>
        <div className="border border-line bg-card px-4 py-3">
          <dt className="text-sm text-ink-soft">فحوصاتك المحفوظة</dt>
          <dd className="font-display text-4xl tabular-nums">{formatCount(counts.checks)}</dd>
        </div>
      </dl>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {TOOLS.map(([title, text, href]) => (
          <Link key={href} href={href} className="border border-line bg-card p-5 transition hover:border-ink">
            <h2 className="text-xl">{title}</h2>
            <p className="mt-2 text-sm leading-7 text-ink-soft">{text}</p>
          </Link>
        ))}
      </div>
      <h2 className="mt-10 font-display text-3xl">آخر عملياتك</h2>
      {activities.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">لم تُحفظ عملية بعد.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {activities.map((item) => (
            <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
              <div>
                <p className="text-sm text-stamp">{KIND_LABEL[item.kind]}</p>
                <p>{item.title}</p>
                {item.detail ? <p className="text-sm text-ink-soft">{item.detail}</p> : null}
              </div>
              <LocalTime iso={item.createdAt} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
