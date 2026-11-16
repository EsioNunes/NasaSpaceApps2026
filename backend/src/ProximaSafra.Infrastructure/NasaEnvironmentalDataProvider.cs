using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using ProximaSafra.Application;
using ProximaSafra.Domain;

namespace ProximaSafra.Infrastructure;

public sealed class NasaEnvironmentalDataProvider(HttpClient httpClient) : IEnvironmentalDataProvider
{
	 private const string Endpoint = "https://power.larc.nasa.gov/api/temporal/daily/point";
	 private const string Parameters = "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN,WS2M,T2MDEW,PS,GWETROOT,GWETTOP,GWETPROF,ALLSKY_SFC_PAR_TOT,T2MWET,EVPTRNS";

	 public async Task<EnvironmentalProfile> GetAsync(double latitude, double longitude, CancellationToken ct)
	 {
		  var end = DateTime.Today;
		  var start = end.AddDays(-30);
		  var url = $"{Endpoint}?parameters={Parameters}&start={start:yyyyMMdd}&end={end:yyyyMMdd}&latitude={latitude.ToString(CultureInfo.InvariantCulture)}&longitude={longitude.ToString(CultureInfo.InvariantCulture)}&community=ag";

		  using var response = await httpClient.GetAsync(url, ct);
		  response.EnsureSuccessStatusCode();
		  var data = await response.Content.ReadFromJsonAsync<NasaResponse>(cancellationToken: ct)
				?? throw new InvalidOperationException("The NASA response is empty.\nA resposta da NASA está vazia.");

		  var parameters = data.Properties?.Parameter
				?? throw new InvalidOperationException("The NASA response does not contain properties.parameter.\nA resposta da NASA não contém properties.parameter.");
		  var temperature = GetSeries(parameters, "T2M");
		  var rain = GetSeries(parameters, "PRECTOTCORR");
		  var soilMoisture = GetSeries(parameters, "GWETTOP");
		  var orderedRain = OrderedValues(rain);

		  if (orderedRain.Count < 28)
				throw new InvalidOperationException("The NASA response does not contain 28 days of precipitation data.\nA resposta da NASA não contém 28 dias de dados de precipitação.");

		  var first28 = orderedRain.Take(28).Select(x => x.Value).ToArray();
		  var last7 = orderedRain.TakeLast(7).Select(x => x.Value).ToArray();
		  var latestDate = orderedRain[^1].Key;

		  var weather = new CurrentWeather(
				new WeeklyRain(
					 first28.Take(7).Sum(),
					 first28.Skip(7).Take(7).Sum(),
					 first28.Skip(14).Take(7).Sum(),
					 first28.Skip(21).Take(7).Sum()),
				new DailyRain(last7[0], last7[1], last7[2], last7[3], last7[4], last7[5], last7[6]),
				GetValue(temperature, latestDate, "T2M"),
				GetValue(soilMoisture, latestDate, "GWETTOP"));

		  return new EnvironmentalProfile(61, 76, 68, 78, weather);
	 }

	  private static IReadOnlyDictionary<string, double> GetSeries(
		  IReadOnlyDictionary<string, Dictionary<string, double>> parameters, string name) =>
		  parameters.TryGetValue(name, out var values) && values.Count > 0
				? values
				: throw new InvalidOperationException($"A resposta da NASA nao contem o parametro {name}.");

	 private static IReadOnlyList<KeyValuePair<string, double>> OrderedValues(IReadOnlyDictionary<string, double> values) =>
		  values.OrderBy(x => x.Key, StringComparer.Ordinal).ToArray();

	 private static double GetValue(IReadOnlyDictionary<string, double> values, string date, string name) =>
		  values.TryGetValue(date, out var value)
				? value
				: throw new InvalidOperationException($"The NASA response does not contain {name} for {date}.\nA resposta da NASA não contém {name} para {date}.");

			private sealed record NasaResponse([property: JsonPropertyName("properties")] NasaProperties? Properties);
			private sealed record NasaProperties([property: JsonPropertyName("parameter")] Dictionary<string, Dictionary<string, double>> Parameter);
	  } 

	  // This file follows the bilingual error pattern used across the project.
