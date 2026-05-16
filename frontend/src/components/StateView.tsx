import { Alert, Button, Center, Loader, Stack, Text } from "@mantine/core";
import type { MantineColor } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

export function LoadingState({ color }: { color?: MantineColor } = {}) {
  return (
    <Center py="xl">
      <Loader color={color} />
    </Center>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Center py="xl">
      <Stack align="center" gap={4}>
        <Text fw={700}>{title}</Text>
        <Text c="dimmed" size="sm">
          {description}
        </Text>
      </Stack>
    </Center>
  );
}

export function ErrorState({ color = "red", message, onRetry }: { color?: MantineColor; message: string; onRetry: () => void }) {
  return (
    <Alert color={color} icon={<IconAlertCircle size={18} />} title="Ошибка запроса">
      <Stack gap="sm">
        <Text size="sm">{message}</Text>
        <Button variant="light" color={color} onClick={onRetry} w="fit-content">
          Повторить
        </Button>
      </Stack>
    </Alert>
  );
}
