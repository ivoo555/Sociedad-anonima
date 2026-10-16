using MySqlConnector;
using System.Text.Json;
using System.Text.Json.Serialization;
using tpnavathon.Api.DAO;
using tpnavathon.Api.Services;
using tpnavathon.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    o.JsonSerializerOptions.Converters.Add(
        new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower, allowIntegerValues: false));
    o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
});

// Agregar servicios al contenedor
builder.Services.AddControllers();
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

// Inyección de dependencias (Singleton para que el DAO en memoria persista durante la ejecución)
builder.Services.AddSingleton<IVolcanicDao, VolcanicMemoryDao>();
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

try
{
    await using var scope = app.Services.CreateAsyncScope();

    var factory = scope.ServiceProvider
        .GetRequiredService<MySqlConnectionFactory>();

    await using var connection = factory.CreateConnection();

    await connection.OpenAsync();

    await using var command = new MySqlCommand(
        "SELECT * FROM registros_sensores",
        connection
    );

    var result = await command.ExecuteScalarAsync();

    Console.WriteLine(
        $"Conexión exitosa con FreeDB. Resultado: {result}"
    );
}
catch (Exception ex)
{
    Console.WriteLine($"Error de conexión: {ex.Message}");
}

app.Run();