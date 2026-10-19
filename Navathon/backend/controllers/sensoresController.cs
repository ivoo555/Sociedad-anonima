using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using tpnavathon.Api.Domain;
using tpnavathon.Api.Services;

namespace tpnavathon.Api.Controllers
{
    [ApiController]
    [Route("api/v1")]
    public class SensoresController : ControllerBase
    {
        private readonly IVolcanicService _service;

        public SensoresController(IVolcanicService service)
        {
            _service = service;
        }

        // DTO que recibe exactamente los campos enviados por el ESP32
        public class SensorDataDto
        {
            public double temperature { get; set; }
            public double humidity { get; set; }
            public double pressure { get; set; }
            public double gas_concentration { get; set; }
            public double pm2_5 { get; set; }
        }

        [HttpPost("sensores")]
        public async Task<IActionResult> RecibirDatos([FromBody] SensorDataDto data)
        {
            if (data == null)
            {
                return BadRequest(new { error = "Datos inválidos o nulos recibidos del ESP32." });
            }

            try
            {
                // Mapeamos los datos del ESP32 al modelo VolcanicRecord que maneja el servicio
                var record = new VolcanicRecord
                {
                    group = 2, // Siguiendo la validación de grupo de tu proyecto
                    temperature = data.temperature,
                    humidity = data.humidity,
                    pressure = data.pressure,
                    gas_concentration = data.gas_concentration,
                    pm2_5 = data.pm2_5
                };

                var processedRecord = await _service.ProcessAndSaveReadingAsync(record);
                return StatusCode(201, processedRecord);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new 
                { 
                    error = "Error al procesar y guardar los datos en la base de datos.", 
                    detalle = ex.Message 
                });
            }
        }
    }
}