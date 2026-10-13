# 🏗️ 01. Architecture et Fichiers de Configuration

L'application suit la structure de dossiers standardisée par **Nuxt 3**. Ce document explique le rôle de chaque dossier et fichier présent à la racine du projet.

## 📂 Arborescence Principale
\`\`\`text
/
├── app/                  # Cœur du Frontend (Vues, Composants, Layouts)
├── documentation/        # Documentations techniques pour l'équipe
├── public/               # Fichiers statiques accessibles publiquement
├── server/               # Cœur du Backend (API Nitro, Utilitaires Serveur MySQL)
├── .gitignore            # Règles d'exclusion pour Git
├── nuxt.config.ts        # Fichier de configuration principal de Nuxt
├── package.json          # Liste des dépendances et scripts
├── package-lock.json     # Verrouillage strict des versions des dépendances
├── tsconfig.json         # Configuration TypeScript (générée par Nuxt)
└── README.md             # Guide de démarrage
\`\`\`

## ⚙️ Les Fichiers de Configuration

### `nuxt.config.ts`
C'est le chef d'orchestre de l'application Nuxt. C'est ici que l'on configure :
* **runtimeConfig** : Permet d'injecter des variables d'environnement (comme les accès BDD) de manière sécurisée. Les variables définies ici sont accessibles côté serveur via `useRuntimeConfig()`.
* **Modules** : C'est ici que l'on ajoute Pinia, Tailwind CSS, etc.
* **Méta-données globales** : Titre du site, balises `<head>`, scripts externes.

### `tsconfig.json`
Bien que nous utilisions principalement du JavaScript, Nuxt 3 est bâti sur TypeScript. Ce fichier est auto-généré par Nuxt (via le dossier caché `.nuxt`) pour fournir l'autocomplétion (IntelliSense) et la vérification des types dans l'IDE (comme VS Code). **Ne pas le modifier manuellement.**

### `.gitignore`
Empêche de pousser des fichiers sensibles ou inutiles sur GitHub :
* `/node_modules` (les dépendances lourdes).
* `.env` (qui contient les mots de passe de la BDD).
* `.nuxt/` et `.output/` (fichiers de build auto-générés).

### Fichiers Temporaires de Test
* `test-pierre.ms` : Fichier de test isolé ("Hello test de Pierre"). Il pourra être supprimé en production.