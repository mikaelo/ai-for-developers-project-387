import { expect, test } from "@playwright/test";

test("guest books an intro call and owner sees it", async ({ page, request }) => {
  await page.goto("/event-types");

  const introCard = page.getByTestId("event-type-intro-call");
  await expect(introCard).toContainText("Intro call");
  await introCard.getByRole("link", { name: "Выбрать слот" }).click();

  await expect(page.getByRole("heading", { name: "Свободные слоты" })).toBeVisible();
  const firstSlot = page.getByTestId("slot-button").first();
  await expect(firstSlot).toBeVisible();
  const startAt = await firstSlot.getAttribute("data-start-at");
  expect(startAt).toBeTruthy();
  await firstSlot.click();

  await page.getByLabel("Имя").fill("Playwright Guest");
  await page.getByLabel("Email").fill("playwright@example.com");
  await page.getByRole("button", { name: "Забронировать" }).click();

  await expect(page.getByText("Бронирование создано")).toBeVisible();
  await expect(page).toHaveURL(/\/event-types$/);

  const duplicateResponse = await request.post("http://127.0.0.1:5080/bookings", {
    data: {
      eventTypeId: "intro-call",
      startAt,
      guest: {
        name: "Duplicate Guest",
        email: "duplicate@example.com",
      },
    },
  });
  expect(duplicateResponse.status()).toBe(409);
  await expect(duplicateResponse.json()).resolves.toEqual({
    code: "SlotUnavailable",
    message: "Selected slot is already booked.",
  });

  await page.goto("/admin/bookings");
  const bookingsTable = page.getByTestId("admin-bookings-table");
  await expect(bookingsTable).toContainText("Playwright Guest");
  await expect(bookingsTable).toContainText("playwright@example.com");
  await expect(bookingsTable).toContainText("Intro call");
  await expect(bookingsTable).toContainText("confirmed");
});

test("direct frontend routes render without 404", async ({ page, request }) => {
  const eventTypeResponse = await page.goto("/event-types/consultation");
  expect(eventTypeResponse?.status()).not.toBe(404);
  await expect(page.getByRole("heading", { name: "Свободные слоты" })).toBeVisible();
  await expect(page.getByTestId("slot-button").first()).toBeVisible();

  const adminBookingsResponse = await page.goto("/admin/bookings");
  expect(adminBookingsResponse?.status()).not.toBe(404);
  await expect(page.getByRole("heading", { name: "Предстоящие встречи" })).toBeVisible();

  const eventTypesApiResponse = await request.get("http://127.0.0.1:5080/event-types");
  expect(eventTypesApiResponse.status()).toBe(200);
  expect(eventTypesApiResponse.headers()["content-type"]).toContain("application/json");
  const eventTypes = await eventTypesApiResponse.json();
  expect(eventTypes).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: "consultation" }),
    ]),
  );

  const slotsApiResponse = await request.get("http://127.0.0.1:5080/event-types/consultation/slots");
  expect(slotsApiResponse.status()).toBe(200);
  expect(slotsApiResponse.headers()["content-type"]).toContain("application/json");
  const slots = await slotsApiResponse.json();
  expect(slots.length).toBeGreaterThan(0);
  expect(slots[0]).toEqual(expect.objectContaining({ eventTypeId: "consultation" }));
});
