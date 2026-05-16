import {
  Badge,
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCalendarCheck, IconClock } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, getErrorMessage } from "../api";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";
import { formatDate, formatTimeRange } from "../format";
import { useAsyncData } from "../hooks";
import type { Slot } from "../types";

export function BookingPage() {
  const { eventTypeId = "" } = useParams();
  const navigate = useNavigate();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const loadSlots = useCallback(() => api.listAvailableSlots(eventTypeId), [eventTypeId]);
  const { data: slots, error, loading, reload } = useAsyncData(loadSlots);
  const form = useForm({
    initialValues: { name: "", email: "" },
    validate: {
      name: (value) => (value.trim().length < 2 ? "Введите имя" : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Введите email"),
    },
  });

  const groupedSlots = useMemo(() => {
    return (slots ?? []).reduce<Record<string, Slot[]>>((acc, slot) => {
      const key = dayjs(slot.startAt).format("YYYY-MM-DD");
      acc[key] = [...(acc[key] ?? []), slot];
      return acc;
    }, {});
  }, [slots]);

  async function submitBooking(values: typeof form.values) {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      await api.createBooking({
        eventTypeId,
        startAt: selectedSlot.startAt,
        guest: {
          name: values.name.trim(),
          email: values.email.trim(),
        },
      });
      notifications.show({
        color: "teal",
        title: "Бронирование создано",
        message: "Встреча успешно добавлена в календарь.",
      });
      navigate("/event-types");
    } catch (requestError) {
      notifications.show({
        color: "red",
        title: "Не удалось создать бронирование",
        message: getErrorMessage(requestError),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={1}>Свободные слоты</Title>
        <Text c="dimmed">Доступны слоты на ближайшие 14 дней.</Text>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {slots?.length === 0 && <EmptyState title="Слотов нет" description="Для этого типа события нет свободного времени." />}

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Stack gap="md">
          {Object.entries(groupedSlots).map(([date, daySlots]) => (
            <Card key={date} withBorder radius="sm">
              <Stack gap="sm">
                <Title order={3}>{formatDate(daySlots[0].startAt)}</Title>
                <Group gap="xs">
                  {daySlots.map((slot) => (
                    <Button
                      key={slot.startAt}
                      data-testid="slot-button"
                      data-start-at={slot.startAt}
                      variant={selectedSlot?.startAt === slot.startAt ? "filled" : "light"}
                      leftSection={<IconClock size={15} />}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {formatTimeRange(slot.startAt, slot.endAt)}
                    </Button>
                  ))}
                </Group>
              </Stack>
            </Card>
          ))}
        </Stack>

        <Card withBorder radius="sm" h="fit-content">
          <form onSubmit={form.onSubmit(submitBooking)}>
            <Stack>
              <Group justify="space-between">
                <Title order={3}>Данные гостя</Title>
                {selectedSlot && <Badge leftSection={<IconCalendarCheck size={12} />}>Слот выбран</Badge>}
              </Group>
              <TextInput label="Имя" placeholder="Анна" {...form.getInputProps("name")} />
              <TextInput label="Email" placeholder="anna@example.com" {...form.getInputProps("email")} />
              <Button type="submit" loading={submitting} disabled={!selectedSlot}>
                Забронировать
              </Button>
            </Stack>
          </form>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
