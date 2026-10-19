using tpnavathon.Api.DAO;
using tpnavathon.Api.Domain;

namespace tpnavathon.Api.Services
{
    public class VolcanicService : IVolcanicService
    {
        private readonly IVolcanicDao _dao;
        private readonly SensorRiskEvaluator _sensorRiskEvaluator;
        private readonly GlobalRiskCalculator _globalRiskCalculator;

        public VolcanicService(
            IVolcanicDao dao,
            SensorRiskEvaluator sensorRiskEvaluator,
            GlobalRiskCalculator globalRiskCalculator)
        {
            _dao = dao;
            _sensorRiskEvaluator = sensorRiskEvaluator;
            _globalRiskCalculator = globalRiskCalculator;
        }

        public async Task<VolcanicRecord?> GetStatusAsync()
        {
            var record = await _dao.GetLatestStatusAsync();
            if (record is not null)
                EvaluateRecord(record);

            return record;
        }

        public async Task<IEnumerable<VolcanicRecord>> GetHistoryAsync(
            int limit)
        {
            return await _dao.GetRecordsAsync(limit);
        }

        public async Task<VolcanicRecord> ProcessAndSaveReadingAsync(
            VolcanicRecord record)
        {
            EvaluateRecord(record);

            // Solo se persisten las mediciones; los riesgos se recalculan al leer.
            await _dao.SaveRecordAsync(record);

            return record;
        }

        private void EvaluateRecord(VolcanicRecord record)
        {
            record.sensor_risks = _sensorRiskEvaluator.EvaluateAll(
                record.data,
                record.metadata
            );

            record.alert_level = _globalRiskCalculator.Calculate(
                record.sensor_risks.Values
            );

            record.metadata.alert_evaluated = true;
        }
    }
}
