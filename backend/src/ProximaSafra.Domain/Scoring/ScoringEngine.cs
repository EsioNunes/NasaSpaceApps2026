namespace ProximaSafra.Domain.Scoring;

public interface IScoringEngine
{
    StrategyResult Calculate(RotationCandidate candidate, EnvironmentalProfile environment, FarmerPriority priority,
        bool hasIrrigation = false);
}

public sealed class ScoringEngine : IScoringEngine
{
    public StrategyResult Calculate(RotationCandidate candidate, EnvironmentalProfile environment, FarmerPriority priority,
        bool hasIrrigation = false)
    {
        var profile = ScoringProfile.For(priority);
        var reasons = new List<string>();
        var alerts = new List<string>();
        var penalties = 0d;
        var metadata = candidate.Metadata;

        if (metadata is null)
        {
            reasons.Add("Insufficient agronomic data to assess the rotation.\nDados agronômicos insuficientes para avaliar a rotação.");
        }
        else
        {
            if (metadata.RequiresIrrigation && !hasIrrigation)
            {
                reasons.Add("The strategy depends on irrigation, but the area does not report irrigation.\nA estratégia depende de irrigação, mas a área não possui irrigação informada.");
            }

            if (candidate.Crops.Count > 1 && candidate.Crops.Distinct(StringComparer.OrdinalIgnoreCase).Count() == 1)
            {
                reasons.Add("The strategy repeats the same crop in all cycles.\nA estratégia repete a mesma cultura em todos os ciclos.");
            }

            if (metadata.KnownRisks.Count > 0)
            {
                alerts.AddRange(metadata.KnownRisks);
            }
        }

        var climate = ClimateScore(candidate, environment);
        var water = WaterScore(candidate, environment);
        if (water < 25)
        {
            reasons.Add("Estimated water availability is far below the strategy's demand.\nA disponibilidade hídrica estimada está muito abaixo da demanda da estratégia.");
        }

        if (climate < 25)
        {
            reasons.Add("Available temperature is incompatible with the strategy's crops.\nA temperatura disponível é incompatível com as culturas da estratégia.");
        }

        var confidence = environment.NasaPower is { } nasa
            ? Math.Min(environment.DataQuality, nasa.DataQuality)
            : Math.Min(environment.DataQuality, 50);
        if (confidence < 70)
        {
            alerts.Add("Climate data quality or completeness is limited.\nOs dados climáticos possuem qualidade ou completude limitadas.");
            penalties += 5;
        }

        if (metadata is { BotanicalFamilies.Count: 1 } && candidate.Crops.Count > 1)
        {
            alerts.Add("The rotation uses only one botanical family.\nA rotação utiliza uma única família botânica.");
            penalties += 5;
        }

        if (alerts.Count > 0)
        {
            penalties += Math.Min(alerts.Count, 3) * 2;
        }

        var scores = new Dictionary<string, double>
        {
            ["water"] = water,
            ["climate"] = climate,
            ["erosion"] = Average(candidate.Attributes.GetValueOrDefault("erosion", 50), environment.ErosionExposure),
            ["soil"] = candidate.Attributes.GetValueOrDefault("soil", 50),
            ["diversity"] = candidate.Attributes.GetValueOrDefault("diversity", 50),
            ["cover"] = candidate.Attributes.GetValueOrDefault("cover", 50),
            ["operation"] = candidate.Attributes.GetValueOrDefault("operation", 50),
            ["economic"] = candidate.Attributes.GetValueOrDefault("economic", 50)
        };

        var criteria = scores.Select(x => new CriterionResult(x.Key, Round(x.Value), profile.Weights[x.Key],
            Round(x.Value * profile.Weights[x.Key]), $"Desempenho de {x.Key}: {Round(x.Value)}/100.")).ToArray();
        var final = Round(Math.Max(0, criteria.Sum(x => x.Contribution) - penalties));
        var positives = criteria.OrderByDescending(x => x.Contribution).Take(3).Select(x => x.Explanation).ToArray();
        var risks = criteria.Where(x => x.Score < 50).OrderBy(x => x.Score).Take(3)
            .Select(x => $"Validar {x.Name}: nota {x.Score}/100.").Concat(alerts).Distinct().ToArray();
        var allReasons = reasons.Concat(risks).Distinct().ToArray();
        var eligibility = reasons.Count > 0 ? EligibilityStatus.NotRecommended :
            confidence < 40 ? EligibilityStatus.InsufficientData :
            risks.Length > 0 ? EligibilityStatus.ViableWithCaveats : EligibilityStatus.Viable;

        return new(candidate.Id, candidate.Name, eligibility, final, Round(confidence), criteria, positives, risks,
            allReasons, Round(penalties));
    }

    private static double WaterScore(RotationCandidate candidate, EnvironmentalProfile environment)
    {
        var availability = environment.WaterAvailability;
        var stability = environment.WaterAvailability;
        var demand = candidate.Attributes.GetValueOrDefault("water", 50);
        if (environment.NasaPower is { } nasa)
        {
            var soilWetness = Average(nasa.RootZoneSoilWetness, nasa.ProfileSoilWetness) * 100;
            availability = Average(availability, Clamp(50 + nasa.Precipitation * 4 + soilWetness * 0.4 - nasa.Evapotranspiration * 3));
            stability = Average(stability, soilWetness);
        }

        return Round(0.4 * availability + 0.3 * stability + 0.3 * demand);
    }

    private static double ClimateScore(RotationCandidate candidate, EnvironmentalProfile environment)
    {
        var suitability = environment.ClimateSuitability;
        var thermal = suitability;
        var extreme = suitability;
        var cycle = candidate.Attributes.GetValueOrDefault("climate", 50);
        if (environment.NasaPower is { } nasa)
        {
            thermal = ThermalCompatibility(candidate.Metadata, nasa.Temperature);
            extreme = ThermalCompatibility(candidate.Metadata, nasa.TemperatureMaximum);
        }

        var window = candidate.Attributes.GetValueOrDefault("climate", suitability);
        return Round(0.35 * window + 0.3 * thermal + 0.2 * extreme + 0.15 * cycle);
    }

    private static double ThermalCompatibility(RotationMetadata? metadata, double temperature)
    {
        if (metadata is null)
        {
            return 50;
        }

        if (temperature < metadata.MinimumTemperature || temperature > metadata.MaximumTemperature)
        {
            return 0;
        }

        var distance = Math.Min(temperature - metadata.MinimumTemperature, metadata.MaximumTemperature - temperature);
        var range = metadata.MaximumTemperature - metadata.MinimumTemperature;
        return Clamp(55 + distance / range * 45);
    }

    private static double Average(double a, double b) => (a + b) / 2d;
    private static double Clamp(double value) => Math.Clamp(value, 0, 100);
    private static double Round(double value) => Math.Round(Math.Clamp(value, 0, 100), 1);
}
