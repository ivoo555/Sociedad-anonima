namespace tpnavathon.Api.Domain
{
    public class VolcanicData
    {
        public double? temperature { get; set; }
        public double? humidity { get; set; }
        public double? pm2_5 { get; set; }
        public double? gas_concentration { get; set; }
        public double? pressure { get; set; } // Presión barométrica
    }
}