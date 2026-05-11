-- Idempotent migration for InterventionExecutions, TicketHistories, Notifications, UserCredentials.
-- Apply directly with sqlcmd OR regenerate via:
--   dotnet ef migrations add AddNotificationsInterventionsHistoryAuth
--   dotnet ef database update
-- (the latter is recommended if your dev machine has the dotnet-ef tool installed.)

SET NOCOUNT ON;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'InterventionExecutions')
BEGIN
    CREATE TABLE [InterventionExecutions] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [TicketId] INT NULL,
        [InterventionCatalogId] INT NULL,
        [ClientId] NVARCHAR(MAX) NOT NULL,
        [SousClientId] NVARCHAR(MAX) NULL,
        [AssignedAgentId] NVARCHAR(450) NULL,
        [Titre] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(MAX) NULL,
        [Categorie] INT NOT NULL,
        [Priorite] INT NOT NULL DEFAULT 1,
        [Statut] INT NOT NULL DEFAULT 0,
        [ScheduledAt] DATETIME2 NULL,
        [StartedAt] DATETIME2 NULL,
        [CompletedAt] DATETIME2 NULL,
        [Location] NVARCHAR(500) NULL,
        [IsRemote] BIT NOT NULL DEFAULT 0,
        [RapportResolution] NVARCHAR(MAX) NULL,
        [CreatedById] NVARCHAR(450) NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_InterventionExecutions_Tickets FOREIGN KEY ([TicketId]) REFERENCES [Tickets]([Id]) ON DELETE SET NULL,
        CONSTRAINT FK_InterventionExecutions_Interventions FOREIGN KEY ([InterventionCatalogId]) REFERENCES [Interventions]([Id]) ON DELETE SET NULL
    );
    CREATE INDEX [IX_InterventionExecutions_TicketId] ON [InterventionExecutions]([TicketId]);
    CREATE INDEX [IX_InterventionExecutions_InterventionCatalogId] ON [InterventionExecutions]([InterventionCatalogId]);
    CREATE INDEX [IX_InterventionExecutions_AssignedAgentId] ON [InterventionExecutions]([AssignedAgentId]);
    CREATE INDEX [IX_InterventionExecutions_Statut] ON [InterventionExecutions]([Statut]);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TicketHistories')
BEGIN
    CREATE TABLE [TicketHistories] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [TicketId] INT NOT NULL,
        [ActorUserId] NVARCHAR(450) NOT NULL,
        [Action] INT NOT NULL,
        [FromValue] NVARCHAR(200) NULL,
        [ToValue] NVARCHAR(200) NULL,
        [Note] NVARCHAR(1000) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_TicketHistories_Tickets FOREIGN KEY ([TicketId]) REFERENCES [Tickets]([Id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_TicketHistories_TicketId] ON [TicketHistories]([TicketId]);
    CREATE INDEX [IX_TicketHistories_CreatedAt] ON [TicketHistories]([CreatedAt]);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE [Notifications] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [RecipientUserId] NVARCHAR(450) NOT NULL,
        [ActorUserId] NVARCHAR(450) NULL,
        [Type] INT NOT NULL,
        [Title] NVARCHAR(200) NOT NULL,
        [Message] NVARCHAR(1000) NOT NULL,
        [TicketId] INT NULL,
        [InterventionId] INT NULL,
        [Metadata] NVARCHAR(MAX) NULL,
        [IsRead] BIT NOT NULL DEFAULT 0,
        [ReadAt] DATETIME2 NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX [IX_Notifications_Recipient_IsRead_CreatedAt]
        ON [Notifications]([RecipientUserId], [IsRead], [CreatedAt] DESC);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'UserCredentials')
