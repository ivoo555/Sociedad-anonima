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

        public VolcanicController(IVolcanicService service)
        {
            _service = service;
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var status = await _service.GetStatusAsync();
            if (status == null)
            {
                return NotFound(new { message = "No hay registros de estado disponibles." });
            }
            return Ok(status);
        }

        [HttpGet("records")]
        public async Task<IActionResult> GetRecords([FromQuery] int limit = 100)
        {
            var records = await _service.GetHistoryAsync(limit);
            return Ok(new
            {
                items = records,
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