using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using tpintegrador_psr2026.Api.Domain;

namespace tpintegrador_psr2026.Api.DAO
{
    public class AppDbContext : DbContext
    {
        public DbSet<MeasurementRecord> Records { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<MeasurementRecord>(entity =>
            {
                entity.HasKey(e => e.RecordId);

                // Mapeo de la propiedad 'Data' a JSON (almacenado como texto en MySQL)
                entity.Property(e => e.Data)
                    .HasColumnType("json")
                    .HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                        v => JsonSerializer.Deserialize<VolcanicData>(v, (JsonSerializerOptions)null) ?? new VolcanicData()
                    );

                // Mapeo de la propiedad 'Metadata' a JSON
                entity.Property(e => e.Metadata)
                    .HasColumnType("json")
                    .HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                        v => JsonSerializer.Deserialize<Metadata>(v, (JsonSerializerOptions)null) ?? new Metadata()
                    );
            });
        }
    }
}