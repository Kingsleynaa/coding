using System.Text.Json.Serialization;

namespace PMAS_CITI.AzureDevOps.Models
{
    public class AzureDevOpsWiki
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }
        [JsonPropertyName("type")]
        public string Type { get; set; }
        [JsonPropertyName("name")]
        public string Name { get; set; }
    }
}
