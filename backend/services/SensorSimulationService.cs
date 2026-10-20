using tpnavathon.Api.Domain;

namespace tpnavathon.Api.Services;

public sealed class SensorSimulationService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SensorSimulationService> _logger;
    private readonly object _sync = new();
    private bool _enabled;
    private readonly Random _random = new();
    private readonly double[] _values = { 24.6, 58, 1013.2, 30, 150 };

    public SensorSimulationService(IServiceScopeFactory scopeFactory, ILogger<SensorSimulationService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public bool Enabled { get { lock (_sync) return _enabled; } }
    public void SetEnabled(bool enabled) { lock (_sync) _enabled = enabled; }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(5));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            if (!Enabled) continue;
            var record = new VolcanicRecord
            {
                record_type = RecordTypes.Reading,
                metadata = new RecordMetadata { environment = "test", source_type = "simulated" },
                data = new VolcanicData
                {
                    temperature = Step(0, 0.4, 10, 46),
                    humidity = Step(1, 1.5, 20, 90),
                    pressure = Step(2, 0.5, 990, 1030),
                    pm2_5 = Step(3, 20, 0, 400),
                    gas_concentration = Step(4, 120, 0, 2500)
                }
            };

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<IVolcanicService>();
                await service.ProcessAndSaveReadingAsync(record);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "No se pudo guardar una lectura simulada.");
            }
        }
    }

    private double Step(int index, double step, double min, double max)
    {
        lock (_sync)
        {
            _values[index] = Math.Clamp(_values[index] + (_random.NextDouble() - 0.5) * step, min, max);
            return _values[index];
        }
    }
}
