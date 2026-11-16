using System.Collections.Concurrent;
using System.Text.Json;
using ProximaSafra.Application;
using ProximaSafra.Domain;

namespace ProximaSafra.Infrastructure;

public sealed class InMemoryAnalysisRepository : IAnalysisRepository
{
    private readonly ConcurrentDictionary<Guid, AnalysisResult> _items = new();
    public Task SaveAsync(AnalysisResult result, CancellationToken ct) { _items[result.Id] = result; return Task.CompletedTask; }
    public Task<AnalysisResult?> GetAsync(Guid id, CancellationToken ct) => Task.FromResult(_items.GetValueOrDefault(id));
}

public sealed class DemoEnvironmentalDataProvider : IEnvironmentalDataProvider
{
    public Task<EnvironmentalProfile> GetAsync(double latitude, double longitude, CancellationToken ct) =>
        Task.FromResult(new EnvironmentalProfile(61, 76, 68, 78));
}

public sealed class JsonRotationCatalog : IRotationCatalog
{
    private readonly IReadOnlyList<CultureDefinition> _cultures;

    public JsonRotationCatalog()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "RotationCatalog.json");
        if (!File.Exists(path))
        {
            throw new FileNotFoundException("The crop catalog was not found.\nO catálogo de culturas não foi encontrado.", path);
        }

        var catalog = JsonSerializer.Deserialize<CultureCatalog>(File.ReadAllText(path),
            new JsonSerializerOptions(JsonSerializerDefaults.Web));
        _cultures = catalog?.Cultures ?? throw new InvalidOperationException("The crop catalog is empty or invalid.\nO catálogo de culturas está vazio ou inválido.");
        if (_cultures.Count == 0 || _cultures.Any(x => string.IsNullOrWhiteSpace(x.Id) || x.EnvironmentalAttributes.Count == 0))
        {
            throw new InvalidOperationException("Each culture must have an id and environmental attributes.\nCada cultura deve possuir um id e atributos ambientais.");
        }
    }

    public IReadOnlyList<RotationCandidate> GetCandidates(int cycleCount = 3)
    {
        if (cycleCount is < 1 or > 5)
        {
            throw new ArgumentOutOfRangeException(nameof(cycleCount), "The number of cycles must be between 1 and 5.\nA quantidade de ciclos deve estar entre 1 e 5.");
        }

        var candidates = new List<RotationCandidate>();
        Generate([], cycleCount, candidates);
        return candidates;
    }

    private void Generate(IReadOnlyList<CultureDefinition> sequence, int cycleCount, ICollection<RotationCandidate> candidates)
    {
        if (sequence.Count == cycleCount)
        {
            candidates.Add(CreateCandidate(sequence));
            return;
        }

        foreach (var culture in _cultures)
        {
            Generate(sequence.Append(culture).ToArray(), cycleCount, candidates);
        }
    }

    private static RotationCandidate CreateCandidate(IReadOnlyList<CultureDefinition> sequence)
    {
        var attributes = sequence.SelectMany(x => x.EnvironmentalAttributes.Keys).Distinct()
            .ToDictionary(key => key, key => sequence.Average(x => x.EnvironmentalAttributes.GetValueOrDefault(key, 50)));
        var metadata = new RotationMetadata(
            sequence.Select(x => x.BotanicalFamily).Distinct().ToArray(),
            sequence.Any(x => x.RequiresIrrigation),
            sequence.SelectMany(x => x.KnownRisks).Distinct().ToArray(),
            sequence.Sum(x => x.CycleDays.Minimum),
            sequence.Sum(x => x.CycleDays.Maximum),
            sequence.Min(x => x.TemperatureCelsius.Minimum),
            sequence.Max(x => x.TemperatureCelsius.Maximum),
            sequence.Sum(x => x.WaterRequirement.MillimetersPerCycle),
            sequence.Min(x => x.WaterRequirement.CriticalDryDaysMaximum));

        return new RotationCandidate(Guid.NewGuid(), string.Join(" - ", sequence.Select(x => x.Name)),
            sequence.Select(x => x.Id).ToArray(), attributes, metadata);
    }

    private sealed record CultureCatalog(int Version, IReadOnlyList<CultureDefinition> Cultures);
    private sealed record CultureDefinition(
        string Id,
        string Name,
        string BotanicalFamily,
        CycleDays CycleDays,
        TemperatureRange TemperatureCelsius,
        WaterRequirement WaterRequirement,
        IReadOnlyDictionary<string, double> EnvironmentalAttributes,
        bool RequiresIrrigation,
        IReadOnlyList<string> KnownRisks);
    private sealed record CycleDays(int Minimum, int Maximum);
    private sealed record TemperatureRange(double Minimum, double Maximum);
    private sealed record WaterRequirement(double MillimetersPerCycle, double CriticalDryDaysMaximum);
}
