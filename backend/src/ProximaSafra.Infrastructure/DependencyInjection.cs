using Microsoft.Extensions.DependencyInjection;
using ProximaSafra.Application;
using ProximaSafra.Domain.Scoring;

namespace ProximaSafra.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddProximaSafra(this IServiceCollection services) => services
        .AddSingleton<IAnalysisRepository, InMemoryAnalysisRepository>()
        .AddSingleton(new HttpClient())
        .AddSingleton<OpenMeteoEnvironmentalDataProvider>()
        .AddSingleton<NasaPowerEnvironmentalDataProvider>()
        .AddSingleton<IEnvironmentalDataProvider>(serviceProvider =>
            serviceProvider.GetRequiredService<OpenMeteoEnvironmentalDataProvider>())
        .AddSingleton<INasaPowerDataProvider>(serviceProvider =>
            serviceProvider.GetRequiredService<NasaPowerEnvironmentalDataProvider>())
        .AddSingleton<IRotationCatalog, JsonRotationCatalog>()
        .AddSingleton<IScoringEngine, ScoringEngine>()
        .AddScoped<IAnalysisService, AnalysisService>()
        .AddScoped<IChatAssistant, TemplateChatAssistant>();
}
