using Microsoft.AspNetCore.Mvc;
using tpnavathon.Api.Domain;
using tpnavathon.Api.Services;

namespace tpnavathon.Api.Controllers
{
    [ApiController]
    [Route("api/v1")]
    public class VolcanicController : ControllerBase
    {
        private readonly IVolcanicService _service;
        private readonly SensorSimulationService _simulation;

        public VolcanicController(IVolcanicService service, SensorSimulationService simulation)
        {
            _service = service;
            _simulation = simulation;
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var status = await _service.GetStatusAsync();
            if (status == null)
            {
                return NotFound(new { message = "No hay registros de estado disponibles." });
            }
            return Ok(VolcanicRecordResponse.From(status));
        }

        [HttpGet("thresholds")]
        public IActionResult GetThresholds() => Ok(SensorRiskEvaluator.GetThresholds());

        [HttpGet("simulation")]
        public IActionResult GetSimulationState() => Ok(new { enabled = _simulation.Enabled });

        [HttpPost("simulation")]
        public IActionResult SetSimulation([FromBody] SimulationRequest request)
        {
            _simulation.SetEnabled(request.Enabled);
            return Ok(new { enabled = _simulation.Enabled });
        }

        public sealed class SimulationRequest { public bool Enabled { get; set; } }

        [HttpGet("records")]
        public async Task<IActionResult> GetRecords([FromQuery] int limit = 100)
        {
            var records = await _service.GetHistoryAsync(limit);
            return Ok(new
            {
                items = records.Select(VolcanicRecordResponse.From),
                next_cursor = (string?)null,
                has_more = false
            });
        }

        [HttpPost("records")]
        public async Task<IActionResult> PostRecord([FromBody] VolcanicRecord record)
        {
            if (record == null || record.group != 2)
            {
                return BadRequest(new { error = "El registro es inválido o no corresponde al grupo 2." });
            }

            var processedRecord = await _service.ProcessAndSaveReadingAsync(record);
            return StatusCode(201, processedRecord);
        }
    }
}
