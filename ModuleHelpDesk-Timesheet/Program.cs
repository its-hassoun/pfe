using MassTransit;
using Microsoft.EntityFrameworkCore;
using ModuleHelpDeskTimesheet.Data;
using ModuleHelpDeskTimesheet.Repositories;

var builder = WebApplication.CreateBuilder(args);

// --- 1. CONFIGURATION DES SERVICES (Avant builder.Build) ---

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configuration du DbContext (Base de données db_timesheet)
var connectionString = builder.Configuration.GetConnectionString("TimesheetConnection");
builder.Services.AddDbContext<TimesheetDbContext>(options =>
    options.UseSqlServer(connectionString));

// Injection de dépendance pour le Repository
builder.Services.AddScoped<ITimesheetRepository, TimesheetRepository>();

// CONFIGURATION MASSTRANSIT (Version 8.2.5)
builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((ctx, cfg) =>
    {
        // Connexion au serveur RabbitMQ commun
        cfg.Host("51.254.133.231", 31672, "/", h =>
        {
            h.Username("admin");
            h.Password("rabbitMQ-dev");
        });

        // Ici, ce module pourra écouter les événements venant du HelpDesk
        cfg.ReceiveEndpoint("timesheet.ticket.events", e =>
        {
            // On y ajoutera les Consommateurs plus tard
        });
    });
});

// --- 2. CONSTRUCTION DE L'APPLICATION ---
var app = builder.Build();

// --- 3. PIPELINE DE MIDDLEWARE ---

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Optionnel : Migration automatique au démarrage (vu qu'on est sur serveur distant)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TimesheetDbContext>();
    // db.Database.Migrate(); // Décommente si tu veux que l'app applique les migrations seule
}

app.UseAuthorization();
app.MapControllers();

// --- 4. RÉSUMÉ LOGS & RUN ---
Console.WriteLine("Démarrage du Module Timesheet sur le serveur distant...");

app.Run();