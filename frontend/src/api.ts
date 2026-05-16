import type {
  ApiErrorBody,
  Booking,
  CreateBookingRequest,
  CreateEventTypeRequest,
  EventType,
  Owner,
  PublicEventType,
  Slot,
} from "./types";
import type { paths } from "./generated/api-types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const routes = {
  getOwner: "/api/admin/owner",
  listAdminEventTypes: "/api/admin/event-types",
  createEventType: "/api/admin/event-types",
  listUpcomingBookings: "/api/admin/bookings/upcoming",
  listPublicEventTypes: "/api/event-types",
  listAvailableSlots: "/api/event-types/{eventTypeId}/slots",
  createBooking: "/api/bookings",
} as const satisfies Record<string, keyof paths>;

export class ApiError extends Error {
  status: number;
  body?: ApiErrorBody;

  constructor(status: number, body?: ApiErrorBody) {
    super(body?.message ?? `API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = undefined;
    }
    throw new ApiError(response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  getOwner: () => request<Owner>(routes.getOwner),
  listAdminEventTypes: () => request<EventType[]>(routes.listAdminEventTypes),
  createEventType: (payload: CreateEventTypeRequest) =>
    request<EventType>(routes.createEventType, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listUpcomingBookings: () => request<Booking[]>(routes.listUpcomingBookings),
  listPublicEventTypes: () => request<PublicEventType[]>(routes.listPublicEventTypes),
  listAvailableSlots: (eventTypeId: string) =>
    request<Slot[]>(routes.listAvailableSlots.replace("{eventTypeId}", encodeURIComponent(eventTypeId))),
  createBooking: (payload: CreateBookingRequest) =>
    request<Booking>(routes.createBooking, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return "Это время уже занято. Выберите другой слот.";
    if (error.status === 404) return "Запрошенная запись не найдена.";
    if (error.status === 422) return error.body?.message ?? "Проверьте данные формы.";
    return error.body?.message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось выполнить запрос.";
}
