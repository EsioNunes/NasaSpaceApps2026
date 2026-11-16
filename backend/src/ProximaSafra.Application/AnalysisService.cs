using ProximaSafra.Domain;
using ProximaSafra.Domain.Scoring;

namespace ProximaSafra.Application;

public sealed class AnalysisService(IEnvironmentalDataProvider environment, INasaPowerDataProvider nasaPower,
    IRotationCatalog catalog,
    IScoringEngine scoring, IAnalysisRepository repository) : IAnalysisService
{
    public async Task<AnalysisResult> AnalyzeAsync(AnalyzeRotationCommand command, CancellationToken ct)
    {
        Validate(command);
        var currentWeatherTask = environment.GetAsync(command.Latitude, command.Longitude, ct);
        var nasaPowerTask = nasaPower.GetAsync(command.Latitude, command.Longitude, ct);
        var profile = await currentWeatherTask;
        try
        {
            var nasaPowerProfile = await nasaPowerTask;
            profile = profile with
            {
                DataQuality = Math.Min(profile.DataQuality, nasaPowerProfile.DataQuality),
                NasaPower = nasaPowerProfile
            };
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (HttpRequestException)
        {
            await nasaPowerTask.ContinueWith(_ => { }, CancellationToken.None);
        }

        var strategies = catalog.GetCandidates(command.CycleCount)
            .Select(x => scoring.Calculate(x, profile, command.Priority, command.HasIrrigation))
            .OrderByDescending(x => x.Eligibility is EligibilityStatus.Viable or EligibilityStatus.ViableWithCaveats)
            .ThenByDescending(x => x.FinalScore)
            .Take(5)
            .ToArray();
        var result = new AnalysisResult(Guid.NewGuid(), command.AreaName, command.Priority,
            profile.CurrentWeather ?? throw new InvalidOperationException("Weather data is not available.\nDados meteorológicos não disponíveis."), strategies);
        await repository.SaveAsync(result, ct);
        return result;
    }

    public Task<AnalysisResult?> GetAsync(Guid id, CancellationToken ct) => repository.GetAsync(id, ct);

    private static void Validate(AnalyzeRotationCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.AreaName))
        {
            throw new ArgumentException("Area name is required.\nO nome da área é obrigatório.", nameof(command));
        }

        if (command.CycleCount is < 1 or > 5)
        {
            throw new ArgumentOutOfRangeException(nameof(command.CycleCount), "The number of cycles must be between 1 and 5.\nA quantidade de ciclos deve estar entre 1 e 5.");
        }
    }
}
