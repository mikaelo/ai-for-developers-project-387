import {
  AppShell,
  Container,
  Group,
  NavLink,
  Text,
  Title,
  rem,
} from "@mantine/core";
import { IconCalendarEvent, IconSettings } from "@tabler/icons-react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AdminBookingsPage } from "./pages/AdminBookingsPage";
import { AdminEventTypesPage } from "./pages/AdminEventTypesPage";
import { AdminHomePage } from "./pages/AdminHomePage";
import { BookingPage } from "./pages/BookingPage";
import { EventTypesPage } from "./pages/EventTypesPage";

export function App() {
  const location = useLocation();

  return (
    <AppShell header={{ height: 64 }} navbar={{ width: 248, breakpoint: "sm" }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Group gap="sm">
              <IconCalendarEvent size={26} stroke={1.8} />
              <div>
                <Title order={3}>Call Calendar</Title>
                <Text c="dimmed" size="xs">
                  Бронирование звонков
                </Text>
              </div>
            </Group>
            <Text c="dimmed" size="sm">
              API: {import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:5080"}
            </Text>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={Link}
          to="/event-types"
          label="Бронирование"
          leftSection={<IconCalendarEvent style={{ width: rem(18), height: rem(18) }} />}
          active={!location.pathname.startsWith("/admin")}
        />
        <NavLink
          component={Link}
          to="/admin"
          label="Владелец"
          leftSection={<IconSettings style={{ width: rem(18), height: rem(18) }} />}
          active={location.pathname.startsWith("/admin")}
        />
        <NavLink component={Link} to="/admin/event-types" label="Типы событий" pl="xl" />
        <NavLink component={Link} to="/admin/bookings" label="Встречи" pl="xl" />
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xl">
          <Routes>
            <Route path="/" element={<Navigate to="/event-types" replace />} />
            <Route path="/event-types" element={<EventTypesPage />} />
            <Route path="/event-types/:eventTypeId" element={<BookingPage />} />
            <Route path="/admin" element={<AdminHomePage />} />
            <Route path="/admin/event-types" element={<AdminEventTypesPage />} />
            <Route path="/admin/bookings" element={<AdminBookingsPage />} />
          </Routes>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
