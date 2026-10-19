using System.Collections.Generic;
using System.Threading.Tasks;
using tpnavathon.Api.Domain;

namespace tpnavathon.Api.DAO
{
    public interface IVolcanicDao
    {
        Task<VolcanicRecord?> GetLatestStatusAsync();
        Task<IEnumerable<VolcanicRecord>> GetRecordsAsync(int limit);
        Task SaveRecordAsync(VolcanicRecord record);
    }
}