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

  const handleTestWebhook = async () => {
    if (!settings?.webhookSettings?.url) {
      setFeedback({ type: 'error', message: 'Ajoute une URL webhook avant le test.' });
      return;
    }

    setTestingWebhook(true);
    try {
      const response = await fetch(settings.webhookSettings.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'settings.webhook.test',
          sentAt: new Date().toISOString(),
          companyId: currentCompanyId,
          payload: { ok: true, source: 'stockflow-settings' }
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setFeedback({ type: 'success', message: 'Test webhook envoyé avec succès.' });
    } catch (error) {
      console.error('Webhook test failed:', error);
      setFeedback({ type: 'error', message: `Erreur lors du test du webhook: ${error?.message || 'inconnue'}` });
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
      setFeedback({ type: 'success', message: 'Notifications sauvegardées.' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setFeedback({ type: 'error', message: error?.message || 'Erreur lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (currentCompanyId) {
      const { data } = await settingsService.getCompanySettings(currentCompanyId);
      if (data?.notifications) {
        setSettings((prev) => ({ ...prev, ...data.notifications }));
        setHasChanges(false);
      setFeedback({ type: 'success', message: 'Notifications sauvegardées.' });
        return;
      }
    }
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    setHasChanges(false);
  };

  return (
    <div className="space-y-8">
      <InlineFeedback type={feedback?.type} message={feedback?.message} />
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
          <Input label="Seuil de stock faible" type="number" value={settings?.lowStockThreshold}
            onChange={(e) => handleSettingChange('lowStockThreshold', parseInt(e?.target?.value || '0', 10))} min="0" />
          <Input label="Seuil de stock critique" type="number" value={settings?.criticalStockThreshold}
            onChange={(e) => handleSettingChange('criticalStockThreshold', parseInt(e?.target?.value || '0', 10))} min="0" />
        </div>
      </div>

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
          <Checkbox label="Alertes de stock faible" checked={settings?.emailNotifications?.lowStock} onChange={(e) => handleEmailNotificationChange('lowStock', e?.target?.checked)} />
          <Checkbox label="Mouvements de stock" checked={settings?.emailNotifications?.stockMovements} onChange={(e) => handleEmailNotificationChange('stockMovements', e?.target?.checked)} />
          <Checkbox label="Résumé quotidien" checked={settings?.emailNotifications?.dailyDigest} onChange={(e) => handleEmailNotificationChange('dailyDigest', e?.target?.checked)} />
          <Checkbox label="Rapport hebdomadaire" checked={settings?.emailNotifications?.weeklyReport} onChange={(e) => handleEmailNotificationChange('weeklyReport', e?.target?.checked)} />
          <Checkbox label="Alertes système" checked={settings?.emailNotifications?.systemAlerts} onChange={(e) => handleEmailNotificationChange('systemAlerts', e?.target?.checked)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select label="Fréquence des notifications" options={frequencyOptions} value={settings?.notificationFrequency} onChange={(value) => handleSettingChange('notificationFrequency', value)} />
          <div className="space-y-4">
            <Checkbox label="Activer les heures de silence" checked={settings?.quietHours?.enabled} onChange={(e) => handleQuietHoursChange('enabled', e?.target?.checked)} />
            {settings?.quietHours?.enabled && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <Input label="Début" type="time" value={settings?.quietHours?.startTime} onChange={(e) => handleQuietHoursChange('startTime', e?.target?.value)} />
                <Input label="Fin" type="time" value={settings?.quietHours?.endTime} onChange={(e) => handleQuietHoursChange('endTime', e?.target?.value)} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
            <Icon name="Webhook" size={20} className="text-secondary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Webhook</h3>
            <p className="text-sm text-text-muted">Envoyer certains événements vers une URL externe</p>
          </div>
        </div>

        <div className="space-y-4">
          <Checkbox label="Activer les webhooks" checked={settings?.webhookSettings?.enabled} onChange={(e) => handleWebhookSettingChange('enabled', e?.target?.checked)} />
          <Input label="URL du webhook" type="url" placeholder="https://..." value={settings?.webhookSettings?.url} onChange={(e) => handleWebhookSettingChange('url', e?.target?.value)} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Checkbox label="Alertes stock" checked={settings?.webhookSettings?.events?.stockAlert} onChange={(e) => handleWebhookEventChange('stockAlert', e?.target?.checked)} />
            <Checkbox label="Mise à jour produit" checked={settings?.webhookSettings?.events?.productUpdate} onChange={(e) => handleWebhookEventChange('productUpdate', e?.target?.checked)} />
            <Checkbox label="Activité utilisateur" checked={settings?.webhookSettings?.events?.userActivity} onChange={(e) => handleWebhookEventChange('userActivity', e?.target?.checked)} />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleTestWebhook} loading={testingWebhook}>Tester le webhook</Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border">
        <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>Annuler</Button>
        <Button variant="default" onClick={handleSave} loading={isSaving} disabled={!hasChanges}>Sauvegarder les notifications</Button>
      </div>
    </div>
  );
};

export default NotificationSettingsTab;
