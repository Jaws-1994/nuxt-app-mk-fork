# Documentation du Serveur et de l'API (Nuxt 3)

Ce document décrit l'architecture du backend de l'application, géré par le moteur **Nitro** intégré à Nuxt 3. Tout le code backend (API, connexion base de données) est centralisé dans le dossier `server/` situé à la racine du projet.

---

## 🏗️ Architecture des dossiers

```text
mon-projet/
├── sql/
│   └── create_sessions.sql
└── server/
    ├── api/
    │   └── auth/
    │       ├── login.post.js
    │       ├── logout.post.js
    │       ├── me.get.js
    │       └── register.post.js
    ├── middleware/
    │   └── cors.js
    └── utils/
        ├── db.js
        └── session.js
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

### 📄 `session.js` (`server/utils/session.js`)
Gère les JWT révocables (plus de cookie de session).
- **JWT :** HS256, 7 jours, claims `sub` (ID utilisateur) et `jti`. Envoyé dans `Authorization: Bearer <token>`.
- **Base :** table `auth_sessions` (hash SHA-256 du `jti`, `ID_user`, `session_expires_at`). Distincte de `session` (parties). Exécuter `sql/create_sessions.sql`. `ID_user` est `INT UNSIGNED`.
- **Fonctions :** `createSession` (renvoie le JWT), `getSessionUser`, `destroySession`, `toPublicUser` (jamais le hash du mot de passe).

### 📄 `cors.js` (`server/middleware/cors.js`)
Autorise le front `https://app-user-mk-paq6.vercel.app` à appeler l'API `https://nuxt-app-mk.vercel.app`. Origines lues dans `CORS_ORIGINS`. Headers autorisés : `Content-Type`, `Authorization`. Prévol `OPTIONS` → 204.

---

## 🔌 Routes API d'Authentification (📁 `server/api/auth/`)

Ces fichiers gèrent l'inscription, la connexion, le profil courant et la déconnexion. L'extension (`.post.js`, `.get.js`) indique la méthode HTTP acceptée. Les mots de passe sont hachés et vérifiés avec `bcrypt`. L'auth utilise un JWT ; le `jti` est hashé en base pour pouvoir révoquer immédiatement.

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
  1. Lit `mail` et `password`. Renvoie 400 s'ils manquent.
  2. Charge uniquement les colonnes nécessaires (`ID_user`, champs publics, `user_password_hash`) — pas de `SELECT *`.
  3. Vérifie le mot de passe avec `bcrypt.compare` (sans logger le mot de passe ni le hash).
  4. Crée une ligne dans `auth_sessions` (hash du `jti` + `ID_user` + expiration) et signe un JWT.
  5. Renvoie `{ token, user }` (`id`, `pseudo`, `role`, `score`). Le hash du mot de passe n'est jamais renvoyé.
- **Réponses :**
  - `200 OK` : Connexion réussie, JWT + profil public.
  - `400 Bad Request` : Email ou mot de passe manquant.
  - `401 Unauthorized` : Identifiants incorrects.

---

### 📄 `me.get.js`
Renvoie le profil de l'utilisateur actuellement authentifié.

- **URL :** `GET /api/auth/me`
- **Body :** aucun. Header `Authorization: Bearer <jwt>`.
- **Processus :**
  1. Vérifie le JWT, hash le `jti`, joint `auth_sessions` et `users`.
  2. Ignore les sessions expirées ou révoquées (`session_expires_at > NOW()`).
  3. Renvoie le profil public (dont le pseudo). Aucune modification des colonnes `users` n'est nécessaire pour afficher le pseudo.
- **Réponses :**
  - `200 OK` : `{ "success": true, "user": { "id", "pseudo", "role", "score" } }`.
  - `401 Unauthorized` : header absent, JWT invalide, session inconnue ou expirée.

---

### 📄 `logout.post.js`
Invalide la session côté serveur. Le client doit oublier le JWT.

- **URL :** `POST /api/auth/logout`
- **Header :** `Authorization: Bearer <jwt>`
- **Processus :**
  1. Vérifie le JWT et supprime la ligne correspondant au hash du `jti` dans `auth_sessions` (révocation immédiate).
- **Réponses :**
  - `200 OK` : déconnexion réussie (idempotent si aucune session n'existait).

---

## 🧪 Tester les routes avec Insomnium

Base URL locale : `http://localhost:3000`. Production API : `https://nuxt-app-mk.vercel.app`.

1. **Prérequis :** table `auth_sessions` + `JWT_SECRET` dans `.env` (et dans Vercel pour l'API).
2. **Login** — `POST /api/auth/login`  
   Header `Content-Type: application/json`, body `{ "mail": "...", "password": "..." }`.  
   Succès : `200` avec `token` et `user.pseudo`. Copier `token`. Pas de cookie, pas de `user_password_hash`.
3. **Me** — `GET /api/auth/me`, onglet Auth → Bearer Token, coller le JWT (Insomnium enverra `Authorization: Bearer ...`). Succès : profil. Sans header / mauvais token / après logout : `401`.
4. **Logout** — `POST /api/auth/logout` avec le même Bearer, puis `GET /me` → `401`.

Côté front : stocker `token` (ex. `localStorage`) et l'envoyer sur chaque requête API. Ne pas utiliser `credentials: 'include'` pour l'auth.