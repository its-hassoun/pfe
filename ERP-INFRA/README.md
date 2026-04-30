ERP-INFRA

Ce repository permet d’orchestrer l’infrastructure du projet ERP, notamment :

    - la base de données Microsoft SQL Server
    - les microservices
    - le frontend

1️⃣ Prérequis

Avant de commencer, assurez-vous d’avoir installé :

    - Docker Desktop

2️⃣ Cloner les repositories

Dans votre workspace local, vous devez cloner trois repositories :

   - le repository ERP-INFRA
   - le repository de votre microservice
   - le repository du frontend

Structure recommandée :

workspace/
│
├── ERP-INFRA
├── ERPFrontend
└── VotreMicroservice

3️⃣ Configuration des variables d’environnement

3.1 Fichier .env (microservice et infra)

Dans le projet du microservice et le projet ERP-INFRA, créez un fichier :

    - .env

Ajoutez la ligne suivante :

    - DB_PASSWORD=VotreMotDePasse

Le mot de passe doit contenir :

    - au moins 8 caractères
    - une majuscule
    - une minuscule
    - un chiffre
    - un caractère spécial

Exemple :

    - DB_PASSWORD=Erp@2026

3.2 Fichier .env.docker (dans ERP-INFRA)

Dans le projet ERP-INFRA, créez un fichier :

   - .env.docker

Ajoutez les variables suivantes :

   - VITE_GESTIONPROJET_API=http://[Nom_du_service_docker]:[Port_exposé_dans_le_Dockerfile]
   - VITE_RH_API=http://[Nom_du_service_docker]:[Port_exposé_dans_le_Dockerfile]
   - VITE_CRM_API=http://[Nom_du_service_docker]:[Port_exposé_dans_le_Dockerfile]
   - VITE_TIMESHEET_API=http://[Nom_du_service_docker]:[Port_exposé_dans_le_Dockerfile]
   - VITE_BI_API=http://[Nom_du_service_docker]:[Port_exposé_dans_le_Dockerfile]

Exemple
   - VITE_GESTIONPROJET_API=http://gestionprojet-api:8080

⚠️ Le nom du service doit être exactement le même que celui défini dans le docker-compose.yml.

4️⃣ Lancer l’environnement Docker

Accédez au dossier :

ERP-INFRA

Puis exécutez la commande suivante :

   - docker compose up --build [nom_du_microservice] [nom_du_frontend]
Exemple
   - docker compose up --build gestionprojet-api erp-frontend