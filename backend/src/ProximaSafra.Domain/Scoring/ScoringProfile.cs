namespace ProximaSafra.Domain.Scoring;

public sealed record ScoringProfile(IReadOnlyDictionary<string, double> Weights)
{
    public static ScoringProfile For(FarmerPriority priority) => new(priority switch
    {
        FarmerPriority.WaterConservation => W(35, 15, 10, 10, 5, 10, 10, 5),
        FarmerPriority.SoilRecovery => W(10, 10, 15, 30, 15, 15, 5, 0),
        FarmerPriority.ErosionProtection => W(10, 10, 35, 15, 5, 20, 5, 0),
        FarmerPriority.ProductiveUse => W(15, 15, 5, 10, 10, 5, 20, 20),
        _ => W(20, 15, 15, 15, 10, 10, 10, 5)
    });

    private static Dictionary<string, double> W(double water, double climate, double erosion, double soil,
        double diversity, double cover, double operation, double economic) => new()
    {
        ["water"] = water / 100d, ["climate"] = climate / 100d, ["erosion"] = erosion / 100d,
        ["soil"] = soil / 100d, ["diversity"] = diversity / 100d, ["cover"] = cover / 100d,
        ["operation"] = operation / 100d, ["economic"] = economic / 100d
    };
}
