using ProximaSafra.Application;
using ProximaSafra.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsProduction())
{
    var port = Environment.GetEnvironmentVariable("PORT");
    if (!string.IsNullOrWhiteSpace(port))
    {
        builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
    }
}

builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddProximaSafra();

var app = builder.Build();
app.UseExceptionHandler();
app.MapOpenApi();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapPost("/api/analyses", async (AnalyzeRotationCommand command, IAnalysisService service, CancellationToken ct) =>
{
    var result = await service.AnalyzeAsync(command, ct);
    return Results.Created($"/api/analyses/{result.Id}", result);
});

app.MapGet("/api/analyses/{id:guid}", async (Guid id, IAnalysisService service, CancellationToken ct) =>
    await service.GetAsync(id, ct) is { } result ? Results.Ok(result) : Results.NotFound());

app.MapPost("/api/chat/actions", async (ChatActionRequest request, IChatAssistant chat, CancellationToken ct) =>
    Results.Ok(await chat.RespondAsync(request, ct)));

app.Run();

public partial class Program;
