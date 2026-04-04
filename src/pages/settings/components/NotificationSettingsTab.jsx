import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import InlineFeedback from '../../../components/ui/InlineFeedback';
import settingsService from '../../../services/settingsService';

const NotificationSettingsTab = ({ userRole, onSave, currentCompanyId }) => {
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
  const [feedback, setFeedback] = useState(null);

  const frequencyOptions = [
    { value: 'immediate', label: 'Immédiat' },
    { value: 'hourly', label: 'Toutes les heures' },
    { value: 'daily', label: 'Quotidien' },
    { value: 'weekly', label: 'Hebdomadaire' }
  ];

  useEffect(() => {
    const load = async () => {
      if (currentCompanyId) {
        const { data } = await settingsService.getCompanySettings(currentCompanyId);
        if (data?.notifications) {
          setSettings((prev) => ({ ...prev, ...data.notifications }));
          return;
        }
      }
      const savedSettings = localStorage.getItem('notificationSettings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    };
    load();
  }, [currentCompanyId]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setFeedback(null);
  };

  const handleEmailNotificationChange = (key, checked) => {
    setSettings(prev => ({
      ...prev,
      emailNotifications: { ...prev?.emailNotifications, [key]: checked }
    }));
    setHasChanges(true);
  };

  const handleWebhookSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      webhookSettings: { ...prev?.webhookSettings, [key]: value }
    }));
    setHasChanges(true);
  };

  const handleWebhookEventChange = (event, checked) => {
    setSettings(prev => ({
      ...prev,
      webhookSettings: {
        ...prev?.webhookSettings,
        events: { ...prev?.webhookSettings?.events, [event]: checked }
      }
    }));
    setHasChanges(true);
  };

  const handleQuietHoursChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      quietHours: { ...prev?.quietHours, [key]: value }
    }));
    setHasChanges(true);
  };

  const handleThresholdChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: parseInt(value, 10) || 0
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);

    try {
      await onSave({ notifications: settings });
      setHasChanges(false);
      setFeedback({ type: 'success', message: 'Paramètres enregistrés avec succès.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'Échec de l\'enregistrement.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    setFeedback(null);

    try {
      const response = await fetch(settings?.webhookSettings?.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, message: 'Test de notification StockFlow' })
      });

      if (!response.ok) throw new Error('Webhook unreachable');

      setFeedback({ type: 'success', message: 'Webhook test réussi !' });
    } catch (error) {
      setFeedback({ type: 'error', message: 'Échec du test webhook. Vérifiez l\'URL.' });
    } finally {
      setTestingWebhook(false);
    }
  };

  // Card Component
  const SettingsCard = ({ icon, title, description, children, className = '' }) => (
    <div className={`bg-surface border border-border rounded-xl p-5 shadow-sm ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
          <Icon name={icon} size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          {description && <p className="text-sm text-text-muted mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Notifications</h2>
          <p className="text-sm text-text-muted mt-1">
            Configurez vos préférences de notification pour rester informé
          </p>
        </div>
        <Button
          variant="default"
          onClick={handleSave}
          loading={isSaving}
          disabled={!hasChanges}
          className="min-w-[120px]"
        >
          <Icon name="Save" size={16} className="mr-2" />
          Enregistrer
        </Button>
      </div>

      {/* Feedback */}
      {feedback && (
        <InlineFeedback type={feedback.type} message={feedback.message} />
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Notifications */}
        <SettingsCard
          icon="Mail"
          title="Notifications Email"
          description="Recevez des alertes et rapports par email"
        >
          <div className="space-y-3">
            {[
              { key: 'lowStock', label: 'Alertes stock faible', desc: 'Quand un produit atteint le seuil critique' },
              { key: 'stockMovements', label: 'Mouvements de stock', desc: 'À chaque entrée ou sortie de stock' },
              { key: 'dailyDigest', label: 'Récapitulatif quotidien', desc: 'Résumé des activités de la journée' },
              { key: 'weeklyReport', label: 'Rapport hebdomadaire', desc: 'Bilan complet de la semaine' },
              { key: 'systemAlerts', label: 'Alertes système', desc: 'Maintenance et notifications importantes' }
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <Checkbox
                  checked={settings?.emailNotifications?.[key]}
                  onChange={(e) => handleEmailNotificationChange(key, e?.target?.checked)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-primary">{label}</div>
                  <div className="text-xs text-text-muted mt-0.5">{desc}</div>
                </div>
              </label>
            ))}
          </div>
        </SettingsCard>

        {/* Stock Thresholds */}
        <SettingsCard
          icon="AlertTriangle"
          title="Seuils de Stock"
          description="Définissez les niveaux d'alerte pour vos stocks"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Seuil d'alerte stock faible
              </label>
              <Input
                type="number"
                min="0"
                value={settings?.lowStockThreshold || 10}
                onChange={(e) => handleThresholdChange('lowStockThreshold', e?.target?.value)}
                placeholder="ex: 10"
                className="w-full"
              />
              <p className="text-xs text-text-muted mt-1.5">
                Alertes déclenchées quand le stock atteint cette valeur
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Seuil critique (rupture)
              </label>
              <Input
                type="number"
                min="0"
                value={settings?.criticalStockThreshold || 0}
                onChange={(e) => handleThresholdChange('criticalStockThreshold', e?.target?.value)}
                placeholder="ex: 0"
                className="w-full"
              />
              <p className="text-xs text-text-muted mt-1.5">
                Alertes urgentes quand le stock atteint ce niveau
              </p>
            </div>
          </div>
        </SettingsCard>

        {/* Webhook Settings */}
        <SettingsCard
          icon="Webhook"
          title="Webhook"
          description="Intégrez StockFlow avec vos outils externes"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <Checkbox
                  checked={settings?.webhookSettings?.enabled}
                  onChange={(e) => handleWebhookSettingChange('enabled', e?.target?.checked)}
                />
                <span className="text-sm font-medium text-text-primary">Activer le webhook</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  URL du webhook
                </label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={settings?.webhookSettings?.url || ''}
                    onChange={(e) => handleWebhookSettingChange('url', e?.target?.value)}
                    placeholder="https://votre-app.com/webhook"
                    disabled={!settings?.webhookSettings?.enabled}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleTestWebhook}
                    loading={testingWebhook}
                    disabled={!settings?.webhookSettings?.enabled || !settings?.webhookSettings?.url}
                    className="shrink-0"
                  >
                    <Icon name="Wifi" size={16} className="mr-2" />
                    Tester
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Événements à notifier
              </label>
              <div className="space-y-2">
                {[
                  { key: 'stockAlert', label: 'Alertes stock' },
                  { key: 'productUpdate', label: 'Mises à jour produits' },
                  { key: 'userActivity', label: 'Activité utilisateurs' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <Checkbox
                      checked={settings?.webhookSettings?.events?.[key]}
                      onChange={(e) => handleWebhookEventChange(key, e?.target?.checked)}
                      disabled={!settings?.webhookSettings?.enabled}
                    />
                    <span className="text-sm text-text-primary">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </SettingsCard>

        {/* Quiet Hours */}
        <SettingsCard
          icon="Moon"
          title="Heures Calmes"
          description="Ne recevez pas de notifications pendant vos heures de repos"
        >
          <label className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border mb-4">
            <Checkbox
              checked={settings?.quietHours?.enabled}
              onChange={(e) => handleQuietHoursChange('enabled', e?.target?.checked)}
            />
            <span className="text-sm font-medium text-text-primary">Activer les heures calmes</span>
          </label>

          {settings?.quietHours?.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Début
                </label>
                <Input
                  type="time"
                  value={settings?.quietHours?.startTime || '22:00'}
                  onChange={(e) => handleQuietHoursChange('startTime', e?.target?.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Fin
                </label>
                <Input
                  type="time"
                  value={settings?.quietHours?.endTime || '08:00'}
                  onChange={(e) => handleQuietHoursChange('endTime', e?.target?.value)}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </SettingsCard>

        {/* Notification Frequency */}
        <SettingsCard
          icon="Clock"
          title="Fréquence"
          description="À quelle fréquence recevoir les notifications"
        >
          <Select
            options={frequencyOptions}
            value={settings?.notificationFrequency || 'immediate'}
            onChange={(e) => handleSettingChange('notificationFrequency', e?.target?.value)}
            className="w-full"
          />
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-text-muted">
                La fréquence s'applique aux notifications non-critiques. Les alertes urgentes sont toujours envoyées immédiatement.
              </p>
            </div>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
};

export default NotificationSettingsTab;
