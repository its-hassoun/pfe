# Module Helpdesk

Backend ASP.NET Core 8 pour le module Helpdesk de l'ERP ITANIS.

## Stack

- ASP.NET Core 8 Web API
- Entity Framework Core 8 (SQL Server)
- MassTransit + RabbitMQ (synchronisation inter-modules : Agents, Companies, Contacts)
- SignalR (notifications temps réel)
- JWT Bearer (authentification)
- BCrypt.Net (hash de mots de passe)

## Endpoints principaux

Préfixe : `/api/helpdesk`

### Authentification
- `POST /auth/login` — `{ email, password }` → `{ token, user, expiresAt }`
- `POST /auth/register` — `{ email, password, role, userId? }`
- `GET /auth/me` — utilisateur courant
- `POST /auth/logout`

### Tickets
- `GET /tickets` (rôle scopé)
- `GET /tickets/{id}`
- `POST /tickets`
- `PUT /tickets/{id}` (Admin/Agent)
- `PATCH /tickets/{id}/status` (rôle assigné)
- `PUT /tickets/{id}/transfer` (Admin/Agent)
- `PATCH /tickets/{id}/assign` (Admin/Agent)
- `PATCH /tickets/{id}/priority` (Admin/Agent)
- `GET /tickets/{id}/comments` / `POST /tickets/{id}/comments`
- `GET /tickets/{id}/history`
- `DELETE /tickets/{id}` (Admin)

### Interventions
Le catalogue d'intervention reste à `/api/helpdesk/interventions` (lecture ouverte, mutations Staff/Admin).

Les **exécutions d'intervention** (entité métier avec statut, agent assigné, planification, rapport) sont à `/api/helpdesk/intervention-executions` :
- `GET /intervention-executions?status=&agent=&client=&search=` (scopé par rôle)
- `GET /intervention-executions/{id}`
- `POST /intervention-executions` (Staff)
- `PUT /intervention-executions/{id}` (Staff)
- `PATCH /intervention-executions/{id}/status` (Staff)
- `PATCH /intervention-executions/{id}/assign` (Staff)
- `POST /intervention-executions/{id}/report` (Staff)
- `DELETE /intervention-executions/{id}` (Admin)

### Notifications
- `GET /notifications?unreadOnly=&take=&skip=`
- `GET /notifications/unread-count`
- `PATCH /notifications/{id}/read`
- `PATCH /notifications/read-all`
- `DELETE /notifications/{id}`

### Dashboard
- `GET /dashboard/stats`
- `GET /dashboard/recent-tickets`
- `GET /dashboard/recent-interventions`
- `GET /dashboard/activity`

### Agents
- `GET /agents` (synchro RH)
- `GET /agents/{id}`
- `GET /agents/{id}/stats`

### Clients
- `GET /clients` (synchro CRM)
- `GET /clients/{id}` → `{ company, contacts }`
- `GET /clients/{id}/contacts`
- `GET /clients/{id}/tickets`

### SignalR Hub
- `/hubs/notifications` — authentifié par JWT (`?access_token=...` ou header).
- Évènements émis : `notification:new`, `notification:read`, `notification:read_all`.
- Chaque utilisateur est ajouté au groupe `user:{userId}` à la connexion.

## Lancer le backend

### Prérequis
- .NET 8 SDK
- SQL Server accessible (cf. `appsettings.json`)
- RabbitMQ accessible (cf. `Program.cs`)

### Migrations BDD

Deux options :

**Option A — EF Tools** (recommandé en dev)
```bash
cd ModuleHelpdesk
dotnet ef migrations add AddNotificationsInterventionsHistoryAuth
dotnet ef database update
```

**Option B — Script SQL direct** (production / si dotnet-ef indisponible)
Appliquer `Migrations/20260511120000_AddNotificationsInterventionsHistoryAuth.sql`
via `sqlcmd` ou tout client SQL. Le script est idempotent.

```bash
sqlcmd -S "51.254.133.231,31433" -U sa -P "SqlServer2022" -d db_helpdesk \
       -i Migrations/20260511120000_AddNotificationsInterventionsHistoryAuth.sql
```

Le script seed un compte admin par défaut :
- Email : `admin@helpdesk.local`
- Password : `Admin@1234`

### Run

```bash
cd ModuleHelpdesk
dotnet restore
dotnet run
```

Le service écoute sur `http://localhost:5006` (Docker) ou `https://localhost:7xxx` (local).

Swagger UI : `http://localhost:5006/swagger`

### Configuration sensible

Mettre à jour `appsettings.json` (ou utiliser des variables d'environnement / user-secrets) :

- `Jwt:Secret` — remplacer absolument la valeur par défaut.
- `ConnectionStrings:HelpDeskConnection`
- `Cors:Origins`

## Plan de tests manuels

1. **Login**
   - `POST /api/helpdesk/auth/login` avec `admin@helpdesk.local` / `Admin@1234`.
   - Récupérer le token, le coller dans Swagger via "Authorize".

2. **Transfert de ticket → notification temps réel**
   - Connecter deux navigateurs avec deux agents.
   - Agent A : aller sur un ticket pending, cliquer Transférer → Agent B.
   - Agent B : reçoit immédiatement une notification `TicketTransferred` (bell badge + toast).

3. **Clôture de ticket → notification client**
   - Agent : `PATCH /tickets/{id}/status` avec body `5` (Clos).
   - Client propriétaire du ticket : reçoit `TicketCompleted`.

4. **Création d'une intervention**
   - `POST /intervention-executions` (Staff) avec un `assignedAgentId`.
   - L'agent assigné reçoit `InterventionAssigned`.

5. **Clôture d'une intervention avec rapport**
   - `POST /intervention-executions/{id}/report` body `{ "report": "Compte-rendu..." }`.
   - Client lié reçoit `InterventionCompleted`.

6. **Comment ticket**
   - `POST /tickets/{id}/comments` body `{ "content": "..." }`.
   - Tous les autres participants (agent, client, collaborateurs) reçoivent `TicketCommentAdded`.

## Modèle de permissions

| Rôle      | Tickets               | Interventions            | Agents/Clients          | Notifs |
|-----------|-----------------------|--------------------------|-------------------------|--------|
| Admin     | tout                  | tout                     | lecture                 | siennes|
| Agent     | assignés + collabs    | assignées à lui          | lecture                 | siennes|
| Client    | `ClientId == self`    | liés à ses tickets       | —                       | siennes|
| SubClient | `SousClientId == self`| liés à ses tickets       | —                       | siennes|
