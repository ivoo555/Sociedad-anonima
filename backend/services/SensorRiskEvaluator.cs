using tpnavathon.Api.Domain;

namespace tpnavathon.Api.Services;

public class SensorRiskEvaluator
{
    public sealed record RiskThresholdInfo(double Low, double Mid, double High, bool HigherIsRisk);
    private sealed record Thresholds(
        double Low,
        double Mid,
        double High,
        bool HigherIsRisk
    );

    private static readonly Dictionary<string, Thresholds> RiskThresholds = new()
    {
        ["temperature"] = new(35, 45, 60, true),
        ["humidity"] = new(70, 80, 90, true),
        ["pm2_5"] = new(50, 100, 200, true),
        ["gas_concentration"] = new(5, 25, 50, true),
        ["pressure"] = new(1000, 980, 960, false)
    };

    public static IReadOnlyDictionary<string, RiskThresholdInfo> GetThresholds() =>
        RiskThresholds.ToDictionary(
            item => item.Key,
            item => new RiskThresholdInfo(item.Value.Low, item.Value.Mid, item.Value.High, item.Value.HigherIsRisk));

    public Dictionary<string, SensorRiskLevel> EvaluateAll(
        VolcanicData data,
        RecordMetadata metadata)
    {
        var measurements = new Dictionary<string, double?>
        {
            ["temperature"] = data.temperature,
            ["humidity"] = data.humidity,
            ["pm2_5"] = data.pm2_5,
            ["gas_concentration"] = data.gas_concentration,
            ["pressure"] = data.pressure
        };

        metadata.quality.Clear();

        var risks = new Dictionary<string, SensorRiskLevel>();
        var errors = new List<string>();

        foreach (var measurement in measurements)
        {
            string name = measurement.Key;
            double? value = measurement.Value;

            if (!value.HasValue)
            {
                metadata.quality[name] = "missing";
                errors.Add(name);
                continue;
            }

            double numericValue = value.Value;

            if (!double.IsFinite(numericValue) ||
                !IsValidMeasurement(name, numericValue))
            {
                metadata.quality[name] = "invalid";
                errors.Add(name);
                continue;
            }

            metadata.quality[name] = "valid";

            risks[name] = EvaluateValue(
                numericValue,
                RiskThresholds[name]
            );
        }

        // No calculamos un global con sensores faltantes o inválidos.
        if (errors.Count > 0)
        {
            throw new ArgumentException(
                $"No se pueden evaluar todas las mediciones. " +
                $"Revisar: {string.Join(", ", errors)}."
            );
        }

        return risks;
    }

    private static SensorRiskLevel EvaluateValue(
        double value,
        Thresholds thresholds)
    {
        if (thresholds.HigherIsRisk)
        {
            if (value >= thresholds.High) return SensorRiskLevel.HighRisk;
            if (value >= thresholds.Mid) return SensorRiskLevel.MidRisk;
            if (value >= thresholds.Low) return SensorRiskLevel.LowRisk;
        }
        else
        {

            if (value <= thresholds.High) return SensorRiskLevel.HighRisk;
            if (value <= thresholds.Mid) return SensorRiskLevel.MidRisk;
            if (value <= thresholds.Low) return SensorRiskLevel.LowRisk;
        }

        return SensorRiskLevel.Normal;
    }

    private static bool IsValidMeasurement(string name, double value)
    {
        return name switch
        {
            "temperature" => value >= -40 && value <= 85,
            "humidity" => value >= 0 && value <= 100,
            "pm2_5" => value >= 0,
            "gas_concentration" => value >= 0,
            "pressure" => value >= 300 && value <= 1100,
            _ => false
        };
    }
}
