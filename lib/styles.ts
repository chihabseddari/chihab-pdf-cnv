export const fieldClass =
  "w-full border border-line bg-card px-3 py-2.5 text-base text-ink outline-none placeholder:text-ink-soft/70";

export const labelClass = "mb-1.5 block text-sm font-medium text-ink";

export const buttonClass = {
  solid:
    "inline-flex items-center justify-center gap-2 bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-stamp-dark disabled:cursor-not-allowed disabled:opacity-50",
  stamp:
    "inline-flex items-center justify-center gap-2 bg-stamp px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-stamp-dark disabled:cursor-not-allowed disabled:opacity-50",
  ghost:
    "inline-flex items-center justify-center gap-2 border border-line bg-card px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-50",
  danger:
    "inline-flex items-center justify-center gap-2 border border-seal bg-transparent px-4 py-2.5 text-sm font-medium text-seal transition hover:bg-seal hover:text-paper disabled:cursor-not-allowed disabled:opacity-50",
} as const;
