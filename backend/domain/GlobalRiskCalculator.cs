using System;
using System.Linq;
using System.Collections.Generic;

namespace tpnavathon.Api.Domain;

public class GlobalRiskCalculator
{
    private const int ExpectedSensorCount = 5;
    private const int CriticalHighRiskThreshold = 3;

    public AlertLevels Calculate(
        IEnumerable<SensorRiskLevel> sensorRisks)
    {
        var risks = sensorRisks.ToList();

        if (risks.Count != ExpectedSensorCount)
        {
            throw new ArgumentException(
                $"Se esperaban {ExpectedSensorCount} riesgos individuales.",
                nameof(sensorRisks)
            );
        }

        int highRiskCount = risks.Count(
            risk => risk == SensorRiskLevel.HighRisk
        );

        if (risks.Any(risk => risk == SensorRiskLevel.CriticalRisk) ||
            highRiskCount >= CriticalHighRiskThreshold)
            return AlertLevels.Critical;

        double average = risks.Average(risk => (int)risk);

        if (average == 0)
            return AlertLevels.Normal;

        if (average < 1)
            return AlertLevels.Low;

        if (average < 2)
            return AlertLevels.Medium;

        return AlertLevels.High;
    }
}
