using Microsoft.EntityFrameworkCore;
using tpintegrador_psr2026.Api.DAO;

var builder = WebApplication.CreateBuilder(args);

// Configuración de la cadena de conexión a MySQL
// Asegúrate de cambiar 'Server=localhost;Database=tpintegrador_db;User=root;Password=;' por tus credenciales reales
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                    ?? "Server=localhost;Port=3306;Database=nodo_volcanico;Uid=root;Pwd=;";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Registrar el DAO
builder.Services.AddScoped<MeasurementDao>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Asegurar que la base de datos y las tablas se creen automáticamente al iniciar la app
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.EnsureCreated();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();

app.Run();