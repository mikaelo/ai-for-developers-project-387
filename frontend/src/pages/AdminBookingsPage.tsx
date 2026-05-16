import { Badge, Card, Stack, Table, Text, Title } from "@mantine/core";
import { api } from "../api";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";
import { formatDateTime } from "../format";
import { useAsyncData } from "../hooks";

export function AdminBookingsPage() {
  const { data, error, loading, reload } = useAsyncData(api.listUpcomingBookings);

  return (
    <Stack gap="lg">
      <div>
        <Title order={1}>Предстоящие встречи</Title>
        <Text c="dimmed">Единый список бронирований всех типов событий.</Text>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data?.length === 0 && <EmptyState title="Встреч нет" description="Будущие бронирования пока отсутствуют." />}

      {data && data.length > 0 && (
        <Card withBorder radius="sm" p={0}>
          <Table striped highlightOnHover verticalSpacing="md" data-testid="admin-bookings-table">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Время</Table.Th>
                <Table.Th>Тип события</Table.Th>
                <Table.Th>Гость</Table.Th>
                <Table.Th>Статус</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((booking) => (
                <Table.Tr key={booking.id}>
                  <Table.Td>
                    <Text fw={600}>{formatDateTime(booking.startAt)}</Text>
                    <Text c="dimmed" size="sm">
                      до {formatDateTime(booking.endAt)}
                    </Text>
                  </Table.Td>
                  <Table.Td>{booking.eventTypeTitle}</Table.Td>
                  <Table.Td>
                    <Text>{booking.guest.name}</Text>
                    <Text c="dimmed" size="sm">
                      {booking.guest.email}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={booking.status === "confirmed" ? "teal" : "gray"}>{booking.status}</Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}
    </Stack>
  );
}
