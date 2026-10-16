using System;
using System.Collections.Generic;

namespace tpnavathon.Api.Domain
{
    public class VolcanicRecord
    {
        public string schema_version { get; set; } = "1.0.0";
        public string record_id { get; set; } = Guid.NewGuid().ToString();
        public string record_type { get; set; } = "reading"; // reading, state, event, alert, confirmation
        public string node_id { get; set; } = "volcanic_node_01";
        public int group { get; set; } = 2;
        public string subsystem { get; set; } = "Nodo volcánico y calidad ambiental";
        public string timestamp { get; set; } = DateTime.UtcNow.ToString("o");
        public string status { get; set; } = "active"; // active, offline, error
        public string alert_level { get; set; } = "normal"; // normal, low, medium, high, critical
        
        public VolcanicData data { get; set; } = new();
        public RecordMetadata metadata { get; set; } = new();
    }
}