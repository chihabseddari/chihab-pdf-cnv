"use client";

export function LocalTime({ iso }: { iso: string }) {
  const text = new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));

  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}
