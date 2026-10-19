using MySqlConnector;
using System.Text.Json;
using System.Text.Json.Serialization;
using tpnavathon.Api.DAO;
using tpnavathon.Api.Services;
using tpnavathon.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Configuración de puerto dinámico para la nube (Render / Railway)
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://localhost*:{5001}");

builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    o.JsonSerializerOptions.Converters.Add(
        new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower, allowIntegerValues: false));
    o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
});

// Agregar servicios al contenedor
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS: permitir que cualquier página web consulte la API (solo para desarrollo)
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirTodo", policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// Inyección de dependencias
builder.Services.AddSingleton<IVolcanicDao, VolcanicDBDao>();
builder.Services.AddScoped<IVolcanicService, VolcanicService>();
builder.Services.AddSingleton<MySqlConnectionFactory>();

var app = builder.Build();

// Configurar el pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("PermitirTodo");   // antes de UseAuthorization
app.UseAuthorization();

app.MapControllers();

// Conexión a base de datos
try
{
    await using var scope = app.Services.CreateAsyncScope();
    var factory = scope.ServiceProvider.GetRequiredService<MySqlConnectionFactory>();

    await using var connection = factory.CreateConnection();
    await connection.OpenAsync();

    Console.WriteLine("Conexión exitosa con la BBDD");
}
catch (Exception ex)
{
    Console.WriteLine($"Error de conexión: {ex.Message}");
}

app.Run();
