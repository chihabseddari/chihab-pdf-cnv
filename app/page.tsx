import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { LiveStats } from "@/components/live-stats";
import { getCurrentUser, getPublicStats } from "@/lib/current";

export const dynamic = "force-dynamic";

const SERVICES = [
  {
    n: "01",
    title: "تحويل الصور إلى PDF",
    text: "عدة صور في ملف واحد، مع الترتيب والمقاس والهامش والاتجاه.",
    href: "/studio/images",
  },
  {
    n: "02",
    title: "دمج ملفات PDF",
    text: "اجمع الملفات بالترتيب الذي تريده في ملف واحد.",
    href: "/studio/merge",
  },
  {
    n: "03",
    title: "تقسيم PDF",
    text: "استخرج صفحات، أو نزّل كل صفحة في ملف داخل أرشيف.",
    href: "/studio/split",
  },
  {
    n: "04",
    title: "فحص صورة اليانصيب",
    text: "اقرأ أرقام التذكرة من الصورة وقارنها بسحب منشور، أو بأرقام تنسخها من إعلان لعبتك.",
    href: "/studio/lottery",
  },
];

export default async function HomePage() {
  const [stats, user] = await Promise.all([getPublicStats(), getCurrentUser()]);

  return (
    <div className="min-h-full">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:z-30 focus:bg-ink focus:px-3 focus:py-2 focus:text-paper">
        تخطٍ إلى المحتوى
      </a>
      <SiteHeader loggedIn={Boolean(user)} />
      <main id="content">
        <section className="mx-auto grid max-w-6xl items-end gap-12 px-5 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="text-sm font-medium tracking-wide text-stamp">استوديو مستندات بحساب خاص</p>
            <h1 className="mt-3 max-w-xl font-display text-5xl leading-[1.25] sm:text-6xl">
              صورك تصبح PDF، وتذكرتك تُقارَن بأرقام السحب.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-9 text-ink-soft">
              كل شخص يعمل من حسابه. أدوات PDF تعمل داخل المتصفح، والسجل الحي يعدّ الحسابات المسجّلة فعلًا.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={user ? "/studio" : "/register"} className="bg-stamp px-5 py-3 text-sm font-medium text-paper">
                {user ? "افتح المكتب" : "ابدأ بحسابك"}
              </Link>
              <a href="#services" className="border border-ink px-5 py-3 text-sm font-medium">
                الخدمات
              </a>
            </div>
          </div>
          <LiveStats stats={stats} />
        </section>

        <section id="services" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 className="font-display text-4xl">ما يفعله chihab pdf cnv</h2>
            <ol className="mt-8 divide-y divide-line border-y border-line">
              {SERVICES.map((service) => (
                <li key={service.n} className="grid gap-3 py-6 sm:grid-cols-[5rem_1fr_auto] sm:items-center">
                  <span className="font-display text-3xl text-stamp">{service.n}</span>
                  <div>
                    <h3 className="text-xl">{service.title}</h3>
                    <p className="mt-1 max-w-xl text-sm leading-7 text-ink-soft">{service.text}</p>
                  </div>
                  <Link href={user ? service.href : `/register?next=${encodeURIComponent(service.href)}`} className="text-sm text-stamp">
                    {user ? "افتح الأداة" : "بعد إنشاء الحساب"}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-3">
            {[
              ["١", "افتح حسابًا", "اسم وبريد وكلمة مرور. الحساب يخصك، وسجلك لا يختلط بسجل غيرك."],
              ["٢", "اعمل في المتصفح", "الصور وملفات PDF تُعالَج على جهازك. نحفظ وصف العملية فقط، مثل عدد الصور والمقاس."],
              ["٣", "افحص التذكرة بوضوح", "Powerball وMega Millions من بوابة نيويورك المفتوحة. أي لعبة أخرى تقارنها بأرقام الإعلان الذي تنسخه."],
            ].map(([n, title, text]) => (
              <article key={n}>
                <p className="font-display text-4xl text-stamp">{n}</p>
                <h2 className="mt-2 text-xl">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-ink-soft">{text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-ink-soft">
          <p>chihab pdf cnv ليس جهة يانصيب ولا يحتفظ بصور التذاكر.</p>
          <p>© {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
