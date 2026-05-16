import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Http;

@service(#{
  title: "Call Calendar API",
})
@server("https://api.example.com", "Production endpoint")
namespace CallCalendar;

alias EventTypeId = string;
alias BookingId = string;
alias OwnerId = string;

enum BookingStatus {
  confirmed,
  cancelled,
}

enum ErrorCode {
  EventTypeNotFound,
  BookingNotFound,
  SlotUnavailable,
  SlotOutsideBookingWindow,
  InvalidEventDuration,
  ValidationFailed,
}

model Owner {
  id: OwnerId;
  displayName: string;
  timezone: string;
}

model EventType {
  id: EventTypeId;
  title: string;
  description: string;

  @minValue(1)
  durationMinutes: int32;
}

model PublicEventType {
  id: EventTypeId;
  title: string;
  description: string;
  durationMinutes: int32;
}

model Slot {
  eventTypeId: EventTypeId;
  startAt: utcDateTime;
  endAt: utcDateTime;
  durationMinutes: int32;
  available: boolean;
}

model Guest {
  name: string;
  email: string;
}

model Booking {
  id: BookingId;
  eventTypeId: EventTypeId;
  eventTypeTitle: string;
  startAt: utcDateTime;
  endAt: utcDateTime;
  guest: Guest;
  status: BookingStatus;
}

model CreateEventTypeRequest {
  id: EventTypeId;
  title: string;
  description: string;

  @minValue(1)
  durationMinutes: int32;
}

model CreateBookingRequest {
  eventTypeId: EventTypeId;
  startAt: utcDateTime;
  guest: Guest;
}

model Error {
  code: ErrorCode;
  message: string;
}

model NotFoundError {
  @statusCode statusCode: 404;
  ...Error;
}

model ConflictError {
  @statusCode statusCode: 409;
  ...Error;
}

model ValidationError {
  @statusCode statusCode: 422;
  ...Error;
}

@tag("Owner")
@route("/admin")
namespace AdminApi {
  @summary("Return the predefined calendar owner profile used by the admin area.")
  @get
  @route("/owner")
  op getOwner(): Owner;

  @summary("Create an event type owned by the predefined calendar owner.")
  @post
  @route("/event-types")
  op createEventType(@body request: CreateEventTypeRequest): EventType | ValidationError;

  @summary("List event types created by the predefined calendar owner.")
  @get
  @route("/event-types")
  op listEventTypes(): EventType[];

  @summary("List upcoming bookings across all event types in one chronological feed.")
  @get
  @route("/bookings/upcoming")
  op listUpcomingBookings(): Booking[];
}

@tag("Guest")
namespace GuestApi {
  @summary("List public event types available for guest booking.")
  @get
  @route("/event-types")
  op listPublicEventTypes(): PublicEventType[];

  @summary("List available slots for an event type in the next 14 days starting today.")
  @doc("Only free slots inside the default 14-day booking window are returned.")
  @get
  @route("/event-types/{eventTypeId}/slots")
  op listAvailableSlots(@path eventTypeId: EventTypeId): Slot[] | NotFoundError;

  @summary("Create a guest booking for a selected free slot.")
  @doc("The selected start time must be a free slot inside the 14-day booking window. A time can be booked only once across all event types.")
  @post
  @route("/bookings")
  op createBooking(@body request: CreateBookingRequest): Booking | NotFoundError | ConflictError | ValidationError;
}
