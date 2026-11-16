using System.Net;
using System.Text.Json;
using ProximaSafra.Infrastructure;
using Xunit;

namespace ProximaSafra.Tests;

public sealed class OpenMeteoEnvironmentalDataProviderTests
{
	 [Fact]
	 public async Task GetAsync_MapsLastSevenDaysFromOpenMeteoData()
	 {
		  var handler = new StubHandler(CreateResponse());
		  var provider = new OpenMeteoEnvironmentalDataProvider(new HttpClient(handler));

		  var profile = await provider.GetAsync(-18.9186, -48.2772, CancellationToken.None);
		  var weather = profile.CurrentWeather!;

			 Assert.Equal(49, weather.Rain30Days.Week1);
		  Assert.Equal(98, weather.Rain30Days.Week2);
		  Assert.Equal(147, weather.Rain30Days.Week3);
		  Assert.Equal(196.0, weather.Rain30Days.Week4);
		  Assert.Equal(25, weather.Rain07Days.Day1);
		  Assert.Equal(31, weather.Rain07Days.Day7);
		  Assert.Equal(131, weather.Temperature);
		  Assert.Equal(231, weather.SoilMoisture);
		  Assert.Contains("past_days=30", handler.RequestUri!.Query);
		  Assert.Contains("forecast_days=0", handler.RequestUri.Query);
		  Assert.Contains("daily=precipitation_sum,temperature_2m_mean,soil_moisture_0_to_7cm_mean", handler.RequestUri.Query);
		  Assert.Contains("latitude=-18.9186", handler.RequestUri.Query);
		  Assert.Contains("longitude=-48.2772", handler.RequestUri.Query);
	 }

	 private static HttpResponseMessage CreateResponse()
	 {
		  var body = JsonSerializer.Serialize(new
		  {
			daily = new
				{
					  time = Enumerable.Range(1, 31).Select(index => $"2026-01-{index:00}"),
					 precipitation_sum = Enumerable.Range(1, 31).Select(index => (double)index),
					 temperature_2m_mean = Enumerable.Range(1, 31).Select(index => (double)(100 + index)),
					 soil_moisture_0_to_7cm_mean = Enumerable.Range(1, 31).Select(index => (double)(200 + index))
				}
		  });

		  return new HttpResponseMessage(HttpStatusCode.OK)
		  {
				Content = new StringContent(body)
		  };
	 }

	 private sealed class StubHandler(HttpResponseMessage response) : HttpMessageHandler
	 {
		  public Uri? RequestUri { get; private set; }

		  protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
		  {
				RequestUri = request.RequestUri;
				return Task.FromResult(response);
		  }
	 }
}
