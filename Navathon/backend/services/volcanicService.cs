using System.Threading.Tasks;
using tpnavathon.Api.DAO;
using tpnavathon.Api.Domain;

namespace tpnavathon.Api.Services
{
    public class VolcanicService : IVolcanicService
    {
        private readonly IVolcanicDao _dao;

        public VolcanicService(IVolcanicDao dao)
        {
            _dao = dao;
        }

        public async Task<VolcanicRecord?> GetStatusAsync()
        {
            return await _dao.GetLatestStatusAsync();
        }

        public async Task<IEnumerable<VolcanicRecord>> GetHistoryAsync(int limit)
        {
            return await _dao.GetRecordsAsync(limit);
        }

        public async Task<VolcanicRecord> ProcessAndSaveReadingAsync(VolcanicRecord record)
        {
            // Ejecutamos la verificación de parámetros y asignamos el alert_level correspondiente
            record.alert_level = EvaluateParameters(record.data, record.metadata);
            
            await _dao.SaveRecordAsync(record);
            return record;
        }

        private AlertLevels EvaluateParameters(VolcanicData data, RecordMetadata metadata)
        {
            metadata.quality.Clear();
            AlertLevels generalLevel = AlertLevels.Normal;

            // Evaluamos cada variable de nuestro nodo volcánico
            EvaluateVariable("temperature", data.temperature, -10, 45, metadata, ref generalLevel, AlertLevels.High);
            EvaluateVariable("humidity", data.humidity, 0, 100, metadata, ref generalLevel, AlertLevels.Low);
            EvaluateVariable("pm2_5", data.pm2_5, 0, 35, metadata, ref generalLevel, AlertLevels.Medium);
            EvaluateVariable("gas_concentration", data.gas_concentration, 0, 10, metadata, ref generalLevel, AlertLevels.Normal);
            EvaluateVariable("pressure", data.pressure, 800, 1100, metadata, ref generalLevel, AlertLevels.Medium);

            metadata.alert_evaluated = true;
            return generalLevel;
        }

        private void EvaluateVariable(string name, double? value, double minNormal, double maxNormal, RecordMetadata metadata, ref AlertLevels currentAlertLevel, AlertLevels severityIfExceeded)
        {
            if (!value.HasValue)
            {
                metadata.quality[name] = "missing";
                return;
            }

            // Validamos rangos lógicos del sensor
            if (value < (minNormal - 20) || value > (maxNormal * 2))
            {
                metadata.quality[name] = "invalid";
            }
            else
            {
                metadata.quality[name] = "valid";
                if (value > maxNormal)
                {
                    // Si supera el umbral normal, elevamos el nivel de alerta
                    currentAlertLevel = severityIfExceeded;
                }
            }
        }
    }
}