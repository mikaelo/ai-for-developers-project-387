import {
  AppShell,
  ActionIcon,
  Container,
  Group,
  NavLink,
  Text,
  Title,
  Tooltip,
  rem,
} from "@mantine/core";
import { IconCalendarEvent, IconSettings } from "@tabler/icons-react";
import { Link, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
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
            <Group gap="sm">
              <Text c="dimmed" size="sm">
                API: {import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:5080"}
              </Text>
              <Tooltip label="Страница владельца">
                <ActionIcon
                  aria-label="Открыть страницу владельца"
                  component={Link}
                  to="/admin"
                  variant={location.pathname.startsWith("/admin") ? "filled" : "light"}
                  size="lg"
                >
                  <IconSettings size={20} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={Link}
          to="/booking"
          label="Бронирование"
          leftSection={<IconCalendarEvent style={{ width: rem(18), height: rem(18) }} />}
          active={!location.pathname.startsWith("/admin")}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xl">
          <Routes>
            <Route path="/" element={<Navigate to="/booking" replace />} />
            <Route path="/booking" element={<EventTypesPage />} />
            <Route path="/booking/:eventTypeId" element={<BookingPage />} />
            <Route path="/event-types" element={<Navigate to="/booking" replace />} />
            <Route path="/event-types/:eventTypeId" element={<LegacyEventTypeRedirect />} />
            <Route path="/admin" element={<AdminHomePage />} />
            <Route path="/admin/event-types" element={<AdminEventTypesPage />} />
            <Route path="/admin/bookings" element={<AdminBookingsPage />} />
          </Routes>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

function LegacyEventTypeRedirect() {
  const { eventTypeId = "" } = useParams();

  return <Navigate to={`/booking/${eventTypeId}`} replace />;
}
