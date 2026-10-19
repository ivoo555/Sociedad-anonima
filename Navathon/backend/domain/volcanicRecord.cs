using System;

namespace tpnavathon.Api.Domain
{
    public static class RecordTypes
    {
        public const string Reading = "reading";
        public const string State = "state";
        public const string Event = "event";
        public const string Alert = "alert";
        public const string Confirmation = "confirmation";
    }

    public static class RecordStatuses
    {
        public const string Active = "active";
        public const string Offline = "offline";
        public const string Error = "error";
    }

    public enum AlertLevels
    {
        Normal = 0,
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4
    }

    public enum SensorRiskLevel
    {
        Normal = 0,
        LowRisk = 1,
        MidRisk = 2,
        HighRisk = 3
    }

    public class VolcanicRecord
    {
        public string schema_version { get; set; } = "1.0.0";
        public string record_id { get; set; } = Guid.NewGuid().ToString();
        public string record_type { get; set; } = RecordTypes.Reading;
        public string node_id { get; set; } = "volcanic_node_01";
        public int group { get; set; } = 2;
        public string subsystem { get; set; } = "Nodo volcánico y calidad ambiental";
        public string timestamp { get; set; } = DateTime.UtcNow.ToString("o");
        public string status { get; set; } = RecordStatuses.Active;
        public AlertLevels alert_level { get; set; } = AlertLevels.Normal;

        public VolcanicData data { get; set; } = new();
        public RecordMetadata metadata { get; set; } = new();
    }
}