import { redirect } from "next/navigation";
import { AccountPanel } from "@/components/account-panel";
import { LocalTime } from "@/components/local-time";
import { getCurrentUser } from "@/lib/current";

export const metadata = { title: "الحساب" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <section className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <h1 className="font-display text-5xl">الحساب</h1>
      <dl className="mt-6 max-w-lg space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-line py-2">
          <dt className="text-ink-soft">الاسم</dt>
          <dd>{user.name}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-line py-2">
          <dt className="text-ink-soft">البريد</dt>
          <dd dir="ltr">{user.email}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-line py-2">
          <dt className="text-ink-soft">تاريخ الفتح</dt>
          <dd>
            <LocalTime iso={user.createdAt} />
          </dd>
        </div>
      </dl>
      <div className="mt-8">
        <AccountPanel />
      </div>
    </section>
  );
}
