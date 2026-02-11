# Audit initial — priorités bugs (Rocket.new StockFlow Pro)

## Priorité 1 — Sécurité / accès
1. **Routes non protégées côté front** : toutes les pages sensibles (`/dashboard`, `/products`, `/settings`, etc.) sont accessibles sans guard d’authentification ni contrôle de rôle au niveau routing.
2. **Identifiants de démonstration exposés en clair dans l’UI** (emails + mots de passe), ce qui est risqué même en environnement de démo si ce code part en prod.

## Priorité 2 — Bugs UX critiques sur l’authentification
3. **Le bouton “Utiliser” des comptes démo ne fait pas l’action attendue** : il log les credentials en console au lieu de remplir le formulaire via `onCredentialSelect`.
4. **Clés de traduction manquantes dans `CredentialsHelper`** (`showCredentials`, `hideCredentials`, `useAccount`, `email`, `password`, rôles…) => libellés potentiellement vides/undefined.
5. **Diagnostic de connexion incohérent** : le compteur “utilisateurs” et le compteur “profils” lisent tous les deux la table `user_profiles`, donc le diagnostic est faux.

## Priorité 3 — Problèmes d’interface et qualité perçue
6. **Noms d’icônes Lucide invalides (kebab-case / lowercase)** sur plusieurs pages (ex: `lock`, `check-circle`, `arrow-left`). Le composant fallback affiche `HelpCircle`, donc l’UI n’affiche pas les bonnes icônes.
7. **Bouton “Mot de passe oublié ?” sans action** dans le formulaire (au-dessus, dans la section remember me), alors qu’un vrai lien existe plus bas : duplication confuse.

## Priorité 4 — Robustesse technique
8. **Client Supabase créé sans garde si variables d’environnement absentes** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) : peut casser tôt sans message explicite.
9. **`JSON.parse` non sécurisé sur `localStorage` dans le hook de traduction** : une valeur corrompue de `generalSettings` peut faire planter l’app au runtime.
10. **Bundle principal très lourd** (warning Vite > 2MB minifié), risque de lenteur au chargement initial.

---

## Ordre de traitement recommandé (pragmatique)
1. Sécuriser l’accès (route guards + contrôle rôle).
2. Corriger le flux login démo (suppression secrets en clair, bouton “Utiliser” fonctionnel).
3. Corriger les icônes invalides et les textes manquants pour stabiliser l’UX.
4. Fiabiliser Supabase env checks + parsing localStorage.
5. Optimiser le bundle (code splitting / lazy loading).
