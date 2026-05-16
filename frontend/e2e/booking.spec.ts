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
