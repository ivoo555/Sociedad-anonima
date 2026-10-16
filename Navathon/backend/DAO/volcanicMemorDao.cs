using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using tpnavathon.Api.Domain;

namespace tpnavathon.Api.DAO
{
    public class VolcanicMemoryDao : IVolcanicDao
    {
        private readonly List<VolcanicRecord> _storage = new();

        public Task<VolcanicRecord?> GetLatestStatusAsync()
        {
            var latest = _storage.OrderByDescending(r => r.timestamp).FirstOrDefault();
            return Task.FromResult(latest);
        }

        public Task<IEnumerable<VolcanicRecord>> GetRecordsAsync(int limit)
        {
            var records = _storage.OrderByDescending(r => r.timestamp).Take(limit).AsEnumerable();
            return Task.FromResult(records);
        }

        public Task SaveRecordAsync(VolcanicRecord record)
        {
            _storage.Add(record);
            return Task.CompletedTask;
        }
    }
}