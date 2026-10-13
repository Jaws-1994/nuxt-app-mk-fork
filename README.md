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
NUXT_DB_HOST=localhost
NUXT_DB_USER=root
NUXT_DB_PASS=votre_mot_de_passe
NUXT_DB_NAME=movie_king_db
\`\`\`

### 4. Lancement
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