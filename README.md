# 🎬 Movie King (MK) - Application Nuxt 3

Bienvenue sur le dépôt officiel du projet **Movie King**. Cette application est construite avec le framework **Nuxt 3** (Vue.js) pour le frontend, et utilise le moteur interne **Nitro** pour l'API backend et la communication avec la base de données MySQL.

## 🚀 Démarrage Rapide (Onboarding)

### 1. Prérequis
* **Node.js** (version 18 ou supérieure recommandée).
* **MySQL** (installé localement ou accessible via un serveur distant).
* Un gestionnaire de paquets (`npm` est utilisé par défaut).

### 2. Installation
Clonez le dépôt et installez les dépendances :
\`\`\`bash
git clone <url-du-repo>
cd nuxt-app-mk
npm install
\`\`\`

### 3. Variables d'environnement
Créez un fichier `.env` à la racine du projet. Demandez les valeurs exactes au Lead Developer, mais voici la structure attendue par notre configuration :
\`\`\`env
DB_HOST=localhost
DB_USER=root
DB_PASS=votre_mot_de_passe
DB_NAME=movie_king_db
JWT_SECRET=une_chaine_longue_aleatoire
CORS_ORIGINS=https://app-user-mk-paq6.vercel.app,http://localhost:3000,http://localhost:3001
\`\`\`

Sur Vercel (projet API `nuxt-app-mk`), définir les mêmes variables, dont `JWT_SECRET` et `CORS_ORIGINS`.

### 4. Table des sessions
Le dump fournit `users` et une table `session` (parties), mais pas les sessions d'auth. Avant le login, exécutez :

```bash
mysql -u <user> -p <nom_de_la_base> < sql/create_sessions.sql
```

### 5. Lancement
Lancez le serveur de développement :
\`\`\`bash
npm run dev
\`\`\`
L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

## 📚 Documentation Détaillée
Pour comprendre le fonctionnement interne du projet, veuillez consulter les fichiers suivants dans le dossier `/documentation` :
* [01 - Architecture et Fichiers de Configuration](./documentation/01-architecture-et-config.md)
* [02 - Frontend (Interface et Fichiers Publics)](./documentation/02-frontend-app-public.md)
* [03 - Backend et Base de Données (API Nitro)](./documentation/03-backend-nitro-api.md)
* [Documentation de l'API et du serveur](./documentation/documentation_de_l_api_et_du_serveur.md)