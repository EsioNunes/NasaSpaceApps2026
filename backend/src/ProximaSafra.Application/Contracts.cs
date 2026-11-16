using ProximaSafra.Domain;

namespace ProximaSafra.Application;

public sealed record AnalyzeRotationCommand(string AreaName, double Latitude, double Longitude, bool HasIrrigation,
    FarmerPriority Priority, int CycleCount = 3);
public sealed record ChatActionRequest(Guid AnalysisId, string Action, Guid? StrategyId);
public sealed record ChatResponse(string Message, IReadOnlyList<ChatOption> Options);
public sealed record ChatOption(string Action, string Label);

public interface IAnalysisService
{
    Task<AnalysisResult> AnalyzeAsync(AnalyzeRotationCommand command, CancellationToken ct);
    Task<AnalysisResult?> GetAsync(Guid id, CancellationToken ct);
}
public interface IAnalysisRepository
{
    Task SaveAsync(AnalysisResult result, CancellationToken ct);
    Task<AnalysisResult?> GetAsync(Guid id, CancellationToken ct);
}
public interface IEnvironmentalDataProvider
{
    Task<EnvironmentalProfile> GetAsync(double latitude, double longitude, CancellationToken ct);
}
public interface INasaPowerDataProvider
{
    Task<NasaPowerProfile> GetAsync(double latitude, double longitude, CancellationToken ct);
}
public interface IRotationCatalog
{
    IReadOnlyList<RotationCandidate> GetCandidates(int cycleCount = 3);
}
public interface IChatAssistant
{
    Task<ChatResponse> RespondAsync(ChatActionRequest request, CancellationToken ct);
}
