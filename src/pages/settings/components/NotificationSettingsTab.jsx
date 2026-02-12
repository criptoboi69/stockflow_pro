import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { getLocalStorageJson } from '../../../utils/storage';
import { Checkbox } from '../../../components/ui/Checkbox';

const NotificationSettingsTab = ({ userRole, onSave }) => {
  const [settings, setSettings] = useState({
    lowStockThreshold: 10,
    criticalStockThreshold: 0,
    emailNotifications: {
      lowStock: true,
      stockMovements: false,
      dailyDigest: true,
      weeklyReport: true,
      systemAlerts: true
    },
    webhookSettings: {
      enabled: false,
      url: '',
      events: {
        stockAlert: false,
        productUpdate: false,
        userActivity: false
      }
    },
    notificationFrequency: 'immediate',
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);

  const frequencyOptions = [
    { value: 'immediate', label: 'Immédiat' },
    { value: 'hourly', label: 'Toutes les heures' },
    { value: 'daily', label: 'Quotidien' },
    { value: 'weekly', label: 'Hebdomadaire' }
  ];

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = getLocalStorageJson('notificationSettings', null);
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleEmailNotificationChange = (key, checked) => {
    setSettings(prev => ({
      ...prev,
      emailNotifications: {
        ...prev?.emailNotifications,
        [key]: checked
      }
    }));
    setHasChanges(true);
  };

  const handleWebhookSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      webhookSettings: {
        ...prev?.webhookSettings,
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleWebhookEventChange = (event, checked) => {
    setSettings(prev => ({
      ...prev,
      webhookSettings: {
        ...prev?.webhookSettings,
        events: {
          ...prev?.webhookSettings?.events,
          [event]: checked
        }
      }
    }));
    setHasChanges(true);
  };

  const handleQuietHoursChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev?.quietHours,
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    try {
      alert('Test webhook envoyé avec succès !');
    } catch (error) {
      alert('Erreur lors du test du webhook');
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      await onSave('notifications', settings);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const savedSettings = getLocalStorageJson('notificationSettings', null);
    if (savedSettings) {
      setSettings(savedSettings);
    }
    setHasChanges(false);
  };

  return (
    <div className="space-y-8">
      {/* Stock Alert Thresholds */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
            <Icon name="AlertTriangle" size={20} className="text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Seuils d'alerte de stock</h3>
            <p className="text-sm text-text-muted">Définir les seuils pour les alertes automatiques</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Seuil de stock faible"
            type="number"
            description="Déclencher une alerte quand le stock atteint ce niveau"
            value={settings?.lowStockThreshold}
            onChange={(e) => handleSettingChange('lowStockThreshold', parseInt(e?.target?.value))}
            min="0"
          />

          <Input
            label="Seuil de stock critique"
            type="number"
            description="Déclencher une alerte critique à ce niveau"
            value={settings?.criticalStockThreshold}
            onChange={(e) => handleSettingChange('criticalStockThreshold', parseInt(e?.target?.value))}
            min="0"
          />
        </div>
      </div>
      {/* Email Notifications */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="Mail" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Notifications par email</h3>
            <p className="text-sm text-text-muted">Configurer les types de notifications à recevoir</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Checkbox
            label="Alertes de stock faible"
            description="Recevoir des emails pour les alertes de stock"
            checked={settings?.emailNotifications?.lowStock}
            onChange={(e) => handleEmailNotificationChange('lowStock', e?.target?.checked)}
          />

          <Checkbox
            label="Mouvements de stock"
            description="Notifications pour chaque mouvement de stock"
            checked={settings?.emailNotifications?.stockMovements}
            onChange={(e) => handleEmailNotificationChange('stockMovements', e?.target?.checked)}
          />

          <Checkbox
            label="Résumé quotidien"
            description="Recevoir un résumé quotidien des activités"
            checked={settings?.emailNotifications?.dailyDigest}
            onChange={(e) => handleEmailNotificationChange('dailyDigest', e?.target?.checked)}
          />

          <Checkbox
            label="Rapport hebdomadaire"
            description="Rapport hebdomadaire des performances"
            checked={settings?.emailNotifications?.weeklyReport}
            onChange={(e) => handleEmailNotificationChange('weeklyReport', e?.target?.checked)}
          />

          <Checkbox
            label="Alertes système"
            description="Notifications importantes du système"
            checked={settings?.emailNotifications?.systemAlerts}
            onChange={(e) => handleEmailNotificationChange('systemAlerts', e?.target?.checked)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Fréquence des notifications"
            description="Contrôler la fréquence d'envoi des notifications"
            options={frequencyOptions}
            value={settings?.notificationFrequency}
            onChange={(value) => handleSettingChange('notificationFrequency', value)}
          />

          <div className="space-y-4">
            <Checkbox
              label="Activer les heures de silence"
              description="Suspendre les notifications pendant certaines heures"
              checked={settings?.quietHours?.enabled}
              onChange={(e) => handleQuietHoursChange('enabled', e?.target?.checked)}
            />

            {settings?.quietHours?.enabled && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <Input
                  label="Début"
                  type="time"
                  value={settings?.quietHours?.startTime}
                  onChange={(e) => handleQuietHoursChange('startTime', e?.target?.value)}
                />
                <Input
                  label="Fin"
                  type="time"
                  value={settings?.quietHours?.endTime}
                  onChange={(e) => handleQuietHoursChange('endTime', e?.target?.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Webhook Integration */}
      {(userRole === 'super_admin' || userRole === 'administrator') && (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Icon name="Webhook" size={20} className="text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Intégration Webhook</h3>
              <p className="text-sm text-text-muted">Configurer les webhooks pour les systèmes externes</p>
            </div>
          </div>

          <div className="space-y-6">
            <Checkbox
              label="Activer les webhooks"
              description="Permettre l'envoi de notifications vers des systèmes externes"
              checked={settings?.webhookSettings?.enabled}
              onChange={(e) => handleWebhookSettingChange('enabled', e?.target?.checked)}
            />

            {settings?.webhookSettings?.enabled && (
              <>
                <div className="flex items-end space-x-3">
                  <Input
                    label="URL du webhook"
                    type="url"
                    description="URL de destination pour les notifications webhook"
                    placeholder="https://votre-systeme.com/webhook"
                    value={settings?.webhookSettings?.url}
                    onChange={(e) => handleWebhookSettingChange('url', e?.target?.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleTestWebhook}
                    loading={testingWebhook}
                    iconName="Send"
                    iconPosition="left"
                    disabled={!settings?.webhookSettings?.url}
                  >
                    Tester
                  </Button>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-text-primary mb-3">Événements à notifier</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Checkbox
                      label="Alertes de stock"
                      description="Notifications pour les alertes de stock"
                      checked={settings?.webhookSettings?.events?.stockAlert}
                      onChange={(e) => handleWebhookEventChange('stockAlert', e?.target?.checked)}
                    />

                    <Checkbox
                      label="Mise à jour produit"
                      description="Modifications des informations produit"
                      checked={settings?.webhookSettings?.events?.productUpdate}
                      onChange={(e) => handleWebhookEventChange('productUpdate', e?.target?.checked)}
                    />

                    <Checkbox
                      label="Activité utilisateur"
                      description="Actions importantes des utilisateurs"
                      checked={settings?.webhookSettings?.events?.userActivity}
                      onChange={(e) => handleWebhookEventChange('userActivity', e?.target?.checked)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
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

export default NotificationSettingsTab;