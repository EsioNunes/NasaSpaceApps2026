using ProximaSafra.Application;

namespace ProximaSafra.Infrastructure;

public sealed class TemplateChatAssistant(IAnalysisRepository repository) : IChatAssistant
{
    public async Task<ChatResponse> RespondAsync(ChatActionRequest request, CancellationToken ct)
    {
        var analysis = await repository.GetAsync(request.AnalysisId, ct)
            ?? throw new KeyNotFoundException("Analysis not found.\nAnálise não encontrada.");
        var strategy = request.StrategyId is null
            ? analysis.Strategies.First()
            : analysis.Strategies.FirstOrDefault(x => x.StrategyId == request.StrategyId) ?? analysis.Strategies.First();

        var message = request.Action.ToUpperInvariant() switch
        {
            "EXPLAIN_RANKING" => $"{strategy.Name} received {strategy.FinalScore}/100. The main factors were: {string.Join(" ", strategy.PositiveFactors)}\n{strategy.Name} recebeu {strategy.FinalScore}/100. Os principais fatores foram: {string.Join(" ", strategy.PositiveFactors)}",
            "SHOW_RISKS" => strategy.Risks.Count == 0 ? "No critical risks were identified, but local validation is still necessary.\nNenhum risco crítico foi identificado, mas a validação local continua sendo necessária." : string.Join(" ", strategy.Risks),
            "COMPARE_WATER" => DescribeBest(analysis, "water", "water adequacy\nadequação da água"),
            "COMPARE_SOIL" => DescribeBest(analysis, "soil", "soil potential contribution\ncontribuição potencial do solo"),
            _ => "Choose one of the suggested questions to understand the analysis.\nEscolha uma das perguntas sugeridas para entender a análise."
        };

        return new(message,
        [
            new("EXPLAIN_RANKING", "Why did it rank first?\nPor que ficou em primeiro?"),
            new("COMPARE_WATER", "Who uses less water?\nQuem usa menos água?"),
            new("COMPARE_SOIL", "Which helps the soil more?\nQual ajuda mais o solo?"),
            new("SHOW_RISKS", "What are the risks?\nQuais são os riscos?")
        ]);
    }

    private static string DescribeBest(ProximaSafra.Domain.AnalysisResult analysis, string criterion, string label)
    {
        var best = analysis.Strategies.OrderByDescending(x => x.Criteria.First(c => c.Name == criterion).Score).First();
        var score = best.Criteria.First(c => c.Name == criterion).Score;
        return $"{best.Name} showed the best {label}, with a score of {score}/100 in this criterion.\n{best.Name} apresentou a melhor {label}, com nota {score}/100 nesse critério.";
    }
}
