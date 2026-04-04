# 🔍 AUDIT PAGE PAR PAGE — LOGIN

**Date:** 4 avril 2026 — 17:15 CET  
**Page:** `/login`  
**Fichier:** `src/pages/login/index.jsx` + `src/pages/login/components/LoginForm.jsx`

---

## 📊 ÉTAT ACTUEL

### Fonctionnalités présentes

| Feature | Statut | Notes |
|---------|--------|-------|
| Connexion email/mot de passe | ✅ OK | Fonctionnel |
| Inscription email/mot de passe | ✅ OK | Avec confirmation email |
| Connexion Google OAuth | ⚠️ À SUPPRIMER | Non désiré |
| Toggle FR/EN | ✅ OK | LocalStorage |
| Comptes démo (quick select) | ✅ OK | 4 comptes pré-remplis |
| Remember me | ✅ OK | Checkbox |
| Forgot password | ✅ OK | Lien vers `/forgot-password` |
| Show/hide password | ✅ OK | Toggle eye icon |

### Structure des fichiers

```
src/pages/login/
├── index.jsx              # Wrapper page (layout, footer, badges)
├── components/
│   ├── LoginForm.jsx      # Formulaire principal (14.9 KB)
│   ├── CredentialsHelper.jsx  # Comptes démo (15.7 KB)
│   └── SecurityBadges.jsx # Badges sécurité (1.8 KB)
```

---

## ⚠️ PROBLÈMES IDENTIFIÉS

### 1. Connexion Google à supprimer
**Fichier:** `LoginForm.jsx` (lignes ~240-255)

**Code actuel:**
```jsx
<Button
  type="button"
  variant="outline"
  onClick={handleGoogleSignIn}
  loading={isLoading}
  fullWidth
  className="h-12 mb-4"
>
  <Icon name="Chrome" size={20} className="mr-2" />
  {t?.googleButton}
</Button>
```

**Action:** ❌ Supprimer + nettoyer `signInWithGoogle` du AuthContext

---

### 2. Inscription : pas d'option company ID
**Demande utilisateur :**
- ✅ Pouvoir rejoindre une société existante (entrer company ID)
- ✅ OU créer une nouvelle société

**État actuel:**
```javascript
const [formData, setFormData] = useState({
  email: '',
  password: '',
  fullName: '',
  rememberMe: false
});
```

**Manquant:**
- `companyId` (optionnel)
- `createNewCompany` (booléen)
- `companyName` (si création)

---

### 3. Autres points mineurs

| Point | Priorité | Action |
|-------|----------|--------|
| 33+ console.log dans AuthContext | Faible | ✅ Déjà optimisé avec logger |
| LocalStorage non sécurisé | Faible | ✅ Déjà corrigé avec safeStorage |
| Textes FR/EN hardcodés | Moyenne | Externaliser dans fichier i18n |
| Pas de validation mot de passe | Moyenne | Ajouter regex force mot de passe |

---

## ✅ CORRECTIONS PRÉVUES

### Phase 1 — Suppression Google OAuth

**Fichiers à modifier:**
1. `LoginForm.jsx` — Supprimer bouton + fonction `handleGoogleSignIn`
2. `AuthContext.jsx` — Garder fonction (peut servir ailleurs) mais non utilisée

---

### Phase 2 — Ajout options inscription

**Nouveau formulaire d'inscription:**

```
[ Nom complet ]
[ Email ]
[ Mot de passe ]
[ Confirmer mot de passe ]

○ Rejoindre une société existante
  [ ID de société (optionnel) ]
  
○ Créer une nouvelle société
  [ Nom de la société ]
```

**Champs à ajouter:**
```javascript
const [signupMode, setSignupMode] = useState('create'); // 'create' | 'join'
const [formData, setFormData] = useState({
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  companyId: '',        // Pour 'join'
  companyName: '',      // Pour 'create'
  rememberMe: false
});
```

**Logique:**
- Si `signupMode === 'join'` + `companyId` → Associer user à company existante
- Si `signupMode === 'create'` + `companyName` → Créer company + associer user

---

## 📋 CHECKLIST

| Item | Statut | Priorité |
|------|--------|----------|
| Supprimer bouton Google | ❌ À faire | Haute |
| Ajouter option "Rejoindre société" | ❌ À faire | Haute |
| Ajouter option "Créer société" | ❌ À faire | Haute |
| Validation company ID (format UUID) | ❌ À faire | Moyenne |
| API: Rejoindre company existante | ❌ À faire | Haute |
| API: Créer nouvelle company | ❌ À faire | Haute |
| Messages d'erreur appropriés | ❌ À faire | Moyenne |
| Tests manuels | ❌ À faire | Haute |

---

## 🔧 IMPLÉMENTATION

**Prochaines étapes:**
1. Modifier `LoginForm.jsx` (suppression Google + nouveaux champs)
2. Mettre à jour `AuthContext.jsx` (fonctions signUp avec company)
3. Créer/mettre à jour services (`companyService.js`)
4. Tests manuels

---

*Audit réalisé par codex-dev le 4 avril 2026 à 17:15 CET*
