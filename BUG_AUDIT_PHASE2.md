# Audit complémentaire — bugs restants (autres pages)

## Priorité 1 — Bloquants / sécurité fonctionnelle

1. **Crash potentiel immédiat de la page Data Management**
   - `src/pages/data-management/index.jsx` importe `useAuth` depuis `src/hooks/useAuth.jsx` puis destructure son retour.
   - Or `src/hooks/useAuth.jsx` est un placeholder qui retourne `null`.
   - Résultat attendu: `Cannot destructure property ... of null` au rendu.

2. **Filtrage d’accès sidebar trop permissif quand le rôle n’est pas chargé**
   - `SidebarNavigation.hasAccess` retourne `true` si `!userRole`, ce qui affiche temporairement toutes les entrées de menu.
   - Même si les routes sont protégées, ça crée une fuite UX/permissions (navigation visible non autorisée).

3. **Filtrage d’accès onglets Settings trop permissif quand rôle absent**
   - `Settings.hasAccess` retourne aussi `true` si `!currentRole`, ce qui peut exposer des onglets admin tant que le rôle n’est pas résolu.

## Priorité 2 — Incohérences de rôles (droits cassés)

4. **Nomenclature de rôles incohérente (`administrator` vs `company_admin`, `user` vs `team_member`)**
   - Le contexte auth travaille avec `super_admin`, `administrator`, `manager`, `user`.
   - Plusieurs pages/composants vérifient `company_admin`/`team_member`, donc les actions sont masquées/affichées de manière incorrecte selon l’écran.

5. **Actions “Ajouter utilisateur” potentiellement invisibles pour un vrai admin**
   - `UserManagement` autorise le bouton uniquement pour `super_admin` ou `company_admin`.
   - Un utilisateur avec rôle `administrator` (réel côté AuthContext) peut perdre l’action.

6. **QuickActionBar peut devenir vide selon le rôle réel**
   - Le composant filtre sur `company_admin/team_member`; avec `administrator/user` il peut ne plus proposer les actions attendues.

## Priorité 3 — Données mock en production (comportement trompeur)

7. **Catégories entièrement mockées + rôle/tenant hardcodés**
   - Chargement local simulé via `setTimeout` et `mockCategories`, sans backend.

8. **Emplacements entièrement mockés + rôle/tenant hardcodés**
   - Même pattern: données statiques, délais simulés, logique locale.

9. **QR Scanner non connecté au backend**
   - Le scan déclenche un faux traitement (`setTimeout`) et un faux résultat, donc pas de lookup réel produit.

10. **Dashboard 100% mock (KPI/activités/alertes)**
   - Les métriques affichées ne sont pas corrélées aux données réelles de la société courante.

## Priorité 4 — Qualité / dette technique

11. **Logs de debug très nombreux en production**
   - Plusieurs pages/services gardent des `console.log` bruyants (auth, produits, mouvements, settings), ce qui pollue la console et peut exposer du contexte métier.

12. **Incohérence de type `currentTenant` passée à Sidebar**
   - Certaines pages passent une string (`'TechCorp Solutions'`), d’autres un objet.
   - `SidebarNavigation` lit `currentTenant?.name`, ce qui force souvent le fallback `StockFlow Pro` et masque le tenant réel.

---

## Recommandation d’ordre de correction (next steps)

1. Corriger `useAuth` placeholder (ou uniformiser tous les imports vers `contexts/AuthContext`) pour stopper les crashes.
2. Uniformiser la taxonomie de rôles dans **toute** l’app (`super_admin/administrator/manager/user`) + remplacer `company_admin/team_member`.
3. Rendre `hasAccess` strict par défaut (si rôle inconnu => masquer, pas afficher).
4. Prioriser la connexion backend des pages mockées: `categories` → `locations` → `qr-scanner` → `dashboard`.
5. Nettoyer les logs debug et harmoniser `currentTenant` (toujours objet `{ name }`).
