using System.Text.Json.Serialization;

namespace tpintegrador_psr2026.Api.Domain
{
    public class MeasurementRecord
    {
        [JsonPropertyName("schema_version")]
        public string SchemaVersion { get; set; } = "1.0.0";

        [JsonPropertyName("record_id")]
        public string RecordId { get; set; } = Guid.NewGuid().ToString();

        [JsonPropertyName("record_type")]
        public string RecordType { get; set; } = "reading";

        [JsonPropertyName("node_id")]
        public string NodeId { get; set; } = "volcanic_node_01";

        [JsonPropertyName("group")]
        public int Group { get; set; } = 2;

        [JsonPropertyName("subsystem")]
        public string Subsystem { get; set; } = "Nodo volcánico y calidad ambiental";

        [JsonPropertyName("timestamp")]
        public string Timestamp { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

        [JsonPropertyName("status")]
        public string Status { get; set; } = "active";

        [JsonPropertyName("alert_level")]
        public string AlertLevel { get; set; } = "normal";

        [JsonPropertyName("data")]
        public VolcanicData Data { get; set; } = new();

        [JsonPropertyName("metadata")]
        public Metadata Metadata { get; set; } = new();
    }

    public class VolcanicData
    {
        [JsonPropertyName("temperature")]
        public double? Temperature { get; set; }

        [JsonPropertyName("humidity")]
        public double? Humidity { get; set; }

        [JsonPropertyName("pm2_5")]
        public double? Pm2_5 { get; set; }

        [JsonPropertyName("gas_concentration")]
        public double? So2Concentration { get; set; }


        [JsonPropertyName("barometric_pressure")]
        public double? BarometricPressure { get; set; }
    }

    public class Metadata
    {
        [JsonPropertyName("environment")]
        public string Environment { get; set; } = "operational";

        [JsonPropertyName("source_type")]
        public string SourceType { get; set; } = "real";

        [JsonPropertyName("alert_evaluated")]
        public bool AlertEvaluated { get; set; } = true;

        [JsonPropertyName("clock_synced")]
        public bool ClockSynced { get; set; } = true;

        [JsonPropertyName("units")]
        public Dictionary<string, string> Units { get; set; } = new()
        {
            { "temperature", "degC" },
            { "humidity", "%" },
            { "pm2_5", "ug/m3" },
            { "gas_concentration", "ppm" },
            { "barometric_pressure", "hPa" }
        };

        [JsonPropertyName("quality")]
        public Dictionary<string, string> Quality { get; set; } = new()
        {
            { "temperature", "valid" },
            { "humidity", "valid" },
            { "pm2_5", "valid" },
            { "gas_concentration", "valid" },
            { "barometric_pressure", "valid" }
        };
    }
}