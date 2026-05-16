import { Button, Card, NumberInput, SimpleGrid, Stack, Text, TextInput, Textarea, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { api, getErrorMessage } from "../api";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";
import { useAsyncData } from "../hooks";

export function AdminEventTypesPage() {
  const { data, error, loading, reload } = useAsyncData(api.listAdminEventTypes);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm({
    initialValues: {
      id: "",
      title: "",
      description: "",
      durationMinutes: 30,
    },
    validate: {
      id: (value) => (value.trim() ? null : "Введите id"),
      title: (value) => (value.trim() ? null : "Введите название"),
      description: (value) => (value.trim() ? null : "Введите описание"),
      durationMinutes: (value) => (value > 0 ? null : "Длительность должна быть больше 0"),
    },
  });

  async function submitEventType(values: typeof form.values) {
    setSubmitting(true);
    try {
      await api.createEventType({
        id: values.id.trim(),
        title: values.title.trim(),
        description: values.description.trim(),
        durationMinutes: values.durationMinutes,
      });
      notifications.show({
        color: "teal",
        title: "Тип события создан",
        message: "Список обновлен.",
      });
      form.reset();
      await reload();
    } catch (requestError) {
      notifications.show({
        color: "red",
        title: "Не удалось создать тип события",
        message: getErrorMessage(requestError),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={1}>Типы событий</Title>
        <Text c="dimmed">Создание и просмотр видов звонков владельца календаря.</Text>
      </div>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Card withBorder radius="sm">
          <form onSubmit={form.onSubmit(submitEventType)}>
            <Stack>
              <Title order={3}>Новый тип события</Title>
              <TextInput label="ID" placeholder="intro-call" {...form.getInputProps("id")} />
              <TextInput label="Название" placeholder="Вводный звонок" {...form.getInputProps("title")} />
              <Textarea label="Описание" autosize minRows={3} {...form.getInputProps("description")} />
              <NumberInput
                label="Длительность, минут"
                min={1}
                step={5}
                {...form.getInputProps("durationMinutes")}
              />
              <Button type="submit" loading={submitting}>
                Создать
              </Button>
            </Stack>
          </form>
        </Card>

        <Stack>
          {loading && <LoadingState />}
          {error && <ErrorState message={error} onRetry={reload} />}
          {data?.length === 0 && (
            <EmptyState title="Типов событий нет" description="Создайте первый тип события для гостей." />
          )}
          {data?.map((eventType) => (
            <Card key={eventType.id} withBorder radius="sm">
              <Stack gap={6}>
                <Title order={3}>{eventType.title}</Title>
                <Text c="dimmed" size="sm">
                  {eventType.description}
                </Text>
                <Text size="sm">ID: {eventType.id}</Text>
                <Text size="sm">Длительность: {eventType.durationMinutes} минут</Text>
              </Stack>
            </Card>
          ))}
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}
