export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatCurrencyFromPence(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value / 100);
}

export function parsePoundsToPence(value: FormDataEntryValue | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseFloat(String(value));
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.round(parsed * 100);
}
