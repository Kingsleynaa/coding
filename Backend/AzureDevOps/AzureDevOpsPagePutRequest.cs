using System.Text.Json.Serialization;

namespace PMAS_CITI.AzureDevOps
{
    public class AzureDevOpsPagePutRequest
    {
        [JsonPropertyName("content")]
        public string Content { get; set; }
    }
}
