export function getWeekStart(value?: string) {
  const date = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
  const day = date.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;

  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

export function getWeekEnd(weekStartDate: string) {
  const date = new Date(`${weekStartDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 5);
  return date.toISOString().slice(0, 10);
}

export function shiftWeek(weekStartDate: string, amount: number) {
  const date = new Date(`${weekStartDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount * 7);
  return date.toISOString().slice(0, 10);
}

export function formatWeekRange(weekStartDate: string) {
  const start = new Date(`${weekStartDate}T00:00:00.000Z`);
  const end = new Date(`${getWeekEnd(weekStartDate)}T00:00:00.000Z`);
  const formatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export function getUpcomingWeekStart() {
  return shiftWeek(getWeekStart(), 1);
}
