import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { useTheme } from '../../../hooks/useTheme';
import { getLocalStorageJson } from '../../../utils/storage';

const UserPreferencesTab = ({ userRole, currentTenant, companies, onSwitchCompany, onSave }) => {
  const { theme, changeTheme, getCurrentTheme, isDark } = useTheme();
  
  const [preferences, setPreferences] = useState({
    personalInfo: {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@techcorp.fr',
      phone: '+33 1 23 45 67 89',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    interface: {
      theme: 'light',
      language: 'fr',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      density: 'comfortable'
    },
    dashboard: {
      defaultView: 'grid',
      itemsPerPage: 20,
      showWelcomeMessage: true,
      autoRefresh: true,
      refreshInterval: 30
    },
    notifications: {
      desktop: true,
      email: true,
      sound: false,
      frequency: 'immediate'
    }
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const themeOptions = [
    { 
      value: 'light', 
      label: 'Clair',
      description: 'Interface claire et lumineuse',
      icon: 'Sun'
    },
    { 
      value: 'dark', 
      label: 'Sombre',
      description: 'Interface sombre pour réduire la fatigue oculaire',
      icon: 'Moon'
    },
    { 
      value: 'auto', 
      label: 'Automatique',
      description: 'Suit les préférences de votre système',
      icon: 'Laptop'
    }
  ];

  const languageOptions = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' }
  ];

  const dateFormatOptions = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
  ];

  const timeFormatOptions = [
    { value: '24h', label: '24 heures' },
    { value: '12h', label: '12 heures (AM/PM)' }
  ];

  const densityOptions = [
    { value: 'compact', label: 'Compact' },
    { value: 'comfortable', label: 'Confortable' },
    { value: 'spacious', label: 'Spacieux' }
  ];

  const viewOptions = [
    { value: 'grid', label: 'Grille' },
    { value: 'list', label: 'Liste' },
    { value: 'cards', label: 'Cartes' }
  ];

  const itemsPerPageOptions = [
    { value: 10, label: '10 éléments' },
    { value: 20, label: '20 éléments' },
    { value: 50, label: '50 éléments' },
    { value: 100, label: '100 éléments' }
  ];

  const refreshIntervalOptions = [
    { value: 15, label: '15 secondes' },
    { value: 30, label: '30 secondes' },
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' }
  ];

  const frequencyOptions = [
    { value: 'immediate', label: 'Immédiat' },
    { value: 'hourly', label: 'Toutes les heures' },
    { value: 'daily', label: 'Quotidien' }
  ];

  const companyOptions = companies?.map(company => ({
    value: company?.company_id,
    label: company?.company_name,
    badge: company?.is_primary ? 'Principal' : null
  })) || [];

  useEffect(() => {
    // Load preferences from localStorage
    const parsed = getLocalStorageJson('userPreferences', null);
    if (parsed) {
      setPreferences(parsed);
      if (parsed?.interface?.theme && parsed?.interface?.theme !== theme) {
        changeTheme(parsed?.interface?.theme);
      }
    }

    const currentCompany = companies?.find(c => c?.company_name === currentTenant);
    if (currentCompany) {
      setSelectedCompanyId(currentCompany?.company_id);
    }
  }, [currentTenant, companies]);

  const handleCompanyChange = async (companyId) => {
    setSelectedCompanyId(companyId);
    if (onSwitchCompany) {
      await onSwitchCompany(companyId);
    }
    setHasChanges(false);
  };

  const handlePersonalInfoChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      personalInfo: {
        ...prev?.personalInfo,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleInterfaceChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      interface: {
        ...prev?.interface,
        [field]: value
      }
    }));
    setHasChanges(true);

    // Enhanced theme change handling
    if (field === 'theme') {
      changeTheme(value);
    }
  };

  const handleDashboardChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      dashboard: {
        ...prev?.dashboard,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleNotificationChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev?.notifications,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleAvatarUpload = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const localAvatarUrl = URL.createObjectURL(file);
      handlePersonalInfoChange('avatar', localAvatarUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      await onSave('preferences', preferences);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const parsed = getLocalStorageJson('userPreferences', null);
    if (parsed) {
      setPreferences(parsed);
      if (parsed?.interface?.theme) {
        changeTheme(parsed?.interface?.theme);
      }
    }
    setHasChanges(false);
  };

  const handleExportPreferences = () => {
    const dataStr = JSON.stringify(preferences, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'preferences.json';
    link?.click();
  };

  return (
    <div className="space-y-8">
      {/* Personal Information */}
      <div className="bg-card rounded-lg border border-border p-6 theme-transition">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="User" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Informations personnelles</h3>
            <p className="text-sm text-text-muted">Gérer vos informations de profil</p>
          </div>
        </div>

        <div className="flex items-start space-x-6 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
              <img
                src={preferences?.personalInfo?.avatar}
                alt="Professional headshot of user avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/assets/images/no_image.png';
                }}
              />
            </div>
            <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
              <Icon name="Camera" size={16} className="text-primary-foreground" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
            </label>
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Prénom"
              value={preferences?.personalInfo?.firstName}
              onChange={(e) => handlePersonalInfoChange('firstName', e?.target?.value)}
            />

            <Input
              label="Nom"
              value={preferences?.personalInfo?.lastName}
              onChange={(e) => handlePersonalInfoChange('lastName', e?.target?.value)}
            />

            <Input
              label="Email"
              type="email"
              value={preferences?.personalInfo?.email}
              onChange={(e) => handlePersonalInfoChange('email', e?.target?.value)}
            />

            <Input
              label="Téléphone"
              type="tel"
              value={preferences?.personalInfo?.phone}
              onChange={(e) => handlePersonalInfoChange('phone', e?.target?.value)}
            />
          </div>
        </div>
      </div>
      {/* Enhanced Interface Preferences with Theme Preview */}
      <div className="bg-card rounded-lg border border-border p-6 theme-transition">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Icon name="Palette" size={20} className="text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Préférences d'interface</h3>
            <p className="text-sm text-text-muted">Personnaliser l'apparence de l'application</p>
          </div>
        </div>

        {/* Theme Selection with Preview Cards */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-3">
            Thème de l'interface
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {themeOptions?.map((option) => (
              <div
                key={option?.value}
                onClick={() => handleInterfaceChange('theme', option?.value)}
                className={`
                  relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md
                  ${preferences?.interface?.theme === option?.value
                    ? 'border-primary bg-primary/5' :'border-border bg-muted/20 hover:border-border'
                  }
                `}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center
                    ${preferences?.interface?.theme === option?.value 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-text-muted'
                    }
                  `}>
                    <Icon name={option?.icon} size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{option?.label}</p>
                    <p className="text-xs text-text-muted">{option?.description}</p>
                  </div>
                </div>

                {/* Theme Preview */}
                <div className={`
                  mt-3 p-3 rounded border text-xs
                  ${option?.value === 'light' ? 'bg-white border-slate-200 text-slate-900' :
                    option?.value === 'dark'? 'bg-slate-800 border-slate-600 text-slate-50' : 'bg-gradient-to-r from-white via-slate-100 to-slate-800 border-slate-300 text-slate-700'
                  }
                `}>
                  <div className="flex items-center justify-between">
                    <span>Aperçu du thème</span>
                    {preferences?.interface?.theme === option?.value && (
                      <Icon name="Check" size={12} className="text-primary" />
                    )}
                  </div>
                </div>

                {/* Current theme indicator */}
                {preferences?.interface?.theme === option?.value && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Icon name="Check" size={12} className="text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Current effective theme info */}
          <div className="flex items-center space-x-2 text-sm text-text-muted">
            <Icon name="Info" size={16} />
            <span>
              Thème actuel: {getCurrentTheme() === 'dark' ? 'Sombre' : 'Clair'}
              {preferences?.interface?.theme === 'auto' && ' (automatique)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Select
            label="Langue"
            description="Langue de l'interface utilisateur"
            options={languageOptions}
            value={preferences?.interface?.language}
            onChange={(value) => handleInterfaceChange('language', value)}
          />

          <Select
            label="Format de date"
            description="Format d'affichage des dates"
            options={dateFormatOptions}
            value={preferences?.interface?.dateFormat}
            onChange={(value) => handleInterfaceChange('dateFormat', value)}
          />

          <Select
            label="Format d'heure"
            description="Format d'affichage de l'heure"
            options={timeFormatOptions}
            value={preferences?.interface?.timeFormat}
            onChange={(value) => handleInterfaceChange('timeFormat', value)}
          />

          <Select
            label="Densité d'affichage"
            description="Espacement des éléments"
            options={densityOptions}
            value={preferences?.interface?.density}
            onChange={(value) => handleInterfaceChange('density', value)}
          />
        </div>
      </div>
      {/* Dashboard Preferences */}
      <div className="bg-card rounded-lg border border-border p-6 theme-transition">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
            <Icon name="LayoutDashboard" size={20} className="text-secondary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Préférences du tableau de bord</h3>
            <p className="text-sm text-text-muted">Personnaliser l'affichage du tableau de bord</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Select
            label="Vue par défaut"
            description="Mode d'affichage préféré"
            options={viewOptions}
            value={preferences?.dashboard?.defaultView}
            onChange={(value) => handleDashboardChange('defaultView', value)}
          />

          <Select
            label="Éléments par page"
            description="Nombre d'éléments affichés"
            options={itemsPerPageOptions}
            value={preferences?.dashboard?.itemsPerPage}
            onChange={(value) => handleDashboardChange('itemsPerPage', value)}
          />

          <Select
            label="Intervalle de rafraîchissement"
            description="Fréquence de mise à jour automatique"
            options={refreshIntervalOptions}
            value={preferences?.dashboard?.refreshInterval}
            onChange={(value) => handleDashboardChange('refreshInterval', value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Checkbox
            label="Afficher le message de bienvenue"
            description="Afficher un message d'accueil sur le tableau de bord"
            checked={preferences?.dashboard?.showWelcomeMessage}
            onChange={(e) => handleDashboardChange('showWelcomeMessage', e?.target?.checked)}
          />

          <Checkbox
            label="Rafraîchissement automatique"
            description="Mettre à jour automatiquement les données"
            checked={preferences?.dashboard?.autoRefresh}
            onChange={(e) => handleDashboardChange('autoRefresh', e?.target?.checked)}
          />
        </div>
      </div>
      {/* Notification Preferences */}
      <div className="bg-card rounded-lg border border-border p-6 theme-transition">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
            <Icon name="Bell" size={20} className="text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Préférences de notification</h3>
            <p className="text-sm text-text-muted">Contrôler comment vous recevez les notifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Select
            label="Fréquence des notifications"
            description="À quelle fréquence recevoir les notifications"
            options={frequencyOptions}
            value={preferences?.notifications?.frequency}
            onChange={(value) => handleNotificationChange('frequency', value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Checkbox
            label="Notifications bureau"
            description="Afficher les notifications sur le bureau"
            checked={preferences?.notifications?.desktop}
            onChange={(e) => handleNotificationChange('desktop', e?.target?.checked)}
          />

          <Checkbox
            label="Notifications email"
            description="Recevoir des notifications par email"
            checked={preferences?.notifications?.email}
            onChange={(e) => handleNotificationChange('email', e?.target?.checked)}
          />

          <Checkbox
            label="Sons de notification"
            description="Jouer un son pour les notifications"
            checked={preferences?.notifications?.sound}
            onChange={(e) => handleNotificationChange('sound', e?.target?.checked)}
          />
        </div>
      </div>
      {/* Export/Import */}
      <div className="bg-card rounded-lg border border-border p-6 theme-transition">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
            <Icon name="Download" size={20} className="text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Sauvegarde des préférences</h3>
            <p className="text-sm text-text-muted">Exporter ou importer vos préférences</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleExportPreferences}
            iconName="Download"
            iconPosition="left"
          >
            Exporter les préférences
          </Button>
        </div>
      </div>
      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex items-center justify-between bg-warning/10 border border-warning/20 rounded-lg p-4 theme-transition">
          <div className="flex items-center space-x-3">
            <Icon name="AlertTriangle" size={20} className="text-warning" />
            <div>
              <p className="text-sm font-medium text-text-primary">Modifications non sauvegardées</p>
              <p className="text-xs text-text-muted">Vous avez des modifications en attente</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={handleReset}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              loading={isSaving}
              iconName="Save"
              iconPosition="left"
            >
              Sauvegarder
            </Button>
          </div>
        </div>
      )}

      {/* Company Selection - Only show if user has multiple companies */}
      {companies && companies?.length > 1 && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Société active</h3>
          <div className="space-y-4">
            <Select
              label="Sélectionner une société"
              value={selectedCompanyId}
              onChange={(e) => handleCompanyChange(e?.target?.value)}
              options={companies?.map(company => ({
                value: company?.company_id,
                label: company?.company_name
              }))}
            />
            {hasChanges && (
              <p className="text-sm text-info flex items-center gap-2">
                <Icon name="Info" size={16} />
                La société sera changée après sauvegarde
              </p>
            )}
          </div>
        </div>
      )}

      {/* Show current company info when user has only one company */}
      {companies && companies?.length === 1 && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Société</h3>
          <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="Building2" size={24} className="text-primary" />
            </div>
            <div>
              <p className="font-medium text-text-primary">{companies?.[0]?.company_name}</p>
              <p className="text-sm text-text-muted">Votre société</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPreferencesTab;