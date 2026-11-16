namespace ProximaSafra.Domain;

public enum FarmerPriority { Balanced, WaterConservation, SoilRecovery, ErosionProtection, ProductiveUse }
public enum EligibilityStatus { Viable, ViableWithCaveats, NotRecommended, InsufficientData }

public sealed record FarmArea(Guid Id, string Name, double Latitude, double Longitude, bool HasIrrigation);
public sealed record EnvironmentalProfile(double WaterAvailability, double ClimateSuitability, double ErosionExposure,
    double DataQuality, CurrentWeather? CurrentWeather = null, NasaPowerProfile? NasaPower = null);
public sealed record NasaPowerProfile(
    double Temperature,
    double TemperatureMaximum,
    double TemperatureMinimum,
    double Precipitation,
    double RelativeHumidity,
    double SolarRadiation,
    double WindSpeed,
    double DewPoint,
    double SurfacePressure,
    double RootZoneSoilWetness,
    double SurfaceSoilWetness,
    double ProfileSoilWetness,
    double Evapotranspiration,
    double DataQuality,
    IReadOnlyList<string> MissingParameters);
public sealed record RotationCandidate(Guid Id, string Name, IReadOnlyList<string> Crops,
    IReadOnlyDictionary<string, double> Attributes, RotationMetadata? Metadata = null);
public sealed record RotationMetadata(
    IReadOnlyList<string> BotanicalFamilies,
    bool RequiresIrrigation,
    IReadOnlyList<string> KnownRisks,
    int MinimumCycleDays,
    int MaximumCycleDays,
    double MinimumTemperature,
    double MaximumTemperature,
    double WaterRequirementMillimeters,
    double CriticalDryDaysMaximum);
public sealed record CriterionResult(string Name, double Score, double Weight, double Contribution, string Explanation);
public sealed record StrategyResult(Guid StrategyId, string Name, EligibilityStatus Eligibility, double FinalScore,
    double Confidence, IReadOnlyList<CriterionResult> Criteria, IReadOnlyList<string> PositiveFactors,
    IReadOnlyList<string> Risks, IReadOnlyList<string>? Reasons = null, double Penalties = 0);
public sealed record WeeklyRain(double Week1, double Week2, double Week3, double Week4);
public sealed record DailyRain(double Day1, double Day2, double Day3, double Day4, double Day5, double Day6, double Day7);
public sealed record CurrentWeather(WeeklyRain Rain30Days, DailyRain Rain07Days, double Temperature, double SoilMoisture);
public sealed record AnalysisResult(Guid Id, string AreaName, FarmerPriority Priority, CurrentWeather CurrentWeather,
    IReadOnlyList<StrategyResult> Strategies);
