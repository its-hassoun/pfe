# ERP-Frontend

Frontend React 19 + Vite + TypeScript + TailwindCSS pour l'ERP ITANIS (modules Helpdesk &
Interventions, base pour Timesheets).

## Stack

- **Build** : Vite 7 + TypeScript 5.9
- **UI** : React 19, TailwindCSS 3, lucide-react, MUI (timesheet)
- **Routing** : react-router-dom 7
- **HTTP** : axios (avec intercepteur JWT, redirection 401 → `/login`)
- **Realtime** : @microsoft/signalr 8
- **State** : @tanstack/react-query installé (à brancher progressivement)
- **Forms** : react-hook-form + yup

## Run

```bash
cd ERP-Frontend
npm install        # installe @microsoft/signalr ajouté dans cette release
npm run dev        # http://localhost:5173 (HMR via :3000)
```

Le proxy Vite renvoie `/api/helpdesk`, `/api/timesheet`, `/hubs/*` vers le backend
(`host.docker.internal:5006` par défaut).

## Configuration

Copier `.env.example` → `.env.local` si vous voulez surcharger :

```
VITE_API_URL=/api/helpdesk
VITE_HUB_URL=/hubs/notifications
```

## Comptes de test

Après application du seed SQL côté backend :

| Rôle  | Email                  | Mot de passe |
|-------|------------------------|--------------|
| Admin | admin@helpdesk.local   | Admin@1234   |

Créer d'autres comptes via `POST /auth/register` ou via la page d'inscription.

## Routes principales

- `/login` — page d'authentification
- `/dashboard` — tableau de bord (Admin/Agent)
- `/tickets`, `/my-tickets`, `/tickets/:id`, `/create-ticket`
- `/interventions`, `/interventions/:id`
- `/notifications` — page complète des notifications
- `/agents`, `/agents/:id` — Admin
- `/clients`, `/clients/:id` — Admin
- `/knowledge`
- `/company`, `/my-dashboard` — Client / SubClient

## Architecture

- `src/contexts/` — `AuthContext`, `NotificationContext` (gère SignalR)
- `src/Services/api.ts` — clients axios + intercepteurs JWT
- `src/Services/helpdesk/*` — wrappers d'endpoints
- `src/Services/realtime/notificationHub.ts` — wrapper SignalR
- `src/components/notifications/` — Bell + Toast
- `src/components/auth/RequireAuth.tsx` — guard rôle
- `src/Pages/Helpdesk/Intervention/` — module Intervention complet (List, Detail, Create, Report)

## Plan de tests manuels

1. **Login** — http://localhost:5173/login → admin@helpdesk.local / Admin@1234.
2. **Bell** — créer un ticket via Swagger comme un autre user, transférer → le badge bell de
   l'utilisateur cible doit s'incrémenter en temps réel + toast top-right.
3. **Création d'intervention** — `/interventions` → "Nouvelle intervention" → l'agent assigné
   reçoit `InterventionAssigned`.
4. **Clôture intervention** — bouton "Clôturer avec rapport" → notification client.
5. **Pas de mock** — `src/data/mockData.ts` a été supprimé, toute donnée vient de l'API.

## Notes

- Le module Timesheet conserve sa logique locale en l'absence d'API dédiée intégrée.
- Le module Interventions du **catalogue** historique (`/api/helpdesk/interventions`) reste,
  les **exécutions** d'intervention sont à `/api/helpdesk/intervention-executions`.
