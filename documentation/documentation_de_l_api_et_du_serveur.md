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
Gère les sessions révocables.
- **Cookie `mk_session` :** identifiant aléatoire, `HttpOnly`, `Path=/`, `SameSite=Lax`, `Secure` en production.
- **Base :** table `auth_sessions` (`session_token_hash`, `ID_user`, `session_expires_at`). Distincte de `session` (parties). Le dump n'a pas cette table : exécuter `sql/create_sessions.sql`. `ID_user` est `INT UNSIGNED`.
- **Fonctions :** `createSession`, `getSessionUser`, `destroySession`, `toPublicUser` (jamais le hash du mot de passe).

---

## 🔌 Routes API d'Authentification (📁 `server/api/auth/`)

Ces fichiers gèrent l'inscription, la connexion, le profil courant et la déconnexion. L'extension (`.post.js`, `.get.js`) indique la méthode HTTP acceptée. Les mots de passe sont hachés et vérifiés avec `bcrypt`. Les sessions sont stockées en base (hash du jeton, pas le jeton en clair).

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
  4. Crée une ligne dans `auth_sessions` (hash du jeton + `ID_user` + expiration) et pose le cookie HttpOnly `mk_session`.
  5. Renvoie le profil public (`id`, `pseudo`, `role`, `score`). Le hash du mot de passe n'est jamais renvoyé.
- **Réponses :**
  - `200 OK` : Connexion réussie, cookie de session + profil public.
  - `400 Bad Request` : Email ou mot de passe manquant.
  - `401 Unauthorized` : Identifiants incorrects.

---

### 📄 `me.get.js`
Renvoie le profil de l'utilisateur actuellement authentifié.

- **URL :** `GET /api/auth/me`
- **Body :** aucun. Le cookie `mk_session` suffit.
- **Processus :**
  1. Lit le cookie, calcule son SHA-256, joint `auth_sessions` et `users`.
  2. Ignore les sessions expirées (`session_expires_at > NOW()`).
  3. Renvoie le profil public (dont le pseudo). Aucune modification des colonnes `users` n'est nécessaire pour afficher le pseudo.
- **Réponses :**
  - `200 OK` : `{ "success": true, "user": { "id", "pseudo", "role", "score" } }`.
  - `401 Unauthorized` : cookie absent, session inconnue ou expirée.

---

### 📄 `logout.post.js`
Invalide la session côté serveur et supprime le cookie.

- **URL :** `POST /api/auth/logout`
- **Processus :**
  1. Supprime la ligne correspondant au hash du jeton dans `auth_sessions` (révocation immédiate).
  2. Efface le cookie `mk_session` (`Path=/`).
- **Réponses :**
  - `200 OK` : déconnexion réussie (idempotent si aucune session n'existait).

---

## 🧪 Tester les routes avec Insomnium

Base URL : `http://localhost:3000` (après `npm run dev`). Utiliser le même hôte pour toutes les requêtes, afin que le cookie jar conserve `mk_session`.

1. **Prérequis :** exécuter `sql/create_sessions.sql` sur la base, puis avoir un compte (`POST /api/auth/register` si besoin).
2. **Login** — `POST http://localhost:3000/api/auth/login`  
   Header `Content-Type: application/json`, body JSON `{ "mail": "...", "password": "..." }`.  
   Succès : `200` avec `user.pseudo`. Dans l’onglet **Cookies** / timeline : cookie `mk_session`, attributs `HttpOnly` et `Path=/`. Le JSON ne contient pas `user_password_hash`.
3. **Me** — `GET http://localhost:3000/api/auth/me` (pas de body). Insomnium renvoie le cookie tout seul si le jar est actif. Succès : même profil public. Sans cookie ou après expiration : `401`.
4. **Logout** — `POST http://localhost:3000/api/auth/logout`. Vérifier que le cookie est retiré, puis refaire `GET /api/auth/me` → `401`.

Ne pas envoyer de header `Authorization` : l’auth repose uniquement sur le cookie. Pour un test « non connecté », vider le cookie jar ou ouvrir une requête dans un autre espace sans cookies.