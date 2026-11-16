using ProximaSafra.Domain;
using ProximaSafra.Domain.Scoring;
using Xunit;

namespace ProximaSafra.Tests;

public sealed class ScoringEngineTests
{
    [Fact]
    public void Calculate_ReturnsScoreBetweenZeroAndOneHundred()
    {
        var candidate = new RotationCandidate(Guid.NewGuid(), "Teste", ["soja", "milho"],
            new Dictionary<string, double> { ["water"] = 80, ["climate"] = 80, ["soil"] = 90 });
        var environment = new EnvironmentalProfile(70, 75, 60, 80);
        var result = new ScoringEngine().Calculate(candidate, environment, FarmerPriority.Balanced);
        Assert.InRange(result.FinalScore, 0, 100);
        Assert.Equal(8, result.Criteria.Count);
    }

    [Fact]
    public void ScoringProfiles_SumToOne()
    {
        foreach (var priority in Enum.GetValues<FarmerPriority>())
        {
            Assert.Equal(1, ScoringProfile.For(priority).Weights.Values.Sum(), 3);
        }
    }

    [Fact]
    public void Calculate_WithoutIrrigation_RejectsDependentRotation()
    {
        var candidate = Candidate(requiresIrrigation: true);

        var result = new ScoringEngine().Calculate(candidate, new EnvironmentalProfile(80, 80, 60, 90),
            FarmerPriority.Balanced, hasIrrigation: false);

        Assert.Equal(EligibilityStatus.NotRecommended, result.Eligibility);
        Assert.Contains(result.Reasons!, reason => reason.Contains("irrigacao", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Calculate_LowWater_RejectsRotationAndKeepsReason()
    {
        var candidate = Candidate();
        var environment = new EnvironmentalProfile(5, 80, 60, 90);

        var result = new ScoringEngine().Calculate(candidate, environment, FarmerPriority.Balanced);

        Assert.Equal(EligibilityStatus.NotRecommended, result.Eligibility);
        Assert.Contains(result.Reasons!, reason => reason.Contains("hidrica", StringComparison.OrdinalIgnoreCase));
        Assert.InRange(result.FinalScore, 0, 100);
    }

    private static RotationCandidate Candidate(bool requiresIrrigation = false) => new(
        Guid.NewGuid(), "Soja - Milho", ["soja", "milho"],
        new Dictionary<string, double>
        {
            ["water"] = 80, ["climate"] = 80, ["erosion"] = 70, ["soil"] = 80,
            ["diversity"] = 75, ["cover"] = 80, ["operation"] = 80, ["economic"] = 80
        },
        new RotationMetadata(["Fabaceae", "Poaceae"], requiresIrrigation, [], 220, 320, 10, 38, 900, 10));
}
