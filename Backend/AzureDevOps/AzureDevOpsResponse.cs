using System.Text.Json.Serialization;

namespace PMAS_CITI.AzureDevOps
{
    public class AzureDevOpsListResponse<T>
    {
        [JsonPropertyName("count")]
        public int Count { get; set; }
        [JsonPropertyName("value")]
        public List<T> Value { get; set; }
    }
}
