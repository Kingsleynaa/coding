using System.Text.Json.Serialization;

namespace PMAS_CITI.AzureDevOps
{
    public class AzureDevOpsPagePutResponse
    {
        [JsonPropertyName("remoteUrl")]
        public string Url { get; set; }
    }
}
