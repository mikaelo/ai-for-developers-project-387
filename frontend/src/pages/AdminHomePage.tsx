import { Button, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconCalendarStats, IconListDetails, IconUserCircle } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { ErrorState, LoadingState } from "../components/StateView";
import { useAsyncData } from "../hooks";

export function AdminHomePage() {
  const { data: owner, error, loading, reload } = useAsyncData(api.getOwner);

  return (
    <Stack gap="lg">
      <div>
        <Title order={1}>Владелец календаря</Title>
        <Text c="dimmed">Предзаданный профиль админской части без входа в систему.</Text>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {owner && (
        <Card withBorder radius="sm">
          <Group>
            <IconUserCircle size={44} stroke={1.5} />
            <div>
              <Title order={3}>{owner.displayName}</Title>
              <Text c="dimmed" size="sm">
                ID: {owner.id}
              </Text>
              <Text c="dimmed" size="sm">
                Часовой пояс: {owner.timezone}
              </Text>
            </div>
          </Group>
        </Card>
      )}

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Card withBorder radius="sm">
          <Stack>
            <Group>
              <IconListDetails size={32} stroke={1.5} />
              <div>
                <Title order={3}>Типы событий</Title>
                <Text c="dimmed" size="sm">
                  Создавайте и просматривайте виды звонков.
                </Text>
              </div>
            </Group>
            <Button component={Link} to="/admin/event-types">
              Открыть типы событий
            </Button>
          </Stack>
        </Card>

        <Card withBorder radius="sm">
          <Stack>
            <Group>
              <IconCalendarStats size={32} stroke={1.5} />
              <div>
                <Title order={3}>Предстоящие встречи</Title>
                <Text c="dimmed" size="sm">
                  Смотрите бронирования всех типов событий.
                </Text>
              </div>
            </Group>
            <Button component={Link} to="/admin/bookings">
              Открыть встречи
            </Button>
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
