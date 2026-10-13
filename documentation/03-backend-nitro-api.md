# ⚙️ 03. Backend, Base de données et API (Serveur Nitro)

Notre projet Nuxt 3 embarque son propre serveur backend grâce au moteur **Nitro**. Tout le code situé dans le dossier `/server` est **totalement isolé du client** (le navigateur n'y a jamais accès), ce qui garantit la sécurité de nos clés d'API et mots de passe.

## 🗄️ Connexion à la Base de Données MySQL (`/server/utils/db.js`)
Ce fichier gère la connexion à notre base de données MySQL.
* **Librairie :** `mysql2/promise` (permet de faire des requêtes modernes avec `await`).
* **Pool de connexion :** Nous utilisons `mysql.createPool()`. Plutôt que d'ouvrir et fermer une connexion à chaque requête (ce qui est lent), le pool garde plusieurs connexions ouvertes et prêtes à l'emploi (jusqu'à 10 en simultané).
* **Sécurité :** Les identifiants (Host, User, Pass, DB Name) sont récupérés de manière sécurisée via `useRuntimeConfig()`.

> 💡 **Magie de Nuxt (Auto-imports) :**
> Le dossier `server/utils/` est spécial. Toutes les fonctions exportées dans ce dossier sont automatiquement disponibles partout dans l'API. Vous pouvez donc faire un `await pool.query(...)` dans n'importe quelle route sans jamais faire de `import { pool } from '../utils/db.js'`.

## 🔐 Routes API d'Authentification (`/server/api/auth/`)
Nuxt crée automatiquement des routes HTTP en lisant les fichiers du dossier `server/api`. L'extension `.post.js` force la route à n'accepter que les requêtes **POST**.

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
* **Objectif :** Authentifier un utilisateur et renvoyer ses données de session.
* **Fonctionnement détaillé :**
  1. Extrait `mail` et `password` de la requête. Renvoie 400 si absents.
  2. **Recherche SQL :** Fait un `SELECT * FROM users WHERE user_mail = ?`. S'il n'y a pas de résultat, renvoie une erreur 401 (Email introuvable).
  3. **Vérification :** Utilise `bcrypt.compare()` pour vérifier si le mot de passe fourni correspond au `user_password_hash` stocké en base. Si faux, renvoie 401 (Mot de passe incorrect).
  4. **Succès :** Si tout est bon, l'API renvoie un objet `user` nettoyé contenant l'ID, le pseudo, le rôle et le score. 
  * 🔒 *Règle d'or : On ne renvoie jamais le mot de passe haché au frontend.*