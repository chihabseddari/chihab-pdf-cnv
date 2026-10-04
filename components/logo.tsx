import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-inherit">
      <span className="grid h-9 w-9 shrink-0 place-items-center border border-stamp font-brand text-base text-stamp">
        C
      </span>
      <span className="font-brand text-[0.98rem] leading-none tracking-tight whitespace-nowrap">chihab pdf cnv</span>
    </Link>
  );
}
