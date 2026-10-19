
using System.Text.Json;
using System.Text.Json.Serialization;
using MySqlConnector;
using tpnavathon.Api.Data;
using tpnavathon.Api.Domain;

namespace tpnavathon.Api.DAO
{
    public class VolcanicDBDao : IVolcanicDao
    {
        private readonly MySqlConnectionFactory _connectionFactory;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public VolcanicDBDao(MySqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<VolcanicRecord?> GetLatestStatusAsync()
        {
            const string sql = """
                SELECT mediciones
                FROM registros_sensores
                ORDER BY JSON_UNQUOTE(
                    JSON_EXTRACT(mediciones, '$.fecha')
                ) DESC
                LIMIT 1;
                """;

            await using var connection =
                _connectionFactory.CreateConnection();

            await connection.OpenAsync();

            await using var command = new MySqlCommand(sql, connection);

            var result = await command.ExecuteScalarAsync();

            if (result is null || result == DBNull.Value)
                return null;

            return ConvertToRecord(result.ToString()!);
        }

        public async Task<IEnumerable<VolcanicRecord>> GetRecordsAsync(
            int limit)
        {
            if (limit <= 0)
                return Enumerable.Empty<VolcanicRecord>();

            const string sql = """
                SELECT mediciones
                FROM registros_sensores
                ORDER BY JSON_UNQUOTE(
                    JSON_EXTRACT(mediciones, '$.fecha')
                ) DESC
                LIMIT @limit;
                """;

            var records = new List<VolcanicRecord>();

            await using var connection =
                _connectionFactory.CreateConnection();

            await connection.OpenAsync();

            await using var command = new MySqlCommand(sql, connection);
            command.Parameters.AddWithValue("@limit", limit);

            await using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                string json = reader.GetString(0);
                records.Add(ConvertToRecord(json));
            }

            return records;
        }

        public async Task SaveRecordAsync(VolcanicRecord record)
        {
            var measurements = new SensorMeasurements
            {
                fecha = record.timestamp,
                gases = record.data.gas_concentration ?? 0,
                humedad = record.data.humidity ?? 0,
                presion = record.data.pressure ?? 0,
                temperatura = record.data.temperature ?? 0,
                polvoPorMetroCubico = record.data.pm2_5 ?? 0
            };

            string json = JsonSerializer.Serialize(
                measurements,
                JsonOptions
            );

            const string sql = """
                INSERT INTO registros_sensores (mediciones)
                VALUES (@mediciones);
                """;

            await using var connection =
                _connectionFactory.CreateConnection();

            await connection.OpenAsync();

            await using var command = new MySqlCommand(sql, connection);
            command.Parameters.AddWithValue("@mediciones", json);

            await command.ExecuteNonQueryAsync();
        }

        private static VolcanicRecord ConvertToRecord(string json)
        {
            var measurements =
                JsonSerializer.Deserialize<SensorMeasurements>(
                    json,
                    JsonOptions
                ) ?? throw new InvalidOperationException(
                    "No se pudieron deserializar las mediciones."
                );

            return new VolcanicRecord
            {
                timestamp = measurements.fecha,
                data = new VolcanicData
                {
                    gas_concentration = measurements.gases,
                    humidity = measurements.humedad,
                    pressure = measurements.presion,
                    temperature = measurements.temperatura,
                    pm2_5 = measurements.polvoPorMetroCubico
                }
            };
        }

        private sealed class SensorMeasurements
        {
            public string fecha { get; set; } = "";

            public double gases { get; set; }

            public double humedad { get; set; }

            public double presion { get; set; }

            public double temperatura { get; set; }

            public double polvoPorMetroCubico { get; set; }
        }
    }
}
