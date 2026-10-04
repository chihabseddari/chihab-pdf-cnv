export function formatCount(value: number) {
  return new Intl.NumberFormat("ar-u-nu-latn").format(value);
}

export function safePdfName(name: string, fallback: string) {
  const cleaned = name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\.pdf$/i, "")
    .slice(0, 80);
  return `${cleaned || fallback}.pdf`;
}