BEGIN
    CREATE TABLE [UserCredentials] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [UserId] NVARCHAR(450) NOT NULL,
        [Email] NVARCHAR(200) NOT NULL,
        [PasswordHash] NVARCHAR(MAX) NOT NULL,
        [Role] NVARCHAR(20) NOT NULL,
        [Kind] INT NOT NULL DEFAULT 0,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE UNIQUE INDEX [UX_UserCredentials_Email] ON [UserCredentials]([Email]);
    CREATE INDEX [IX_UserCredentials_UserId] ON [UserCredentials]([UserId]);
END;
GO

-- ── Demo credentials. Replace before deploying to production.
-- Verified BCrypt (cost 11) hashes for the listed passwords.
--
--   admin@helpdesk.local     / Admin@1234
--   agent@helpdesk.local     / Agent@1234
--   client@helpdesk.local    / Client@1234
--   subclient@helpdesk.local / SubClient@1234
--
-- Kind: 0 = Agent (staff), 1 = Contact (client/subclient)
-- UserId is the principal identity used everywhere in the API (Ticket.ClientId,
-- Ticket.AgentPrincipalId, Ticket.SousClientId, InterventionExecution.AssignedAgentId…).
-- The values below are placeholders; replace them with real synced Agent.Id / Contact.Id
-- values if you want role-scoped queries to find existing data.

DECLARE @hashAdmin     NVARCHAR(200) = N'$2b$11$KnrR1dHOUkC6i8oFGYEvU.ByzaMkVPH.AXckydzOMrY2P3evMEsym';
DECLARE @hashAgent     NVARCHAR(200) = N'$2b$11$BpuQrryF93I1.wPYa7dUJext5ATQQ4Z7AYb1V.kamwCxv80LQiUsC';
DECLARE @hashClient    NVARCHAR(200) = N'$2b$11$fSzQ9b6zBzSaUS2grzz5YuT/mWJuKwngV8UAPhuXlEOcopG.JYGNG';
DECLARE @hashSubClient NVARCHAR(200) = N'$2b$11$g8cZW2Ihc8gOFK.YyEkxduP9F1OUyiNaQWFrjFs/T9NB8ogFLesiq';

-- Admin
IF NOT EXISTS (SELECT 1 FROM [UserCredentials] WHERE [Email] = 'admin@helpdesk.local')
    INSERT INTO [UserCredentials] ([UserId], [Email], [PasswordHash], [Role], [Kind], [IsActive])
    VALUES (N'admin-seed', N'admin@helpdesk.local', @hashAdmin, N'Admin', 0, 1);
ELSE
    UPDATE [UserCredentials]
    SET [PasswordHash] = @hashAdmin,
        [UpdatedAt]    = SYSUTCDATETIME()
    WHERE [Email] = 'admin@helpdesk.local'
      AND [PasswordHash] = '$2a$11$E8w8nIWP4WlMpAYn2VgZF.WBCKHpAQqLqHCSyM4DxX1bgOABaGT9.';

-- Agent
IF NOT EXISTS (SELECT 1 FROM [UserCredentials] WHERE [Email] = 'agent@helpdesk.local')
    INSERT INTO [UserCredentials] ([UserId], [Email], [PasswordHash], [Role], [Kind], [IsActive])
    VALUES (N'demo-agent', N'agent@helpdesk.local', @hashAgent, N'Agent', 0, 1);

-- Client
IF NOT EXISTS (SELECT 1 FROM [UserCredentials] WHERE [Email] = 'client@helpdesk.local')
    INSERT INTO [UserCredentials] ([UserId], [Email], [PasswordHash], [Role], [Kind], [IsActive])
    VALUES (N'demo-client', N'client@helpdesk.local', @hashClient, N'Client', 1, 1);

-- SubClient
IF NOT EXISTS (SELECT 1 FROM [UserCredentials] WHERE [Email] = 'subclient@helpdesk.local')
    INSERT INTO [UserCredentials] ([UserId], [Email], [PasswordHash], [Role], [Kind], [IsActive])
    VALUES (N'demo-subclient', N'subclient@helpdesk.local', @hashSubClient, N'SubClient', 1, 1);
GO
