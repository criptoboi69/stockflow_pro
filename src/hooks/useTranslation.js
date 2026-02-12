import { useState, useEffect } from 'react';

const translations = {
  fr: {
    // Navigation & General
    'settings': 'Paramètres',
    'products': 'Produits',
    'dashboard': 'Tableau de bord',
    'categories': 'Catégories',
    'locations': 'Emplacements',
    'stock_movements': 'Mouvements de stock',
    'user_management': 'Gestion des utilisateurs',
    'data_management': 'Gestion des données',
    'qr_scanner': 'Scanner QR',
    'logout': 'Se déconnecter',
    
    // Product related
    'product_name': 'Nom du produit',
    'sku': 'SKU',
    'category': 'Catégorie',
    'location': 'Emplacement',
    'quantity': 'Quantité',
    'price': 'Prix',
    'status': 'Statut',
    'actions': 'Actions',
    'in_stock': 'En stock',
    'low_stock': 'Stock faible',
    'out_of_stock': 'Rupture de stock',
    'view': 'Voir',
    'edit': 'Modifier',
    'delete': 'Supprimer',
    'add_product': 'Ajouter un produit',
    
    // Settings
    'general_parameters': 'Paramètres généraux',
    'timezone_config': 'Configuration du fuseau horaire',
    'dashboard_visibility': 'Visibilité du tableau de bord',
    'display_formats': 'Formats d\'affichage',
    'price_display': 'Affichage des prix',
    'show_prices': 'Afficher les prix des produits',
    'hide_prices': 'Masquer les prix des produits',
    'language_settings': 'Paramètres de langue',
    'default_language': 'Langue par défaut',
    
    // Languages
    'french': 'Français',
    'english': 'Anglais',
    'romanian': 'Roumain',
    'polish': 'Polonais',
    
    // Common
    'save': 'Enregistrer',
    'cancel': 'Annuler',
    'close': 'Fermer',
    'loading': 'Chargement...',
    'success': 'Succès',
    'error': 'Erreur',
    'warning': 'Attention',
    'confirm': 'Confirmer',
    'yes': 'Oui',
    'no': 'Non'
  },
  
  en: {
    // Navigation & General
    'settings': 'Settings',
    'products': 'Products',
    'dashboard': 'Dashboard',
    'categories': 'Categories',
    'locations': 'Locations',
    'stock_movements': 'Stock Movements',
    'user_management': 'User Management',
    'data_management': 'Data Management',
    'qr_scanner': 'QR Scanner',
    'logout': 'Logout',
    
    // Product related
    'product_name': 'Product Name',
    'sku': 'SKU',
    'category': 'Category',
    'location': 'Location',
    'quantity': 'Quantity',
    'price': 'Price',
    'status': 'Status',
    'actions': 'Actions',
    'in_stock': 'In Stock',
    'low_stock': 'Low Stock',
    'out_of_stock': 'Out of Stock',
    'view': 'View',
    'edit': 'Edit',
    'delete': 'Delete',
    'add_product': 'Add Product',
    
    // Settings
    'general_parameters': 'General Parameters',
    'timezone_config': 'Timezone Configuration',
    'dashboard_visibility': 'Dashboard Visibility',
    'display_formats': 'Display Formats',
    'price_display': 'Price Display',
    'show_prices': 'Show Product Prices',
    'hide_prices': 'Hide Product Prices',
    'language_settings': 'Language Settings',
    'default_language': 'Default Language',
    
    // Languages
    'french': 'French',
    'english': 'English',
    'romanian': 'Romanian',
    'polish': 'Polish',
    
    // Common
    'save': 'Save',
    'cancel': 'Cancel',
    'close': 'Close',
    'loading': 'Loading...',
    'success': 'Success',
    'error': 'Error',
    'warning': 'Warning',
    'confirm': 'Confirm',
    'yes': 'Yes',
    'no': 'No'
  },
  
  ro: {
    // Navigation & General
    'settings': 'Setări',
    'products': 'Produse',
    'dashboard': 'Tablou de bord',
    'categories': 'Categorii',
    'locations': 'Locații',
    'stock_movements': 'Mișcări de stoc',
    'user_management': 'Gestionarea utilizatorilor',
    'data_management': 'Gestionarea datelor',
    'qr_scanner': 'Scaner QR',
    'logout': 'Deconectare',
    
    // Product related
    'product_name': 'Numele produsului',
    'sku': 'SKU',
    'category': 'Categoria',
    'location': 'Locația',
    'quantity': 'Cantitatea',
    'price': 'Preț',
    'status': 'Starea',
    'actions': 'Acțiuni',
    'in_stock': 'În stoc',
    'low_stock': 'Stoc redus',
    'out_of_stock': 'Stoc epuizat',
    'view': 'Vizualizare',
    'edit': 'Editare',
    'delete': 'Ștergere',
    'add_product': 'Adăugați produs',
    
    // Settings
    'general_parameters': 'Parametri generali',
    'timezone_config': 'Configurarea fusului orar',
    'dashboard_visibility': 'Vizibilitatea tabloului de bord',
    'display_formats': 'Formate de afișare',
    'price_display': 'Afișarea prețurilor',
    'show_prices': 'Afișați prețurile produselor',
    'hide_prices': 'Ascundeți prețurile produselor',
    'language_settings': 'Setări de limbă',
    'default_language': 'Limba implicită',
    
    // Languages
    'french': 'Franceză',
    'english': 'Engleză',
    'romanian': 'Română',
    'polish': 'Poloneză',
    
    // Common
    'save': 'Salvați',
    'cancel': 'Anulați',
    'close': 'Închideți',
    'loading': 'Se încarcă...',
    'success': 'Succes',
    'error': 'Eroare',
    'warning': 'Avertisment',
    'confirm': 'Confirmați',
    'yes': 'Da',
    'no': 'Nu'
  },
  
  pl: {
    // Navigation & General
    'settings': 'Ustawienia',
    'products': 'Produkty',
    'dashboard': 'Panel główny',
    'categories': 'Kategorie',
    'locations': 'Lokalizacje',
    'stock_movements': 'Ruchy magazynowe',
    'user_management': 'Zarządzanie użytkownikami',
    'data_management': 'Zarządzanie danymi',
    'qr_scanner': 'Skaner QR',
    'logout': 'Wyloguj się',
    
    // Product related
    'product_name': 'Nazwa produktu',
    'sku': 'SKU',
    'category': 'Kategoria',
    'location': 'Lokalizacja',
    'quantity': 'Ilość',
    'price': 'Cena',
    'status': 'Status',
    'actions': 'Akcje',
    'in_stock': 'Na stanie',
    'low_stock': 'Niski stan',
    'out_of_stock': 'Brak w magazynie',
    'view': 'Zobacz',
    'edit': 'Edytuj',
    'delete': 'Usuń',
    'add_product': 'Dodaj produkt',
    
    // Settings
    'general_parameters': 'Parametry ogólne',
    'timezone_config': 'Konfiguracja strefy czasowej',
    'dashboard_visibility': 'Widoczność panelu głównego',
    'display_formats': 'Formaty wyświetlania',
    'price_display': 'Wyświetlanie cen',
    'show_prices': 'Pokaż ceny produktów',
    'hide_prices': 'Ukryj ceny produktów',
    'language_settings': 'Ustawienia języka',
    'default_language': 'Język domyślny',
    
    // Languages
    'french': 'Francuski',
    'english': 'Angielski',
    'romanian': 'Rumuński',
    'polish': 'Polski',
    
    // Common
    'save': 'Zapisz',
    'cancel': 'Anuluj',
    'close': 'Zamknij',
    'loading': 'Ładowanie...',
    'success': 'Sukces',
    'error': 'Błąd',
    'warning': 'Ostrzeżenie',
    'confirm': 'Potwierdź',
    'yes': 'Tak',
    'no': 'Nie'
  }
};


