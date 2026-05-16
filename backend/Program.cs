using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);
var port = Environment.GetEnvironmentVariable("PORT");

if (!string.IsNullOrWhiteSpace(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://127.0.0.1:5173", "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
});
builder.Services.AddOpenApi();
builder.Services.AddSingleton<ICalendarStore, InMemoryCalendarStore>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("Frontend");

var webRootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
if (Directory.Exists(webRootPath))
{
    var webRootProvider = new PhysicalFileProvider(webRootPath);
    app.UseDefaultFiles(new DefaultFilesOptions
    {
        FileProvider = webRootProvider,
    });
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = webRootProvider,
    });
}

app.MapGet("/admin/owner", (ICalendarStore store) => store.Owner);

app.MapGet("/admin/event-types", (ICalendarStore store) => store.ListEventTypes());

app.MapPost("/admin/event-types", (CreateEventTypeRequest request, ICalendarStore store) =>
{
    var result = store.CreateEventType(request);
    return result.Match(
        created => Results.Ok(created),
        error => Results.Json(error.Body, statusCode: error.StatusCode));
});

app.MapGet("/admin/bookings/upcoming", (ICalendarStore store) => store.ListUpcomingBookings());

app.MapGet("/event-types", (ICalendarStore store) => store.ListPublicEventTypes());

app.MapGet("/event-types/{eventTypeId}/slots", (string eventTypeId, ICalendarStore store) =>
{
    var result = store.ListAvailableSlots(eventTypeId);
    return result.Match(
        slots => Results.Ok(slots),
        error => Results.Json(error.Body, statusCode: error.StatusCode));
});

app.MapPost("/bookings", (CreateBookingRequest request, ICalendarStore store) =>
{
    var result = store.CreateBooking(request);
    return result.Match(
        booking => Results.Ok(booking),
        error => Results.Json(error.Body, statusCode: error.StatusCode));
});

app.MapGet("/", ServeFrontendApp);
app.MapGet("/admin", ServeFrontendApp);
app.MapGet("/admin/bookings", ServeFrontendApp);
app.MapGet("/event-types/{eventTypeId}", ServeFrontendApp);

app.MapFallback(async context =>
{
    if (HttpMethods.IsGet(context.Request.Method) &&
        context.Request.Headers.Accept.Any(value => value?.Contains("text/html", StringComparison.OrdinalIgnoreCase) == true))
    {
        await SendFrontendApp(context, webRootPath);
        return;
    }

    context.Response.StatusCode = StatusCodes.Status404NotFound;
});

app.Run();

static Task ServeFrontendApp(HttpContext context) => SendFrontendApp(
    context,
    Path.Combine(context.RequestServices.GetRequiredService<IWebHostEnvironment>().ContentRootPath, "wwwroot"));

static async Task SendFrontendApp(HttpContext context, string webRootPath)
{
    var indexPath = Path.Combine(webRootPath, "index.html");
    if (!File.Exists(indexPath))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    context.Response.ContentType = "text/html";
    await context.Response.SendFileAsync(indexPath);
}

public partial class Program;

public interface ICalendarStore
{
    Owner Owner { get; }
    IReadOnlyCollection<EventType> ListEventTypes();
    Result<EventType> CreateEventType(CreateEventTypeRequest request);
    IReadOnlyCollection<PublicEventType> ListPublicEventTypes();
    Result<IReadOnlyCollection<Slot>> ListAvailableSlots(string eventTypeId);
    Result<Booking> CreateBooking(CreateBookingRequest request);
    IReadOnlyCollection<Booking> ListUpcomingBookings();
}

public sealed class InMemoryCalendarStore : ICalendarStore
{
    private static readonly TimeOnly WorkdayStart = new(9, 0);
    private static readonly TimeOnly WorkdayEnd = new(18, 0);
    private static readonly TimeSpan SlotStep = TimeSpan.FromMinutes(30);
    private static readonly TimeSpan BookingWindow = TimeSpan.FromDays(14);

