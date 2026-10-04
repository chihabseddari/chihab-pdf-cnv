import { redirect } from "next/navigation";
import { LocalTime } from "@/components/local-time";
import { getCurrentUser } from "@/lib/current";
import { getStore } from "@/lib/store";
import { KIND_LABEL } from "@/lib/types";

export const metadata = { title: "السجل" };

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const activities = await (await getStore()).listActivities(user.id, 50);

  return (
    <section className="mx-auto max-w-3xl px-5 py-8 sm:py-10">
      <h1 className="font-display text-5xl">السجل</h1>
      <p className="mt-3 text-sm leading-7 text-ink-soft">
        يُحفظ وصف العملية فقط: نوعها وعدد الملفات أو نتيجة الفحص المختصرة. الصور وملفات PDF لا تُرفع.
      </p>
      {activities.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">السجل فارغ.</p>
      ) : (
        <ol className="mt-8 divide-y divide-line border-y border-line">
          {activities.map((item) => (
            <li key={item.id} className="py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm text-stamp">{KIND_LABEL[item.kind]}</p>
                <LocalTime iso={item.createdAt} />
              </div>
              <p className="mt-1">{item.title}</p>
              {item.detail ? <p className="text-sm leading-7 text-ink-soft">{item.detail}</p> : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
