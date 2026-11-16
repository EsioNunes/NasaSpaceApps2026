using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using ProximaSafra.Application;
using ProximaSafra.Domain;

namespace ProximaSafra.Infrastructure;

public sealed class OpenMeteoEnvironmentalDataProvider(HttpClient httpClient) : IEnvironmentalDataProvider
{
	 private const string Endpoint = "https://api.open-meteo.com/v1/forecast";
	 private const string DailyParameters = "precipitation_sum,temperature_2m_mean,soil_moisture_0_to_7cm_mean";

	 public async Task<EnvironmentalProfile> GetAsync(double latitude, double longitude, CancellationToken ct)
	 {
		  var url = $"{Endpoint}?latitude={latitude.ToString(CultureInfo.InvariantCulture)}&longitude={longitude.ToString(CultureInfo.InvariantCulture)}&daily={DailyParameters}&past_days=30&forecast_days=0&timezone=UTC";

		using var response = await httpClient.GetAsync(url, ct);
	  response.EnsureSuccessStatusCode();
	  var data = await response.Content.ReadFromJsonAsync<OpenMeteoResponse>(cancellationToken: ct)
		 ?? throw new InvalidOperationException("The Open-Meteo response is empty.\nA resposta do Open-Meteo está vazia.");

	  var daily = data.Daily ?? throw new InvalidOperationException("The Open-Meteo response does not contain daily data.\nA resposta do Open-Meteo não contém dados diários.");
	  var precipitation = GetLast(daily.PrecipitationSum, 30, "precipitation_sum");
		  var lastSevenPrecipitation = precipitation.TakeLast(7).ToArray();
			 var lastTwentyEightPrecipitation = precipitation.TakeLast(28).ToArray();
		  var temperatures = GetLast(daily.TemperatureMean, 30, "temperature_2m_mean");
		  var soilMoisture = GetLast(daily.SoilMoisture, 30, "soil_moisture_0_to_7cm_mean");

		  var weather = new CurrentWeather(
				new WeeklyRain(
								Math.Round(lastTwentyEightPrecipitation.Take(7).Sum(), 1),
							Math.Round(lastTwentyEightPrecipitation.Skip(7).Take(7).Sum(), 1),
							Math.Round(lastTwentyEightPrecipitation.Skip(14).Take(7).Sum(), 1),
					 Math.Round(lastSevenPrecipitation.Sum(), 1)),
				new DailyRain(lastSevenPrecipitation[0], lastSevenPrecipitation[1], lastSevenPrecipitation[2], lastSevenPrecipitation[3], lastSevenPrecipitation[4], lastSevenPrecipitation[5], lastSevenPrecipitation[6]),
				temperatures[^1],
				soilMoisture[^1]);

		  return new EnvironmentalProfile(61, 76, 68, 78, weather);
	 }

	  private static double[] GetLast(IReadOnlyList<double?>? values, int count, string name)
	 {
			 if (values is null || values.Count < count || values.TakeLast(count).Any(value => value is null))
		  {
				throw new InvalidOperationException($"The Open-Meteo response does not contain {count} valid values for {name}.\nA resposta do Open-Meteo não contém {count} valores válidos para {name}.");
		  }

			 return values.TakeLast(count).Select(value => value!.Value).ToArray();
	 }

	 private sealed record OpenMeteoResponse([property: JsonPropertyName("daily")] DailyData? Daily);

	 private sealed record DailyData(
		  [property: JsonPropertyName("precipitation_sum")] List<double?>? PrecipitationSum,
		  [property: JsonPropertyName("temperature_2m_mean")] List<double?>? TemperatureMean,
		  [property: JsonPropertyName("soil_moisture_0_to_7cm_mean")] List<double?>? SoilMoisture);
}
