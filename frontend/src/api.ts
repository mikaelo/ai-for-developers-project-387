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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

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
  getOwner: () => request<Owner>("/admin/owner"),
  listAdminEventTypes: () => request<EventType[]>("/admin/event-types"),
  createEventType: (payload: CreateEventTypeRequest) =>
    request<EventType>("/admin/event-types", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listUpcomingBookings: () => request<Booking[]>("/admin/bookings/upcoming"),
  listPublicEventTypes: () => request<PublicEventType[]>("/event-types"),
  listAvailableSlots: (eventTypeId: string) =>
    request<Slot[]>(`/event-types/${encodeURIComponent(eventTypeId)}/slots`),
  createBooking: (payload: CreateBookingRequest) =>
    request<Booking>("/bookings", {
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
