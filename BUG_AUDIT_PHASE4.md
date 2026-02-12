# Audit complémentaire v4 — état actuel des bugs restants

## Résumé exécutif
La base est nettement plus stable (auth/routing, scanner QR, pages produits, catégories/emplacements, data-management), mais il reste encore quelques zones à corriger pour un niveau "production propre".

## Priorité 1 — Risques fonctionnels / cohérence UX

1. **`stock-movements` : création de mouvement encore branchée sur des produits mockés**
   - `NewMovementModal` s’appuie toujours sur `mockProducts` pour la sélection produit.
   - Impact: création de mouvement incohérente avec l’inventaire réel.

2. **Incohérence `currentTenant` résiduelle dans `settings`**
   - Une partie de la page passe encore `currentCompany?.name` au lieu d’un objet tenant harmonisé.
   - Impact: divergence d’affichage possible selon les composants qui attendent `{ name }`.

## Priorité 2 — Qualité / robustesse

3. **Logs de debug très verbeux dans `AuthContext`**
   - Beaucoup de `console.log(...)` restent actifs (sessions, profils, rôles, sign-in).
   - Impact: bruit console en prod + exposition inutile de métadonnées utilisateur.

4. **Délais artificiels restants dans les pages d’auth/settings**
   - `reset-password` conserve un `setTimeout` pour la redirection UX.
   - `settings/index` conserve un `await new Promise(...setTimeout...)` dans `handleSave`.
   - Impact: latence artificielle et perception de lenteur non corrélée au backend.

## Priorité 3 — Dette technique

5. **Persistance settings/langue/thème améliorée mais pas totalement unifiée**
   - Les utilitaires centralisés existent (`storage`, `language`) et sont adoptés dans la plupart des zones.
   - Il reste toutefois plusieurs écritures directes `localStorage.setItem(...)` dispersées (normal), sans couche de service unique.
   - Impact: dette d’architecture plus que bug bloquant.

---

## Vérification des points Phase 3 précédemment ouverts

### Point #6 (pages mockées)
- **Amélioré fortement**: `data-management` n’est plus piloté par `mockOperation` / `mockHistory`.
- **Reste à finir**: `stock-movements/components/NewMovementModal.jsx` garde encore `mockProducts`.

### Point #8 (persistences incohérentes)
- **Globalement en ordre**: utilitaires `safeJsonParse/getLocalStorageJson` et `getStoredLanguage/persistLanguage` en place.
- **Reste à peaufiner**: centraliser éventuellement les `setItem` via une couche unique si vous voulez standardiser totalement.

---

## Plan de finalisation recommandé (prochaine passe)
1. Brancher `NewMovementModal` sur les produits réels (`productService.getProducts(companyId)` + recherche/filtre).
2. Harmoniser définitivement `currentTenant` (toujours objet) dans `settings`.
3. Réduire/supprimer les `console.log` d’`AuthContext` (conserver uniquement warnings/errors utiles).
4. Retirer les délais artificiels restants (`settings`, `reset-password`) ou les remplacer par des états réellement backend-driven.
