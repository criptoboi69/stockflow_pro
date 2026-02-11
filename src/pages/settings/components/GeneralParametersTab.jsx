import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { useAuth } from '../../../contexts/AuthContext';

const GeneralParametersTab = ({ userRole, onSave }) => {
  const { isAdministrator, isManager } = useAuth();
  const [settings, setSettings] = useState({
    timezone: 'Europe/Brussels',
    dashboardVisibility: {
      totalProducts: true,
      stockAlerts: true,
      recentMovements: true,
      lowStockItems: true
    },
    digestTiming: '08:00',
    digestFrequency: 'daily',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'european',
    defaultLanguage: 'fr',
    showPrices: true
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const timezoneOptions = [
    { value: 'Europe/Brussels', label: 'Europe/Brussels (GMT+1)' },
    { value: 'Europe/Paris', label: 'Europe/Paris (GMT+1)' },
    { value: 'Europe/London', label: 'Europe/London (GMT+0)' },
    { value: 'Europe/Berlin', label: 'Europe/Berlin (GMT+1)' },
    { value: 'Europe/Bucharest', label: 'Europe/Bucharest (GMT+2)' },
    { value: 'Europe/Warsaw', label: 'Europe/Warsaw (GMT+1)' },
    { value: 'UTC', label: 'UTC (GMT+0)' }
  ];

  const digestFrequencyOptions = [
    { value: 'daily', label: 'Quotidien' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuel' },
    { value: 'disabled', label: 'Désactivé' }
  ];

  const dateFormatOptions = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Européen)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (Américain)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' }
  ];

  const numberFormatOptions = [
    { value: 'european', label: '1 000,00 (Européen)' },
    { value: 'american', label: '1,000.00 (Américain)' }
  ];

  const languageOptions = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'ro', label: 'Română (Romanian)' },
    { value: 'pl', label: 'Polski (Polish)' }
  ];

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('generalSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleVisibilityChange = (key, checked) => {
    setSettings(prev => ({
      ...prev,
      dashboardVisibility: {
        ...prev?.dashboardVisibility,
        [key]: checked
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage and call parent save function
      localStorage.setItem('generalSettings', JSON.stringify(settings));
      await onSave('general', settings);
      
      // Dispatch event to notify other components of settings change
      window.dispatchEvent(new CustomEvent('settingsChanged'));
      
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const savedSettings = localStorage.getItem('generalSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    setHasChanges(false);
  };

  return (
    <div className="space-y-8">
      {/* Timezone Configuration */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="Clock" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Configuration du fuseau horaire</h3>
            <p className="text-sm text-text-muted">Définir le fuseau horaire par défaut pour l'application</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Fuseau horaire"
            description="Utilisé pour l'affichage des dates et heures"
            options={timezoneOptions}
            value={settings?.timezone}
            onChange={(value) => handleSettingChange('timezone', value)}
          />

          <Input
            label="Heure du digest quotidien"
            type="time"
            description="Heure d'envoi du résumé quotidien"
            value={settings?.digestTiming}
            onChange={(e) => handleSettingChange('digestTiming', e?.target?.value)}
          />
        </div>
      </div>

      {/* Dashboard Visibility */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Icon name="LayoutDashboard" size={20} className="text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Visibilité du tableau de bord</h3>
            <p className="text-sm text-text-muted">Contrôler quels éléments sont affichés sur le tableau de bord</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Checkbox
            label="Nombre total de produits"
            description="Afficher le widget du nombre total de produits"
            checked={settings?.dashboardVisibility?.totalProducts}
            onChange={(e) => handleVisibilityChange('totalProducts', e?.target?.checked)}
          />

          <Checkbox
            label="Alertes de stock"
            description="Afficher le widget des alertes de stock"
            checked={settings?.dashboardVisibility?.stockAlerts}
            onChange={(e) => handleVisibilityChange('stockAlerts', e?.target?.checked)}
          />

          <Checkbox
            label="Mouvements récents"
            description="Afficher la liste des mouvements récents"
            checked={settings?.dashboardVisibility?.recentMovements}
            onChange={(e) => handleVisibilityChange('recentMovements', e?.target?.checked)}
          />

          <Checkbox
            label="Articles en rupture"
            description="Afficher la liste des articles en rupture"
            checked={settings?.dashboardVisibility?.lowStockItems}
            onChange={(e) => handleVisibilityChange('lowStockItems', e?.target?.checked)}
          />
        </div>
      </div>

      {/* Price Display Settings - Only visible for Administrators and Managers */}
      {(isAdministrator() || isManager()) && (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Icon name="DollarSign" size={20} className="text-warning" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Affichage des prix</h3>
              <p className="text-sm text-text-muted">Contrôler l'affichage des prix dans l'application</p>
            </div>
          </div>

          <div className="space-y-4">
            <Checkbox
              label="Afficher les prix des produits"
              description="Affiche ou masque les prix dans les cartes de produits, tableaux et autres vues de produits"
              checked={settings?.showPrices}
              onChange={(e) => handleSettingChange('showPrices', e?.target?.checked)}
            />
            
            {!settings?.showPrices && (
              <div className="bg-info/10 border border-info/20 rounded-lg p-3 flex items-start space-x-2">
                <Icon name="Info" size={16} className="text-info mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Prices cachés</p>
                  <p className="text-xs text-text-muted">Les prix ne seront pas visibles dans l'interface utilisateur. Cette option est utile pour les environnements où la confidentialité des prix est requise.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Format Settings */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
            <Icon name="Settings2" size={20} className="text-secondary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Formats d'affichage</h3>
            <p className="text-sm text-text-muted">Personnaliser les formats de date, nombre et langue</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Select
            label="Fréquence du digest"
            description="Fréquence d'envoi des résumés par email"
            options={digestFrequencyOptions}
            value={settings?.digestFrequency}
            onChange={(value) => handleSettingChange('digestFrequency', value)}
          />

          <Select
            label="Format de date"
            description="Format d'affichage des dates"
            options={dateFormatOptions}
            value={settings?.dateFormat}
            onChange={(value) => handleSettingChange('dateFormat', value)}
          />

          <Select
            label="Format des nombres"
            description="Format d'affichage des nombres"
            options={numberFormatOptions}
            value={settings?.numberFormat}
            onChange={(value) => handleSettingChange('numberFormat', value)}
          />

          <Select
            label="Langue par défaut"
            description="Langue de l'interface utilisateur"
            options={languageOptions}
            value={settings?.defaultLanguage}
            onChange={(value) => handleSettingChange('defaultLanguage', value)}
            className="md:col-span-2 lg:col-span-1"
          />
        </div>

        {/* Language Preview */}
        {settings?.defaultLanguage && settings?.defaultLanguage !== 'fr' && (
          <div className="mt-4 bg-success/10 border border-success/20 rounded-lg p-3 flex items-start space-x-2">
            <Icon name="Globe" size={16} className="text-success mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-primary">Langue sélectionnée</p>
              <p className="text-xs text-text-muted">
                L'interface sera affichée en {
                  settings?.defaultLanguage === 'en' ? 'anglais' :
                  settings?.defaultLanguage === 'ro' ? 'roumain' :
                  settings?.defaultLanguage === 'pl' ? 'polonais' : 'français'
                } après sauvegarde.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex items-center justify-between bg-warning/10 border border-warning/20 rounded-lg p-4">
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
    </div>
  );
};

export default GeneralParametersTab;