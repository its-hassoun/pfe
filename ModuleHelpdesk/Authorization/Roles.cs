namespace ModuleHelpDesk.Authorization
{
    public static class Roles
    {
        public const string Admin = "Admin";
        public const string Agent = "Agent";
        public const string Client = "Client";
        public const string SubClient = "SubClient";

        public const string Staff = Admin + "," + Agent;
        public const string AnyAuth = Admin + "," + Agent + "," + Client + "," + SubClient;
    }
}