    private readonly ConcurrentDictionary<string, EventType> eventTypes = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, Booking> bookings = new(StringComparer.OrdinalIgnoreCase);
    private readonly object bookingLock = new();

    public InMemoryCalendarStore()
    {
        Owner = new Owner("owner-default", "Calendar Owner", "Europe/Moscow");

        eventTypes.TryAdd("intro-call", new EventType(
            "intro-call",
            "Intro call",
            "Short introductory meeting.",
            30));
        eventTypes.TryAdd("consultation", new EventType(
            "consultation",
            "Consultation",
            "Detailed consultation call.",
            60));
    }

    public Owner Owner { get; }

    public IReadOnlyCollection<EventType> ListEventTypes() =>
        eventTypes.Values.OrderBy(eventType => eventType.Title).ToArray();

    public Result<EventType> CreateEventType(CreateEventTypeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Id) ||
            string.IsNullOrWhiteSpace(request.Title) ||
            string.IsNullOrWhiteSpace(request.Description))
        {
            return Error.Validation("ValidationFailed", "Event type id, title, and description are required.");
        }

        if (request.DurationMinutes <= 0)
        {
            return Error.Validation("InvalidEventDuration", "Event duration must be greater than zero.");
        }

        var eventType = new EventType(
            request.Id.Trim(),
            request.Title.Trim(),
            request.Description.Trim(),
            request.DurationMinutes);

        eventTypes.AddOrUpdate(eventType.Id, eventType, (_, _) => eventType);

        return eventType;
    }

    public IReadOnlyCollection<PublicEventType> ListPublicEventTypes() =>
        ListEventTypes()
            .Select(eventType => new PublicEventType(
                eventType.Id,
                eventType.Title,
                eventType.Description,
                eventType.DurationMinutes))
            .ToArray();

    public Result<IReadOnlyCollection<Slot>> ListAvailableSlots(string eventTypeId)
    {
        if (!eventTypes.TryGetValue(eventTypeId, out var eventType))
        {
            return Error.NotFound("EventTypeNotFound", "Event type was not found.");
        }

        return GenerateAvailableSlots(eventType).ToArray();
    }

    public Result<Booking> CreateBooking(CreateBookingRequest request)
    {
        if (!eventTypes.TryGetValue(request.EventTypeId, out var eventType))
        {
            return Error.NotFound("EventTypeNotFound", "Event type was not found.");
        }

        if (string.IsNullOrWhiteSpace(request.Guest.Name) || string.IsNullOrWhiteSpace(request.Guest.Email))
        {
            return Error.Validation("ValidationFailed", "Guest name and email are required.");
        }

        var startAt = NormalizeToUtc(request.StartAt);
        var endAt = startAt.AddMinutes(eventType.DurationMinutes);

        if (!IsInsideBookingWindow(startAt))
        {
            return Error.Validation("SlotOutsideBookingWindow", "Slot must be inside the next 14 days.");
        }

        if (!IsValidSlot(startAt, endAt))
        {
            return Error.Validation("ValidationFailed", "Selected start time is not an available slot.");
        }

        lock (bookingLock)
        {
            if (bookings.Values.Any(booking => Overlaps(startAt, endAt, booking.StartAt, booking.EndAt)))
            {
                return Error.Conflict("SlotUnavailable", "Selected slot is already booked.");
            }

            var booking = new Booking(
                Guid.NewGuid().ToString("N"),
                eventType.Id,
                eventType.Title,
                startAt,
                endAt,
                new Guest(request.Guest.Name.Trim(), request.Guest.Email.Trim()),
                BookingStatus.Confirmed);

            bookings.TryAdd(booking.Id, booking);

            return booking;
        }
    }

    public IReadOnlyCollection<Booking> ListUpcomingBookings()
    {
        var now = DateTimeOffset.UtcNow;

        return bookings.Values
            .Where(booking => booking.StartAt >= now)
            .OrderBy(booking => booking.StartAt)
            .ToArray();
    }

    private IEnumerable<Slot> GenerateAvailableSlots(EventType eventType)
    {
        var today = DateOnly.FromDateTime(DateTimeOffset.UtcNow.UtcDateTime);

        for (var dayOffset = 0; dayOffset < 14; dayOffset++)
        {
            var date = today.AddDays(dayOffset);
            for (var time = WorkdayStart; time.Add(TimeSpan.FromMinutes(eventType.DurationMinutes)) <= WorkdayEnd; time = time.Add(SlotStep))
            {
                var startAt = new DateTimeOffset(date.ToDateTime(time), TimeSpan.Zero);
                var endAt = startAt.AddMinutes(eventType.DurationMinutes);

                if (startAt < DateTimeOffset.UtcNow)
                {
                    continue;
                }

                if (bookings.Values.Any(booking => Overlaps(startAt, endAt, booking.StartAt, booking.EndAt)))
                {
                    continue;
                }

                yield return new Slot(eventType.Id, startAt, endAt, eventType.DurationMinutes, true);
            }
        }
    }

    private static DateTimeOffset NormalizeToUtc(DateTimeOffset value) => value.ToUniversalTime();

    private static bool IsInsideBookingWindow(DateTimeOffset startAt)
    {
        var now = DateTimeOffset.UtcNow;
        return startAt >= now && startAt < now.Add(BookingWindow);
    }

    private static bool IsValidSlot(DateTimeOffset startAt, DateTimeOffset endAt)
    {
        var time = TimeOnly.FromDateTime(startAt.UtcDateTime);
        var endTime = TimeOnly.FromDateTime(endAt.UtcDateTime);
        var minutesFromWorkdayStart = (time - WorkdayStart).TotalMinutes;

        return time >= WorkdayStart &&
               endTime <= WorkdayEnd &&
               minutesFromWorkdayStart >= 0 &&
               minutesFromWorkdayStart % SlotStep.TotalMinutes == 0;
    }

    private static bool Overlaps(DateTimeOffset leftStart, DateTimeOffset leftEnd, DateTimeOffset rightStart, DateTimeOffset rightEnd) =>
        leftStart < rightEnd && rightStart < leftEnd;
}

