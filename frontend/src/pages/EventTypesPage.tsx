import { Badge, Button, Card, Grid, Group, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight, IconClock } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";
import { useAsyncData } from "../hooks";

export function EventTypesPage() {
  const { data, error, loading, reload } = useAsyncData(api.listPublicEventTypes);

  return (
    <Stack gap="lg">
      <div>
        <Title order={1}>Выберите тип звонка</Title>
        <Text c="dimmed">Доступные варианты бронирования без регистрации.</Text>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data?.length === 0 && (
        <EmptyState title="Типов событий пока нет" description="Владелец еще не добавил доступные звонки." />
      )}

      <Grid>
        {data?.map((eventType) => (
          <Grid.Col key={eventType.id} span={{ base: 12, md: 6, lg: 4 }}>
            <Card withBorder h="100%" radius="sm" p="lg" data-testid={`event-type-${eventType.id}`}>
              <Stack h="100%" justify="space-between">
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start">
                    <Title order={3}>{eventType.title}</Title>
                    <Badge leftSection={<IconClock size={12} />}>{eventType.durationMinutes} мин</Badge>
                  </Group>
                  <Text c="dimmed" size="sm">
                    {eventType.description}
                  </Text>
                </Stack>
                <Button component={Link} to={`/booking/${eventType.id}`} rightSection={<IconArrowRight size={16} />}>
                  Выбрать слот
                </Button>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  );
}
