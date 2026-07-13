export function getWeekStart(value?: string) {
  const date = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date();
  const day = date.getDay();
  const daysSinceMonday = (day + 6) % 7;

  date.setDate(date.getDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

export function getWeekEnd(weekStartDate: string) {
  const date = new Date(`${weekStartDate}T00:00:00`);
  date.setDate(date.getDate() + 6);
  return date.toISOString().slice(0, 10);
}

export function shiftWeek(weekStartDate: string, amount: number) {
  const date = new Date(`${weekStartDate}T00:00:00`);
  date.setDate(date.getDate() + amount * 7);
  return date.toISOString().slice(0, 10);
}

export function formatWeekRange(weekStartDate: string) {
  const start = new Date(`${weekStartDate}T00:00:00`);
  const end = new Date(`${getWeekEnd(weekStartDate)}T00:00:00`);

  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).formatRange(start, end);
}
