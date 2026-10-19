using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using tpnavathon.Api.Domain;
using tpnavathon.Api.Services;

namespace tpnavathon.Api.Controllers
{
    [ApiController]
    [Route("api/v1")]
    public class SensoresController : ControllerBase
    {
        private readonly IVolcanicService _service;
        private readonly ILogger<SensoresController> _logger;

        public SensoresController(
            IVolcanicService service,
            ILogger<SensoresController> logger)
        {
            _service = service;
            _logger = logger;
        }

        public class SensorDataDto
        {
            [Required]
            public double? temperature { get; set; }

            [Required]
            public double? humidity { get; set; }

            [Required]
            public double? pressure { get; set; }

            [Required]
            public double? gas_concentration { get; set; }

            [Required]
            public double? pm2_5 { get; set; }
        }

        [HttpPost("sensores")]
        public async Task<IActionResult> RecibirDatos(
            [FromBody] SensorDataDto payload)
        {
            try
            {
                var record = new VolcanicRecord
                {
                    
                    group = 2,

                    data = new VolcanicData
                    {
                        temperature = payload.temperature,
                        humidity = payload.humidity,
                        pressure = payload.pressure,
                        gas_concentration = payload.gas_concentration,
                        pm2_5 = payload.pm2_5
                    },

                    metadata = new RecordMetadata
                    {
                        environment = "operational",
                        source_type = "real"
                    }
                };

                var processedRecord =
                    await _service.ProcessAndSaveReadingAsync(record);

                return StatusCode(201, processedRecord);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    error = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error al procesar las mediciones recibidas del ESP32.");

                return StatusCode(500, new
                {
                    error = "Error al procesar o guardar las mediciones."
                });
            }
        }
    }
}