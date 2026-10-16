using System.Collections.Generic;
using System.Threading.Tasks;
using tpnavathon.Api.Domain;

namespace tpnavathon.Api.Services
{
    public interface IVolcanicService
    {
        Task<VolcanicRecord?> GetStatusAsync();
        Task<IEnumerable<VolcanicRecord>> GetHistoryAsync(int limit);
        Task<VolcanicRecord> ProcessAndSaveReadingAsync(VolcanicRecord record);
    }
}