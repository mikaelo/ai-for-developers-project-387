# Calendar Calls Domain And API Task

## Domain Entities

- Owner: the single predefined calendar owner profile used by the admin area. The product has no registration, login, or owner selection.
- Event type: a bookable meeting kind created by the owner. It has an `id`, `title`, `description`, and `durationMinutes`.
- Slot: a candidate time interval for a selected event type. Public slots are generated for the next 14 days starting from the current date and only free slots can be booked.
- Booking: a confirmed guest reservation for an event type at a selected start time. Bookings reserve time globally across all event types.
- Guest: an unauthenticated visitor who can view public event types, choose a free slot, and create a booking without creating an account.

## Agent Task

Implement the API contract for the "Calendar Calls" application as a TypeSpec specification.

The contract must support the owner scenario: create event types and view all upcoming bookings across all event types in one list.

The contract must support the guest scenario: view public event types, list available slots for a selected event type within the next 14 days, and create a booking for a selected free slot.

The contract must explicitly document that the same time cannot be booked twice, even when bookings belong to different event types. It must not introduce authentication, registration, or user accounts.

## Coverage Checklist

- Owner profile is modeled as a predefined entity.
- Owner can create and list event types.
- Owner can list upcoming bookings across all event types.
- Guest can list public event types.
- Guest can list available slots for an event type.
- Guest booking window is limited to 14 days starting from the current date.
- Guest can create a booking for a free slot.
- Double booking the same time is represented as a conflict.
