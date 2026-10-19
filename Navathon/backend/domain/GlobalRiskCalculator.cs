namespace tpnavathon.Api.Domain;

public class GlobalRiskCalculator
{
    private const int CriticalHighRiskThreshold = 3;

    public AlertLevels Calculate(
        IEnumerable<SensorRiskLevel> sensorRisks)
    {
        var risks = sensorRisks.ToList();

        if (risks.Count == 0)
            throw new ArgumentException(
                "Debe existir al menos un indicador.",
                nameof(sensorRisks));

        // Regla prioritaria: 3 o más indicadores en riesgo alto.
        int highRiskCount = risks.Count(
            risk => risk == SensorRiskLevel.HighRisk);

        if (highRiskCount >= CriticalHighRiskThreshold)
            return AlertLevels.Critical;

        // Promedio de los niveles individuales.
        double average = risks.Average(risk => (int)risk);

        // Clasificación global según el promedio.
        if (average == 0)
            return AlertLevels.Normal;

        if (average < 1)
            return AlertLevels.Low;

        if (average < 2)
            return AlertLevels.Medium;

        return AlertLevels.High;
    }
}
