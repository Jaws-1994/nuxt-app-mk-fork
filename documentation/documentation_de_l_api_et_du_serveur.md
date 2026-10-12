# Documentation du Serveur et de l'API (Nuxt 3)

Ce document décrit l'architecture du backend de l'application, géré par le moteur **Nitro** intégré à Nuxt 3. Tout le code backend (API, connexion base de données) est centralisé dans le dossier `server/` situé à la racine du projet.

---

## 🏗️ Architecture des dossiers

```text
mon-projet/
└── server/
    ├── api/
    │   └── auth/
    │       ├── login.post.js
    │       └── register.post.js
    └── utils/
        └── db.js
```

### 📁 `server/`
C'est le dossier racine pour tout le code côté serveur. Nuxt isole ce dossier du front-end (`src/`). Le code à l'intérieur n'est jamais exposé au navigateur du client, ce qui garantit la sécurité des opérations sensibles.

### 📁 `server/utils/`
Ce dossier contient des fonctions et des modules utilitaires qui sont **auto-importés** par Nuxt dans tout le reste du dossier `server/`. Il n'y a pas besoin de faire de `import` manuels pour utiliser ce qui y est défini.

### 📁 `server/api/`
Ce dossier contient les routes de l'API. Nuxt convertit automatiquement l'arborescence des fichiers de ce dossier en routes HTTP accessibles via le préfixe `/api/`.

---

## 🛠️ Fichiers Utilitaires

### 📄 `db.js` (`server/utils/db.js`)
Ce fichier gère la connexion à la base de données MySQL.
- **Rôle :** Il crée et exporte un "pool" de connexions MySQL (`pool`) en utilisant le package `mysql2/promise`. 
- **Sécurité :** Il récupère les identifiants de connexion de manière sécurisée via `useRuntimeConfig()`, qui lit les variables d'environnement depuis le fichier `.env` à la racine du projet.
- **Utilisation :** N'importe où dans le dossier API, on peut exécuter une requête SQL en appelant `pool.query()`.

---

## 🔌 Routes API d'Authentification (📁 `server/api/auth/`)

Ces fichiers gèrent l'inscription et la connexion des utilisateurs. L'extension `.post.js` indique à Nuxt que ces routes n'acceptent que les requêtes HTTP de type `POST`. Les mots de passe sont hachés et vérifiés à l'aide de la librairie `bcrypt`.

### 📄 `register.post.js`
Gère la création d'un nouveau compte joueur.

- **URL :** `POST /api/auth/register`
- **Body attendu (JSON) :**
  ```json
  {
    "pseudo": "NomDuJoueur",
    "mail": "joueur@email.com",
    "password": "MotDePasseSecret"
  }
  ```
- **Processus :**
  1. Vérifie que toutes les données sont présentes.
  2. Hache le mot de passe (`password`) avec 12 tours via `bcrypt.hash`.
  3. Insère le nouvel utilisateur dans la table `users` de la base de données MySQL.
- **Réponses :**
  - `200 OK` : Inscription réussie.
  - `400 Bad Request` : Données manquantes dans le body.
  - `409 Conflict` : L'adresse email ou le pseudo existe déjà dans la base de données (`ER_DUP_ENTRY`).

---

### 📄 `login.post.js`
Gère la connexion d'un compte joueur existant.

- **URL :** `POST /api/auth/login`
- **Body attendu (JSON) :**
  ```json
  {
    "mail": "joueur@email.com",
    "password": "MotDePasseSecret"
  }
  ```
- **Processus :**
  1. Cherche dans la base de données l'utilisateur correspondant à l'adresse `mail`.
  2. Si l'utilisateur est trouvé, compare le `password` envoyé en clair avec le `user_password_hash` stocké en base via `bcrypt.compare`.
  3. Retourne les informations publiques du joueur (id, pseudo, rôle, score) pour l'utiliser côté front-end (sans renvoyer le hash du mot de passe).
- **Réponses :**
  - `200 OK` : Connexion réussie, renvoie les données du profil.
  - `400 Bad Request` : Email ou mot de passe manquant.
  - `401 Unauthorized` : Identifiants incorrects (email introuvable ou mauvais mot de passe).