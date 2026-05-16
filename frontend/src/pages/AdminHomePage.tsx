import { Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconUserCircle } from "@tabler/icons-react";
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
    </Stack>
  );
}
