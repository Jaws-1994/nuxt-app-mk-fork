## 🔌 API Routes (Authentification)

L'API est gérée par le moteur Nitro intégré à Nuxt. Toutes les requêtes se font sous le préfixe `/api`.

### 1. Inscription (Register)
Crée un nouvel utilisateur dans la base de données.

* **URL :** `/api/auth/register`
* **Méthode :** `POST`
* **Body (JSON) :**
  ```json
  {
    "pseudo": "NomDuJoueur",
    "mail": "joueur@email.com",
    "password": "MotDePasseSecret"
  }

# Nuxt Minimal Starter (Et nouveau Pierre Charlier)(avec son meilleur pote Farèze)

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

