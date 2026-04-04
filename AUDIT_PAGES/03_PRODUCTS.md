# 🔍 AUDIT PAGE PAR PAGE — PRODUCTS

**Date:** 4 avril 2026 — 19:45 CET  
**Page:** `/products`  
**Fichier:** `src/pages/products/index.jsx` + 7 composants

---

## 📊 ÉTAT ACTUEL

### Fonctionnalités présentes

| Feature | Statut | Notes |
|---------|--------|-------|
| **Liste produits** | ✅ OK | Table + Carte (responsive) |
| **Vue Table** | ✅ OK | Tri, checkbox, actions |
| **Vue Carte** | ✅ OK | Mobile-friendly |
| **Filtres** | ✅ OK | Status, catégorie, recherche |
| **Recherche** | ✅ OK | Nom, SKU, catégorie |
| **Tri** | ✅ OK | Nom, catégorie, quantité, prix |
| **Pagination** | ✅ OK | 25/50/100 par page |
| **Modal View** | ✅ OK | Détails produit |
| **Modal Edit** | ✅ OK | Modification produit |
| **Modal Add** | ✅ OK | Création produit |
| **QR Generator** | ✅ OK | Modal dédié |
| **Stock Movement** | ✅ OK | Modal ajout mouvement |
| **Upload images** | ✅ OK | Multi-images (max 5) |
| **Temps réel** | ✅ OK | Subscription Supabase |
| **Notifications** | ✅ OK | Click → modal (localStorage) |

### Structure des fichiers

```
src/pages/products/
├── index.jsx                  # Page principale (650+ lignes)
└── components/
    ├── ProductFilters.jsx     # Filtres (3.1 KB)
    ├── ProductActions.jsx     # Actions bulk (3.9 KB)
    ├── ProductTable.jsx       # Vue table (11.2 KB)
    ├── ProductCard.jsx        # Vue carte (5.2 KB)
    ├── ProductModal.jsx       # Modal CRUD (31 KB)
    ├── ProductPagination.jsx  # Pagination (2.9 KB)
    └── QRCodeGenerator.jsx    # Générateur QR (16.8 KB)
```

---

## ✅ POINTS FORTS

### 1. Architecture propre
- ✅ **Composants modulaires** (7 composants spécialisés)
- ✅ **Services séparés** (productService, categoryService, etc.)
- ✅ **Hooks réutilisables** (useResponsive, useCompanySettings)
- ✅ **Temps réel** (useRealtimeSubscription)

