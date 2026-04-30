using Microsoft.EntityFrameworkCore;
using ModuleHelpDeskTimesheet.Models;

namespace ModuleHelpDeskTimesheet.Data
{
    public class TimesheetDbContext : DbContext
    {
        public TimesheetDbContext(DbContextOptions<TimesheetDbContext> options)
            : base(options) { }

        public DbSet<TimesheetEntry> TimesheetEntries { get; set; }
        public DbSet<Calendrier> CalendarEvents { get; set; } // Ou ton modèle Calendrier
    }
}