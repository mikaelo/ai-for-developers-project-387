import type { components, operations } from "./generated/api-types";

type JsonResponse<T> = T extends {
  responses: { 200: { content: { "application/json": infer Response } } };
}
  ? Response
  : never;

type JsonRequest<T> = T extends {
  requestBody: { content: { "application/json": infer Request } };
}
  ? Request
  : never;

export type Owner = JsonResponse<operations["AdminApi_getOwner"]>;
export type EventType = JsonResponse<operations["AdminApi_listEventTypes"]>[number];
export type PublicEventType = JsonResponse<operations["GuestApi_listPublicEventTypes"]>[number];
export type Slot = JsonResponse<operations["GuestApi_listAvailableSlots"]>[number];
export type Booking = JsonResponse<operations["AdminApi_listUpcomingBookings"]>[number];
export type CreateEventTypeRequest = JsonRequest<operations["AdminApi_createEventType"]>;
export type CreateBookingRequest = JsonRequest<operations["GuestApi_createBooking"]>;
export type ApiErrorBody = components["schemas"]["Error"];
