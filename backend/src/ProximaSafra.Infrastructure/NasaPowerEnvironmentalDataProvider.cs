using System.Globalization;
using System.Text.Json;
using ProximaSafra.Application;
using ProximaSafra.Domain;

namespace ProximaSafra.Infrastructure;

public sealed class NasaPowerEnvironmentalDataProvider(HttpClient httpClient) : INasaPowerDataProvider
{
	 private const string Endpoint = "https://power.larc.nasa.gov/api/temporal/daily/point";
	 private static readonly IReadOnlyList<string> Parameters =
	 [
		  "T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR", "RH2M", "ALLSKY_SFC_SW_DWN",
		  "WS2M", "T2MDEW", "PS", "GWETROOT", "GWETTOP", "GWETPROF", "EVPTRNS"
	 ];

	 public async Task<NasaPowerProfile> GetAsync(double latitude, double longitude, CancellationToken ct)
	 {
		  ValidateCoordinates(latitude, longitude);

		  var end = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
		  var start = end.AddDays(-364);
		  var url = $"{Endpoint}?parameters={string.Join(',', Parameters)}&community=AG&longitude={longitude.ToString(CultureInfo.InvariantCulture)}&latitude={latitude.ToString(CultureInfo.InvariantCulture)}&start={start:yyyyMMdd}&end={end:yyyyMMdd}&format=JSON";

		  using var response = await httpClient.GetAsync(url, ct);
		  response.EnsureSuccessStatusCode();
		  await using var content = await response.Content.ReadAsStreamAsync(ct);
		  using var document = await JsonDocument.ParseAsync(content, cancellationToken: ct);

		  if (!document.RootElement.TryGetProperty("properties", out var properties) ||
				  !properties.TryGetProperty("parameter", out var parameterData))
		  {
				  throw new InvalidOperationException("The NASA POWER response does not contain parameter data.\nA resposta do NASA POWER não contém dados de parâmetros.");
		  }

		  var values = new Dictionary<string, double?>();
		  var missing = new List<string>();
		  foreach (var parameter in Parameters)
		  {
				if (!parameterData.TryGetProperty(parameter, out var dailyValues))
				{
					 missing.Add(parameter);
					 values[parameter] = null;
					 continue;
				}

				var validValues = dailyValues.EnumerateObject()
					 .Select(x => x.Value.ValueKind == JsonValueKind.Number ? x.Value.GetDouble() : double.NaN)
					 .Where(x => double.IsFinite(x) && x > -900)
					 .ToArray();

				if (validValues.Length == 0)
				{
					 missing.Add(parameter);
					 values[parameter] = null;
				}
				else
				{
					 values[parameter] = validValues.Average();
				}
		  }

		  var quality = Math.Round((Parameters.Count - missing.Count) / (double)Parameters.Count * 100, 1);
		  return new NasaPowerProfile(
				Required(values, "T2M"),
				Required(values, "T2M_MAX"),
				Required(values, "T2M_MIN"),
				Required(values, "PRECTOTCORR"),
				Required(values, "RH2M"),
				Required(values, "ALLSKY_SFC_SW_DWN"),
				Required(values, "WS2M"),
				Required(values, "T2MDEW"),
				Required(values, "PS"),
				Required(values, "GWETROOT"),
				Required(values, "GWETTOP"),
				Required(values, "GWETPROF"),
				Required(values, "EVPTRNS"),
				quality,
				missing);
	 }

	 private static double Required(IReadOnlyDictionary<string, double?> values, string parameter) =>
		  values.TryGetValue(parameter, out var value) && value.HasValue ? value.Value : 0;

	 private static void ValidateCoordinates(double latitude, double longitude)
	 {
		if (latitude is < -90 or > 90 || longitude is < -180 or > 180)
		{
			  throw new ArgumentOutOfRangeException(nameof(latitude), "Latitude or longitude is outside the valid range.\nLatitude ou longitude está fora do intervalo válido.");
		}
	 }
}
