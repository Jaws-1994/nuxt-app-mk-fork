# 🎨 02. Frontend : Dossiers `app` et `public`

## 🖥️ Le dossier `/app`
Dans Nuxt 3, le dossier `app/` contient le cœur de l'interface Vue.js.

### `app.vue`
C'est le **point d'entrée principal** de l'interface utilisateur. 
Actuellement, il sert de coquille de base. Pour gérer le multi-pages (ex: page de connexion, page d'accueil), il doit contenir les balises de routing de Nuxt :
\`\`\`vue
<template>
  <div>
    <!-- NuxtLayout gère les gabarits (headers, footers) -->
    <NuxtLayout>
      <!-- NuxtPage injecte le composant de la page courante selon l'URL -->
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
\`\`\`
*(Le fichier de test `app/testJojo` est un fichier temporaire contenant du texte et peut être ignoré).*

## 🌍 Le dossier `/public`
Le contenu de ce dossier est servi directement à la racine du serveur web. **Ces fichiers ne passent pas par le bundler (Vite/Webpack)**. 
Si vous avez une image `public/logo.png`, elle sera accessible via `<img src="/logo.png">`.

### Fichiers actuels :
* **`favicon.ico`** : L'icône de l'application affichée dans l'onglet du navigateur web.
* **`robots.txt`** : Fichier lu par les moteurs de recherche (Googlebot). 
  * Actuellement configuré avec `User-Agent: *` et `Disallow: /`.
  * ⚠️ **Important :** Cette configuration interdit l'indexation de tout le site. C'est parfait pour le développement, mais il faudra retirer le `/` après `Disallow:` lors du passage en production pour le SEO.