# ⚙️ 03. Backend, Base de données et API (Serveur Nitro)

Notre projet Nuxt 3 embarque son propre serveur backend grâce au moteur **Nitro**. Tout le code situé dans le dossier `/server` est **totalement isolé du client** (le navigateur n'y a jamais accès), ce qui garantit la sécurité de nos clés d'API et mots de passe.

## 🗄️ Connexion à la Base de Données MySQL (`/server/utils/db.js`)
Ce fichier gère la connexion à notre base de données MySQL.
* **Librairie :** `mysql2/promise` (permet de faire des requêtes modernes avec `await`).
* **Pool de connexion :** Nous utilisons `mysql.createPool()`. Plutôt que d'ouvrir et fermer une connexion à chaque requête (ce qui est lent), le pool garde plusieurs connexions ouvertes et prêtes à l'emploi (jusqu'à 10 en simultané).
* **Sécurité :** Les identifiants (Host, User, Pass, DB Name) sont récupérés de manière sécurisée via `useRuntimeConfig()`.

> 💡 **Magie de Nuxt (Auto-imports) :**
> Le dossier `server/utils/` est spécial. Toutes les fonctions exportées dans ce dossier sont automatiquement disponibles partout dans l'API. Vous pouvez donc faire un `await pool.query(...)` dans n'importe quelle route sans jamais faire de `import { pool } from '../utils/db.js'`.

## 🪪 Sessions révocables (`/server/utils/session.js` + table `auth_sessions`)
Le dump contient `users` et une table `session` (parties / quiz), mais **pas** de table d'auth. Exécuter `sql/create_sessions.sql` avant le login. `ID_user` y est `INT UNSIGNED`, comme dans `users`.

* **Modèle :** le cookie `mk_session` contient un identifiant aléatoire (32 octets, base64url). Seule son empreinte SHA-256 est stockée dans `auth_sessions`, avec `ID_user` et `session_expires_at` (7 jours). Révoquer une session = supprimer la ligne : le cookie devient immédiatement inutilisable.
* **Cookie :** `HttpOnly`, `Path=/`, `SameSite=Lax` (front et API sur le même origine Nuxt). `Secure` est activé uniquement en production (`NODE_ENV=production`, donc HTTPS). Jamais de hash de mot de passe dans le cookie ni dans les réponses JSON.
* **Helpers auto-importés :** `createSession`, `getSessionUser`, `destroySession`, `toPublicUser`.

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
* **Objectif :** Vérifier les identifiants, créer une session révocable, poser le cookie HttpOnly, renvoyer le profil public (dont le pseudo).
* **Fonctionnement détaillé :**
  1. Extrait `mail` et `password` de la requête. Renvoie 400 si absents.
  2. **Recherche SQL :** sélectionne uniquement `ID_user`, `user_pseudo`, `user_role`, `user_score` et `user_password_hash` (pas de `SELECT *`).
  3. **Vérification :** `bcrypt.compare()` sur le hash. Identifiants inconnus ou mot de passe faux → 401 identique (`Identifiants incorrects`). Aucun log du mot de passe ni du hash.
  4. **Session :** génère un identifiant aléatoire, enregistre son hash + `ID_user` + expiration, pose le cookie `mk_session`.
  5. **Succès :** objet `user` public (id, pseudo, rôle, score). Le hash du mot de passe n'est jamais renvoyé.

### 3. Profil courant : `me.get.js`
* **Route :** `GET /api/auth/me`
* **Objectif :** Lire le cookie, retrouver la session non expirée, renvoyer le profil public.
* **Réponses :** `200` avec `{ success, user }` ; `401` si cookie absent, session inconnue ou expirée.

### 4. Déconnexion : `logout.post.js`
* **Route :** `POST /api/auth/logout`
* **Objectif :** Supprimer la ligne de session en base (révocation immédiate) et effacer le cookie (`Path=/`).
* **Réponse :** `200` même si aucune session n'était présente (idempotent).

🔒 *Règle d'or : on ne renvoie jamais `user_password_hash` au navigateur.*