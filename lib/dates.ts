// Dates are printed in UTC so the server and the browser always agree (no hydration drift).
const dayFmt = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" });

/** "14 July 2026" */
export function formatDay(iso: string) {
  return dayFmt.format(new Date(iso));
}

/** "July 2026" */
export function formatMonth(iso: string) {
  return monthFmt.format(new Date(iso));
}
