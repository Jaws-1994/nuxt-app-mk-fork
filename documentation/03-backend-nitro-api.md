# ⚙️ 03. Backend, Base de données et API (Serveur Nitro)

Notre projet Nuxt 3 embarque son propre serveur backend grâce au moteur **Nitro**. Tout le code situé dans le dossier `/server` est **totalement isolé du client** (le navigateur n'y a jamais accès), ce qui garantit la sécurité de nos clés d'API et mots de passe.

## 🗄️ Connexion à la Base de Données MySQL (`/server/utils/db.js`)
Ce fichier gère la connexion à notre base de données MySQL.
* **Librairie :** `mysql2/promise` (permet de faire des requêtes modernes avec `await`).
* **Pool de connexion :** Nous utilisons `mysql.createPool()`. Plutôt que d'ouvrir et fermer une connexion à chaque requête (ce qui est lent), le pool garde plusieurs connexions ouvertes et prêtes à l'emploi (jusqu'à 10 en simultané).
* **Sécurité :** Les identifiants (Host, User, Pass, DB Name) sont récupérés de manière sécurisée via `useRuntimeConfig()`.

> 💡 **Magie de Nuxt (Auto-imports) :**
> Le dossier `server/utils/` est spécial. Toutes les fonctions exportées dans ce dossier sont automatiquement disponibles partout dans l'API. Vous pouvez donc faire un `await pool.query(...)` dans n'importe quelle route sans jamais faire de `import { pool } from '../utils/db.js'`.

## 🪪 JWT + sessions révocables (`/server/utils/session.js` + table `auth_sessions`)
Le front (`https://app-user-mk-paq6.vercel.app`) et l'API (`https://nuxt-app-mk.vercel.app`) sont sur des origines différentes : **pas de cookie de session**. Le client envoie `Authorization: Bearer <jwt>`.

Le dump contient `users` et une table `session` (parties / quiz), mais **pas** de table d'auth. Exécuter `sql/create_sessions.sql` avant le login. `ID_user` y est `INT UNSIGNED`, comme dans `users`.

* **Modèle :** login signe un JWT HS256 (7 jours) dont le `jti` est aléatoire. Seule l'empreinte SHA-256 du `jti` est stockée dans `auth_sessions` (avec `ID_user` et `session_expires_at`). Logout = suppression de la ligne → le JWT est immédiatement refusé. Le JWT ne contient pas le hash du mot de passe.
* **Secret :** `JWT_SECRET` (runtimeConfig serveur uniquement). À définir aussi dans les variables Vercel du projet API.
* **Helpers auto-importés :** `createSession` (renvoie le JWT), `getSessionUser`, `destroySession`, `toPublicUser`.

## 🌐 CORS (`/server/middleware/cors.js`)
Le navigateur du client Vercel bloque les appels cross-origin sans en-têtes CORS. Le middleware :
* reflète `Access-Control-Allow-Origin` seulement si l'origine est dans `CORS_ORIGINS` (défaut : `https://app-user-mk-paq6.vercel.app` + localhost) ;
* autorise les méthodes REST et les headers `Content-Type`, `Authorization` ;
* répond `204` aux prévols `OPTIONS`.
Pas de `Access-Control-Allow-Credentials` : le jeton voyage dans le header, pas dans un cookie.

## 🔐 Routes API d'Authentification (`/server/api/auth/`)
Nuxt crée automatiquement des routes HTTP en lisant les fichiers du dossier `server/api`. L'extension `.post.js` / `.get.js` force la méthode HTTP acceptée.

### 1. Inscription : `register.post.js`
* **Route :** `POST /api/auth/register`
* **Objectif :** Créer un compte utilisateur.
* **Fonctionnement détaillé :**
  1. Lit le corps de la requête via `readBody(event)` pour extraire `pseudo`, `mail`, et `password`.
  2. Stoppe et renvoie une erreur 400 si un champ manque.
  3. **Hachage :** Utilise `bcrypt.hash(password, 12)` pour sécuriser le mot de passe avant insertion.
  4. **SQL :** Exécute un `INSERT INTO users`. Utilise des requêtes préparées (`(?, ?, ?)`) pour contrer les injections SQL.
  5. **Erreurs :** Si l'email ou le pseudo existe déjà, MySQL lève une erreur `ER_DUP_ENTRY`. L'API l'intercepte et renvoie une erreur HTTP 409 (Conflit).

### 2. Connexion : `login.post.js`
* **Route :** `POST /api/auth/login`
* **Objectif :** Vérifier les identifiants, créer une session révocable, renvoyer un JWT et le profil public (dont le pseudo).
* **Fonctionnement détaillé :**
  1. Extrait `mail` et `password` de la requête. Renvoie 400 si absents.
  2. **Recherche SQL :** sélectionne uniquement `ID_user`, `user_pseudo`, `user_role`, `user_score` et `user_password_hash` (pas de `SELECT *`).
  3. **Vérification :** `bcrypt.compare()` sur le hash. Identifiants inconnus ou mot de passe faux → 401 identique (`Identifiants incorrects`). Aucun log du mot de passe ni du hash.
  4. **JWT :** génère un `jti` aléatoire, enregistre son hash + `ID_user` + expiration, signe le JWT.
  5. **Succès :** `{ token, user }` (id, pseudo, rôle, score). Le hash du mot de passe n'est jamais renvoyé.

### 3. Profil courant : `me.get.js`
* **Route :** `GET /api/auth/me`
* **Objectif :** Vérifier `Authorization: Bearer`, contrôler le JWT et la ligne `auth_sessions`, renvoyer le profil public.
* **Réponses :** `200` avec `{ success, user }` ; `401` si header absent, JWT invalide, session révoquée ou expirée.

### 4. Déconnexion : `logout.post.js`
* **Route :** `POST /api/auth/logout`
* **Objectif :** Supprimer la ligne `auth_sessions` (révocation immédiate). Le client doit oublier le JWT de son côté.
* **Réponse :** `200` même si aucune session n'était présente (idempotent).

🔒 *Règle d'or : on ne renvoie jamais `user_password_hash` au navigateur.*