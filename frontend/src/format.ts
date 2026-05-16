import dayjs from "dayjs";
import "dayjs/locale/ru";

dayjs.locale("ru");

export function formatDateTime(value: string): string {
  return dayjs(value).format("D MMMM, HH:mm");
}

export function formatDate(value: string): string {
  return dayjs(value).format("D MMMM YYYY");
}

export function formatTimeRange(startAt: string, endAt: string): string {
  return `${dayjs(startAt).format("HH:mm")} - ${dayjs(endAt).format("HH:mm")}`;
}