const parseSettings = () => {
  const savedSettings = localStorage.getItem('generalSettings');
  if (!savedSettings) return null;

  try {
    return JSON.parse(savedSettings);
  } catch (error) {
    console.warn('[useTranslation] Invalid generalSettings in localStorage:', error);
    return null;
  }
};

const useTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const settings = parseSettings();
    return settings?.defaultLanguage || 'fr';
  });

  useEffect(() => {
    // Listen for settings changes
    const handleStorageChange = () => {
      const settings = parseSettings();
      if (!settings) return;

      const newLanguage = settings?.defaultLanguage || 'fr';
      if (newLanguage !== currentLanguage) {
        setCurrentLanguage(newLanguage);
      }
    };

    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from same tab
    window.addEventListener('settingsChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsChanged', handleStorageChange);
    };
  }, [currentLanguage]);

  const t = (key, defaultValue = key) => {
    return translations?.[currentLanguage]?.[key] || translations?.['fr']?.[key] || defaultValue;
  };

  const changeLanguage = (language) => {
    setCurrentLanguage(language);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('settingsChanged'));
  };

  const getCurrentLanguage = () => currentLanguage;
  
  const getAvailableLanguages = () => [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'ro', label: 'Română' },
    { value: 'pl', label: 'Polski' }
  ];

  return {
    t,
    currentLanguage,
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages
  };
};

export default useTranslation;