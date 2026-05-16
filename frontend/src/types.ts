export type EventTypeId = string;
export type BookingId = string;
export type OwnerId = string;

export type BookingStatus = "confirmed" | "cancelled";

export type ApiErrorCode =
  | "EventTypeNotFound"
  | "BookingNotFound"
  | "SlotUnavailable"
  | "SlotOutsideBookingWindow"
  | "InvalidEventDuration"
  | "ValidationFailed";

export type Owner = {
  id: OwnerId;
  displayName: string;
  timezone: string;
};

export type EventType = {
  id: EventTypeId;
  title: string;
  description: string;
  durationMinutes: number;
};

export type PublicEventType = EventType;

export type Slot = {
  eventTypeId: EventTypeId;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  available: boolean;
};

export type Guest = {
  name: string;
  email: string;
};

export type Booking = {
  id: BookingId;
  eventTypeId: EventTypeId;
  eventTypeTitle: string;
  startAt: string;
  endAt: string;
  guest: Guest;
  status: BookingStatus;
};

export type CreateEventTypeRequest = {
  id: EventTypeId;
  title: string;
  description: string;
  durationMinutes: number;
};

export type CreateBookingRequest = {
  eventTypeId: EventTypeId;
  startAt: string;
  guest: Guest;
};

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
};