### 2. Expérience utilisateur
- ✅ **Responsive** (Table desktop / Carte mobile)
- ✅ **Feedback visuel** (loading, errors, badges status)
- ✅ **Actions rapides** (overlay sur cartes)
- ✅ **Multi-images** (jusqu'à 5 images par produit)

### 3. Gestion des permissions
```javascript
const canSeePrices = isAdministrator() || isManager();
const showPrices = canSeePrices && settings?.showPrices !== false;
```
- ✅ Prix masqués pour les users standards
- ✅ Settings-based (companySettings)

### 4. Temps réel
```javascript
useRealtimeSubscription({
  table: 'products',
  filter: { column: 'company_id', value: currentCompany?.id },
  onInsert: (newProduct) => { /* camelCase conversion */ },
  onUpdate: (updatedProduct) => { /* update in list */ },
  onDelete: (deletedProduct) => { /* remove from list */ }
});
```
- ✅ Insertions, updates, deletions en temps réel
- ✅ Conversion snake_case → camelCase automatique

---

## ⚠️ PROBLÈMES IDENTIFIÉS

### 1. Page index.jsx trop lourde
**Fichier:** `index.jsx` (650+ lignes)

**Problème:**
- ❌ **650+ lignes** dans un seul fichier
- ❌ **15+ states** différents
- ❌ **8+ useEffect** imbriqués
- ❌ Difficile à maintenir

**Solution:**
```javascript
// Extraire dans un hook personnalisé
const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const loadProducts = async () => { /* ... */ };
  const deleteProduct = async (id) => { /* ... */ };
  
  return { products, loading, loadProducts, deleteProduct };
};
```

**Priorité:** Moyenne (fonctionne bien actuellement)

---

### 2. ProductModal trop complexe
**Fichier:** `ProductModal.jsx` (31 KB, 750+ lignes)

**Problème:**
- ❌ **750+ lignes** dans un seul composant
- ❌ **Gestion images** complexe (upload, preview, lightbox)
- ❌ **QR Generator** intégré (devrait être séparé)
- ❌ **15+ states** internes

**Solution:**
```
ProductModal/
├── ProductModal.jsx       # Wrapper (50 lignes)
├── ProductForm.jsx        # Formulaire (200 lignes)
├── ProductImages.jsx      # Gestion images (150 lignes)
├── ProductQRModal.jsx     # QR generator (100 lignes)
└── ProductActions.jsx     # Actions (50 lignes)
```

**Priorité:** Moyenne (fonctionne bien actuellement)

---

### 3. Console.log restants
**Fichiers concernés:**

| Fichier | Count | Lignes |
|---------|-------|--------|
| `index.jsx` | 2 | 122, 147 |
| `ProductModal.jsx` | 3 | ~350, ~400, ~500 |

**Exemple:**
```javascript
console.error('[Products] Error loading categories:', error);
console.error('Error loading product metadata:', error);
```

**Action:** Remplacer par `logger.error()`

**Priorité:** Faible

---

### 4. Tri non persisté dans l'URL
**État actuel:**
```javascript
const [sortField, setSortField] = useState('name');
const [sortDirection, setSortDirection] = useState('asc');
```

**Problème:**
- ❌ Tri perdu au refresh de la page
- ❌ Non partageable via URL

**Solution:**
```javascript
const [sortField, setSortField] = useState(
  searchParams?.get('sort') || 'name'
);
const [sortDirection, setSortDirection] = useState(
  searchParams?.get('order') || 'asc'
);
```

**Priorité:** Faible

---

### 5. Pagination non persistée dans l'URL
**État actuel:**
```javascript
const [currentPage, setCurrentPage] = useState(
  parseInt(searchParams?.get('page')) || 1
);
const [pageSize, setPageSize] = useState(
  parseInt(searchParams?.get('pageSize')) || 25
);
```

**Problème:**
- ✅ Page URL persistée (déjà fait)
- ⚠️ PageSize non persisté

**Solution:**
```javascript
// Déjà partiellement implémenté
setSearchParams({ ...params, page: newPage, pageSize: newSize });
```

**Priorité:** Faible

---

### 6. SelectedProducts non persisté
**État actuel:**
```javascript
const [selectedProducts, setSelectedProducts] = useState([]);
```

**Problème:**
- ❌ Sélection perdue au refresh
- ❌ Actions bulk impossibles après refresh

**Solution:**
```javascript
// localStorage ou URL params
const savedSelection = localStorage.getItem('selectedProducts');
const [selectedProducts, setSelectedProducts] = useState(
  savedSelection ? JSON.parse(savedSelection) : []
);
```

**Priorité:** Faible

---

### 7. Upload images — Debug code
**Fichier:** `ProductModal.jsx`

**Code présent:**
```javascript
const [uploadDebug, setUploadDebug] = useState('');
// ...
setUploadDebug('Starting upload...');
```

**Problème:**
- ⚠️ Code de debug en prod
- ⚠️ Variables inutilisées

**Action:** Supprimer ou entourer de `if (DEV)`

**Priorité:** Faible

---

## 📋 CHECKLIST

| Item | Statut | Priorité |
|------|--------|----------|
| Refactor index.jsx (useProducts) | ❌ À faire | Moyenne |
| Split ProductModal | ❌ À faire | Moyenne |
| Remplacer console.log par logger | ❌ À faire | Faible |
| Tri dans URL | ❌ À faire | Faible |
| PageSize dans URL | ❌ À faire | Faible |
| SelectedProducts persisté | ❌ À faire | Faible |
| Cleanup debug code | ❌ À faire | Faible |
| Tests manuels CRUD | ⏳ À faire | Haute |
| Tests responsive | ⏳ À faire | Haute |

---

## 🔧 CORRECTIONS PRÉVUES

### Phase 1 — Nettoyage (Semaine 1)

**1. Remplacer console.log:**
```javascript
import { logger } from '../../utils/logger';

logger.error('[Products] Error loading categories:', error);
```

**2. Cleanup debug code:**
```javascript
// Supprimer:
const [uploadDebug, setUploadDebug] = useState('');
```

### Phase 2 — Refactor (Semaine 2)

**1. Extraire useProducts:**
```javascript
// hooks/useProducts.js
export const useProducts = (companyId) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const loadProducts = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const data = await productService.getProducts(companyId);
    setProducts(data);
    setLoading(false);
  }, [companyId]);
  
  return { products, loading, loadProducts };
};
```

**2. Split ProductModal:**
```
ProductModal.jsx (50 lignes)
  ↓
  ├── ProductForm.jsx
  ├── ProductImages.jsx
  └── ProductQRModal.jsx
```

### Phase 3 — Améliorations (Semaine 3)

**1. Tri + Pagination URL:**
```javascript
useEffect(() => {
  const params = new URLSearchParams(searchParams);
  params.set('sort', sortField);
  params.set('order', sortDirection);
  setSearchParams(params);
}, [sortField, sortDirection]);
```

**2. SelectedProducts localStorage:**
```javascript
useEffect(() => {
  localStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
}, [selectedProducts]);
```

---

## 📈 MÉTRIQUES PERFORMANCE

| Métrique | Valeur | Cible |
|----------|--------|-------|
| **Taille index.jsx** | 650+ lignes | < 300 |
| **Taille ProductModal** | 750+ lignes | < 300 |
| **Nombre de states** | 15+ | < 10 |
| **Nombre useEffect** | 8+ | < 5 |
| **Composants** | 7 | ✅ OK |
| **Services** | 3 | ✅ OK |
| **Bundle impact** | ~50 KB | ✅ OK |

---

## 🎯 RECOMMANDATIONS

### Semaine 1 — Corrections critiques
1. **Logger** — Remplacer console.log
2. **Debug cleanup** — Supprimer code inutilisé
3. **Tests manuels** — CRUD complet

### Semaine 2 — Refactor
1. **useProducts hook** — Extraire logique
2. **Split ProductModal** — 3-4 composants
3. **Tests** — Vérifier refactor

### Semaine 3 — Améliorations UX
1. **Tri URL** — Persistance
2. **SelectedProducts** — localStorage
3. **Keyboard shortcuts** — Ctrl+F search, etc.

---

## 🔍 DETAIL PAR COMPOSANT

### 1. ProductFilters.jsx (3.1 KB)
**État:** ✅ Bon
**Fonctionnalités:**
- Recherche textuelle
- Filtre status (all, in_stock, low_stock, out_of_stock)
- Filtre catégorie
- Sync URL params

**Amélioration possible:**
- ✅ RAS

---

### 2. ProductTable.jsx (11.2 KB)
**État:** ✅ Bon
**Fonctionnalités:**
- Tri colonnes
- Checkbox sélection
- Actions (view, edit, QR, movement)
- Responsive (masqué sur mobile)

**Amélioration possible:**
- ⚠️ Colonnes non persistées (quelles colonnes afficher)

---

### 3. ProductCard.jsx (5.2 KB)
**État:** ✅ Bon
**Fonctionnalités:**
- Vue mobile
- Image + status badge
- Quick actions overlay
- Responsive

**Amélioration possible:**
- ✅ RAS

---

### 4. ProductModal.jsx (31 KB)
**État:** ⚠️ Trop lourd
**Fonctionnalités:**
- View/Edit/Add modes
- Multi-images upload
- QR generator
- Categories + locations

**Amélioration nécessaire:**
- ❌ Split en sous-composants
- ❌ Cleanup debug code

---

### 5. QRCodeGenerator.jsx (16.8 KB)
**État:** ✅ Bon
**Fonctionnalités:**
- Génération QR
- Preview
- Print/Download
- Bulk generation

**Amélioration possible:**
- ✅ RAS

---

### 6. ProductPagination.jsx (2.9 KB)
**État:** ✅ Bon
**Fonctionnalités:**
- Page navigation
- Page size selector
- Sync URL params

**Amélioration possible:**
- ✅ RAS

---

### 7. ProductActions.jsx (3.9 KB)
**État:** ✅ Bon
**Fonctionnalités:**
- Bulk actions
- Export CSV
- Delete multiple

**Amélioration possible:**
- ✅ RAS

---

*Audit réalisé par codex-dev le 4 avril 2026 à 19:45 CET*
