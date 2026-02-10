import { DateTime } from "luxon";

export function getCurrentItalianDateTime() {
  return DateTime.now().setZone("Europe/Rome");
}

export function formatDate(date: DateTime, format: string = "yyyy-MM-dd") {
  return date.toFormat(format);
}

export function addDays(date: DateTime, days: number) {
  return date.plus({ days });
}

export function getDayOfWeek(date: DateTime) {
  return date.weekday === 7 ? 6 : date.weekday - 1;
}

export function minutesToTime(minutes: number, baseDate?: DateTime) {
  const base = baseDate || getCurrentItalianDateTime().startOf("day");
  return base.plus({ minutes });
}

export function timeToMinutes(timeString: string): number | null {
  const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  return hours * 60 + minutes;
}
