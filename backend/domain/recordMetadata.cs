using System.Collections.Generic;

namespace tpnavathon.Api.Domain
{
    public class RecordMetadata
    {
        public string environment { get; set; } = "test"; // test u operational
        public string source_type { get; set; } = "simulated"; // real, simulated, mixed
        public bool alert_evaluated { get; set; } = true;
        public bool clock_synced { get; set; } = true;
        
        public Dictionary<string, string> units { get; set; } = new()
        {
            { "temperature", "degC" },
            { "humidity", "%" },
            { "pm2_5", "ug/m3" },
            { "gas_concentration", "ppm" },
            { "pressure", "hPa" }
        };

        public Dictionary<string, string> quality { get; set; } = new();
    }
}