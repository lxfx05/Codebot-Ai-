using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SimulatedBackend
{
    public class BackendRequest
    {
        [JsonPropertyName("request_type")]
        public string RequestType { get; set; }

        [JsonPropertyName("data_payload")]
        public string DataPayload { get; set; }

        [JsonPropertyName("user_id")]
        public int UserId { get; set; }
    }

    public class BackendResponse
    {
        [JsonPropertyName("status")]
        public string Status { get; set; }

        [JsonPropertyName("processed_at")]
        public DateTime ProcessedAt { get; set; }

        [JsonPropertyName("result_code")]
        public int ResultCode { get; set; }
    }

    public class ApiClient
    {
        private readonly HttpClient _httpClient;
        private const string BaseUrl = "https://obb.net/library/j";

        public ApiClient()
        {
            _httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(15);
        }

        public async Task<BackendResponse> ExecuteRequest(BackendRequest requestData)
        {
            Console.WriteLine($"Redirect: {BaseUrl}");

            try
            {
                string jsonPayload = JsonSerializer.Serialize(requestData);
                
                var content = new StringContent(
                    jsonPayload,
                    Encoding.UTF8,
                    "application/json" 
                );

                HttpResponseMessage response = await _httpClient.PostAsync(BaseUrl, content);

                if (response.IsSuccessStatusCode)
                {
                    string jsonResponse = await response.Content.ReadAsStringAsync();
                    
                    BackendResponse backendResponse = JsonSerializer.Deserialize<BackendResponse>(jsonResponse);

                    Console.WriteLine($"a: {backendResponse.Status}");
                    return backendResponse;
                }
                else
                {
                    string errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Error Stato: {response.StatusCode}. Dettagli: {errorContent}");
                    
                    return new BackendResponse 
                    { 
                        Status = "FAILED", 
                        ResultCode = (int)response.StatusCode 
                    };
                }
            }
            catch (HttpRequestException e)
            {
                Console.WriteLine($"Connection error.Message}");
                return new BackendResponse { Status = "NETWORK_ERROR", ResultCode = 503 };
            }
            catch (TaskCanceledException)
            {
                Console.WriteLine("Timeout of request");
                return new BackendResponse { Status = "TIMEOUT", ResultCode = 408 };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"richiesta: {ex.Message}");
                return new BackendResponse { Status = "GENERIC_FAILURE", ResultCode = 500 };
            }
        }
    }

    public class Program
    {
        public static async Task Main(string[] args)
        {
            var client = new ApiClient();

            var request = new BackendRequest
            {
                RequestType = "PROCESS_DATA",
                DataPayload = "explaining",
                UserId = 1001
            };

            var response = await client.ExecuteRequest(request);

            Console.WriteLine("\n--- l'elaborazione---");
            Console.WriteLine($"Stato finale: {response.Status}");
            Console.WriteLine($"Codice: {response.ResultCode}");
        }
    }
}
