using MassTransit;
using Microsoft.EntityFrameworkCore;
using ModuleHelpDesk.Data;
using ModuleHelpDesk.Repositories;

var builder = WebApplication.CreateBuilder(args);

// --- 1. AJOUT DES SERVICES (AVANT le builder.Build) ---

builder.Services.AddControllers(); 
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configuration du DbContext
var connectionString = builder.Configuration.GetConnectionString("HelpDeskConnection");
builder.Services.AddDbContext<HelpDeskDbContext>(options =>
    options.UseSqlServer(connectionString));

// Injection de dépendance
builder.Services.AddScoped<ITicketRepository, TicketRepository>();

// AJOUT DE MASSTRANSIT (Doit être ici !)
builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((ctx, cfg) =>
    {
        cfg.Host("51.254.133.231", 31672, "/", h =>
        {
            h.Username("admin");
            h.Password("rabbitMQ-dev");
        });

        // Configurer les queues à écouter
        cfg.ReceiveEndpoint("nom.evenement", e =>
        {
            // Tes consommateurs iront ici
        });
    });
});

// --- 2. CONSTRUCTION DE L'APPLICATION ---
var app = builder.Build();

// --- 3. CONFIGURATION DU PIPELINE (Middleware) ---

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();
app.UseAuthorization(); 

app.MapControllers(); 

// --- 4. LANCEMENT ---
app.Run();