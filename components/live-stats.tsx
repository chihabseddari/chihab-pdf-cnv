import { formatCount } from "@/lib/format";
import { storageLabel } from "@/lib/current";
import type { PublicStats } from "@/lib/types";
import { LocalTime } from "./local-time";

export function LiveStats({ stats }: { stats: PublicStats }) {
  return (
    <aside className="border border-line bg-card/90 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <p className="text-sm font-medium text-stamp">السجل الحي</p>
      <h2 className="mt-1 font-display text-3xl">عدد المستخدمين</h2>
      {stats.available ? (
        <>
          <dl className="mt-4">
            <Stat label="حسابات مسجّلة" value={stats.users} />
            <Stat label="عمليات PDF محفوظة" value={stats.conversions} />
            <Stat label="فحوصات تذاكر محفوظة" value={stats.checks} />
          </dl>
          <p className="mt-4 text-sm leading-7 text-ink-soft">
            {storageLabel(stats.storage)} القراءة تمت عند <LocalTime iso={stats.asOf} />.
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm leading-7 text-ink">{stats.reason}</p>
      )}
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-line py-3">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="font-display text-4xl leading-none tabular-nums">
        <data value={value}>{formatCount(value)}</data>
      </dd>
    </div>
  );
}
