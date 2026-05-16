using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace CallCalendar.Api.Tests;

public sealed class BookingApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client;

    public BookingApiTests(WebApplicationFactory<Program> factory)
    {
        client = factory.CreateClient();
    }

    [Fact]
    public async Task PublicEventTypesMatchAdminEventTypes()
    {
        var adminTypes = await client.GetFromJsonAsync<EventTypeDto[]>("/api/admin/event-types");
        var publicTypes = await client.GetFromJsonAsync<EventTypeDto[]>("/api/event-types");

        Assert.NotNull(adminTypes);
        Assert.NotNull(publicTypes);
        Assert.NotEmpty(publicTypes);
        Assert.Equal(adminTypes!.Select(x => x.Id).Order(), publicTypes!.Select(x => x.Id).Order());
    }

    [Fact]
    public async Task CreateEventTypeReturnsCreatedModel()
    {
        var request = new CreateEventTypeRequestDto("pairing", "Pairing", "Pairing session.", 45);

        var response = await client.PostAsJsonAsync("/api/admin/event-types", request);

        response.EnsureSuccessStatusCode();
        var created = await response.Content.ReadFromJsonAsync<EventTypeDto>();
        Assert.Equal(request.Id, created!.Id);
        Assert.Equal(request.DurationMinutes, created.DurationMinutes);
    }

    [Fact]
    public async Task AvailableSlotsAreBookableAndMarkedAvailable()
    {
        var slots = await client.GetFromJsonAsync<SlotDto[]>("/api/event-types/intro-call/slots");

        Assert.NotNull(slots);
        Assert.NotEmpty(slots);
        Assert.All(slots!, slot => Assert.True(slot.Available));
    }

    [Fact]
    public async Task CreateBookingAndRejectSameTimeAcrossEventTypes()
    {
        await client.PostAsJsonAsync("/api/admin/event-types", new CreateEventTypeRequestDto(
            "same-time-other-type",
            "Same time other type",
            "Different event type with same duration.",
            30));
        var slots = await client.GetFromJsonAsync<SlotDto[]>("/api/event-types/intro-call/slots");
        var selected = Assert.Single(slots!.Take(1));

        var firstResponse = await client.PostAsJsonAsync("/api/bookings", new CreateBookingRequestDto(
            "intro-call",
            selected.StartAt,
            new GuestDto("Anna", "anna@example.com")));

        firstResponse.EnsureSuccessStatusCode();
        var booking = await firstResponse.Content.ReadFromJsonAsync<BookingDto>();
        Assert.Equal("intro-call", booking!.EventTypeId);
        Assert.Equal("confirmed", booking.Status);

        var secondResponse = await client.PostAsJsonAsync("/api/bookings", new CreateBookingRequestDto(
            "same-time-other-type",
            selected.StartAt,
            new GuestDto("Ivan", "ivan@example.com")));

        Assert.Equal(HttpStatusCode.Conflict, secondResponse.StatusCode);
        var error = await secondResponse.Content.ReadFromJsonAsync<ErrorDto>();
        Assert.Equal("SlotUnavailable", error!.Code);
    }

    [Fact]
    public async Task UnknownEventTypeReturnsNotFound()
    {
        var response = await client.GetAsync("/api/event-types/missing/slots");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ErrorDto>();
        Assert.Equal("EventTypeNotFound", error!.Code);
    }

    [Fact]
    public async Task BookingOutsideWindowReturnsValidationError()
    {
        var response = await client.PostAsJsonAsync("/api/bookings", new CreateBookingRequestDto(
            "intro-call",
            DateTimeOffset.UtcNow.AddDays(30),
            new GuestDto("Anna", "anna@example.com")));

        Assert.Equal((HttpStatusCode)422, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ErrorDto>();
        Assert.Equal("SlotOutsideBookingWindow", error!.Code);
    }

    [Fact]
    public async Task UpcomingBookingsReturnCreatedBookings()
    {
        var slots = await client.GetFromJsonAsync<SlotDto[]>("/api/event-types/consultation/slots");
        var selected = Assert.Single(slots!.Take(1));
        var createResponse = await client.PostAsJsonAsync("/api/bookings", new CreateBookingRequestDto(
            "consultation",
            selected.StartAt,
            new GuestDto("Maria", "maria@example.com")));
        createResponse.EnsureSuccessStatusCode();

        var bookings = await client.GetFromJsonAsync<BookingDto[]>("/api/admin/bookings/upcoming");

        Assert.NotNull(bookings);
        Assert.Contains(bookings!, booking => booking.EventTypeId == "consultation" && booking.Guest.Email == "maria@example.com");
    }

    private sealed record EventTypeDto(string Id, string Title, string Description, int DurationMinutes);
    private sealed record SlotDto(string EventTypeId, DateTimeOffset StartAt, DateTimeOffset EndAt, int DurationMinutes, bool Available);
    private sealed record GuestDto(string Name, string Email);
    private sealed record CreateEventTypeRequestDto(string Id, string Title, string Description, int DurationMinutes);
    private sealed record CreateBookingRequestDto(string EventTypeId, DateTimeOffset StartAt, GuestDto Guest);
    private sealed record BookingDto(string Id, string EventTypeId, string EventTypeTitle, DateTimeOffset StartAt, DateTimeOffset EndAt, GuestDto Guest, string Status);
    private sealed record ErrorDto(string Code, string Message);
}