public sealed record Owner(string Id, string DisplayName, string Timezone);

public sealed record EventType(string Id, string Title, string Description, int DurationMinutes);

public sealed record PublicEventType(string Id, string Title, string Description, int DurationMinutes);

public sealed record Slot(string EventTypeId, DateTimeOffset StartAt, DateTimeOffset EndAt, int DurationMinutes, bool Available);

public sealed record Guest(string Name, string Email);

public sealed record Booking(
    string Id,
    string EventTypeId,
    string EventTypeTitle,
    DateTimeOffset StartAt,
    DateTimeOffset EndAt,
    Guest Guest,
    BookingStatus Status);

public sealed record CreateEventTypeRequest(string Id, string Title, string Description, int DurationMinutes);

public sealed record CreateBookingRequest(string EventTypeId, DateTimeOffset StartAt, Guest Guest);

public enum BookingStatus
{
    Confirmed,
    Cancelled,
}

public sealed record ErrorBody(string Code, string Message);

public sealed record Error(int StatusCode, ErrorBody Body)
{
    public static Error NotFound(string code, string message) => new(404, new ErrorBody(code, message));
    public static Error Conflict(string code, string message) => new(409, new ErrorBody(code, message));
    public static Error Validation(string code, string message) => new(422, new ErrorBody(code, message));
}

public readonly record struct Result<T>(T? Value, Error? Error)
{
    public static implicit operator Result<T>(T value) => new(value, null);
    public static implicit operator Result<T>(Error error) => new(default, error);

    public TResult Match<TResult>(Func<T, TResult> onSuccess, Func<Error, TResult> onError) =>
        Error is null ? onSuccess(Value!) : onError(Error);
}
