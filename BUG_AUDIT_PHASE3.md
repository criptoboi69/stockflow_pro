# Audit complémentaire v3 — bugs restants

## Priorité 1 — Bugs fonctionnels (impact utilisateur direct)

1. **QR Scanner toujours non connecté aux vraies données produit**
   - Le flux scanner (`qr-scanner`) est encore simulé via `setTimeout`.
   - Les résultats affichés proviennent d’un `mockProduct` statique, pas d’une recherche réelle en base.
   - Impact: le scan peut sembler marcher mais ne reflète pas l’état réel du stock.

2. **Vue produit non réactive à la largeur écran (bug responsive)**
   - Le choix liste/grille s’appuie directement sur `window.innerWidth` dans le rendu.
   - Pas de source d’état dédiée à la largeur => certains changements de viewport peuvent produire une UI incohérente.

3. **Action “Quick Search” probablement inopérante dans plusieurs pages**
   - `QuickActionBar` tente `document.querySelector('[data-search-input]')`.
   - Si les pages ne posent pas cet attribut, l’action ne fait rien (échec silencieux).

## Priorité 2 — Robustesse (risques de crash)

4. **`JSON.parse` non protégé dans plusieurs composants settings/products**
   - Plusieurs composants lisent localStorage sans `try/catch`.
   - Une valeur corrompue peut casser le rendu.

5. **Gestion langue incohérente selon les pages**
   - Certaines pages utilisent `currentLanguage`, d’autres `language`, d’autres `generalSettings.defaultLanguage`.
   - Impact: comportement imprévisible de la langue active selon l’écran.

## Priorité 3 — Dette technique / faux positifs UX

6. **Pages encore fortement mockées/simulées**
   - `categories`, `locations`, `data-management`, une partie `settings` et des modales user-management utilisent encore des mocks + délais artificiels.
   - Impact: l’application donne une impression “fonctionnelle” mais pas connectée au backend sur ces zones.

7. **Scanner camera simulé**
   - `CameraView` injecte un QR mock (`PRD-2024-001`) après timeout.
   - Tant qu’il n’y a pas une vraie lecture caméra, c’est un faux workflow.

## Priorité 4 — Qualité produit

8. **Incohérences de persistences settings/thème**
   - Multiples points de lecture/écriture localStorage (settings, theme, language) avec schémas différents.
   - Risque: dérive d’état (préférences qui “sautent” ou divergent selon la page).

---

## Recommandation de plan de correction

1. Brancher `qr-scanner` sur un vrai lookup produit (SKU/ID), remplacer `mockProduct`.
2. Rendre la responsivité produits pilotée par état (`useResponsive`) et non `window.innerWidth` direct dans le JSX.
3. Implémenter un bus/contrat clair pour `QuickActionBar` (recherche globale réelle).
4. Centraliser un utilitaire `safeJsonParse` et l’appliquer partout en lecture localStorage.
5. Unifier la source de vérité langue/thème/settings.
6. Prioriser le remplacement des mocks par services backend: `categories` → `locations` → `settings`/`data-management`.
