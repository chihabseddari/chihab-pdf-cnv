export function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

export function numbersFromText(value: string) {
  return normalizeDigits(value)
    .split(/[^\d]+/)
    .filter(Boolean)
    .map((part) => Number(part));
}
