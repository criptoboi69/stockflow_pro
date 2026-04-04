import React, { useEffect, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import InlineFeedback from '../../../components/ui/InlineFeedback';
import { useTheme } from '../../../hooks/useTheme';
import settingsService from '../../../services/settingsService';

const UserPreferencesTab = ({ currentTenant, companies, onSwitchCompany, onSave, user, profile }) => {
  const { theme, changeTheme } = useTheme();

  const [preferences, setPreferences] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      avatar: ''
    },
    interface: {
      theme: 'light',
      timeFormat: '24h',
      density: 'comfortable'
    },
    dashboard: {
      defaultView: 'grid',
      itemsPerPage: 20,
      showWelcomeMessage: true,
      autoRefresh: true,
      refreshInterval: 30
    }
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [feedback, setFeedback] = useState(null);

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

  const companyOptions = companies?.map((company) => ({
    value: company?.company_id,
    label: company?.company_name,
    badge: company?.is_primary ? 'Principal' : null
  })) || [];

  useEffect(() => {
    const splitFullName = (fullName = '') => {
      const normalized = String(fullName || '').trim();
      if (!normalized) return { firstName: '', lastName: '' };
      const parts = normalized.split(/\s+/);
      return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || ''
      };
    };

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const currentCompany = companies?.find((c) => c?.company_name === currentTenant);
        if (currentCompany) setSelectedCompanyId(currentCompany?.company_id);

        if (!user?.id) {
          setLoadingProfile(false);
          return;
        }

        const { data, error } = await settingsService.getUserPreferences(user.id);
        if (error) throw error;

        const dbPreferences = data?.preferences || {};
        const dbNameParts = splitFullName(data?.full_name);
        const profileNameParts = splitFullName(profile?.full_name);

        const resolvedFirstName = data?.first_name || dbNameParts.firstName || profile?.first_name || profileNameParts.firstName || '';
        const resolvedLastName = data?.last_name || dbNameParts.lastName || profile?.last_name || profileNameParts.lastName || '';

        const next = {
          personalInfo: {
            firstName: resolvedFirstName,
            lastName: resolvedLastName,
            email: data?.email || user?.email || '',
            phone: data?.phone || profile?.phone || '',
            avatar: data?.avatar_url || profile?.avatar_url || ''
          },
          interface: {
            theme: dbPreferences?.interface?.theme || theme || 'light',
            timeFormat: dbPreferences?.interface?.timeFormat || '24h',
            density: dbPreferences?.interface?.density || 'comfortable'
          },
          dashboard: {
            defaultView: dbPreferences?.dashboard?.defaultView || 'grid',
            itemsPerPage: dbPreferences?.dashboard?.itemsPerPage || 20,
            showWelcomeMessage: dbPreferences?.dashboard?.showWelcomeMessage ?? true,
            autoRefresh: dbPreferences?.dashboard?.autoRefresh ?? true,
            refreshInterval: dbPreferences?.dashboard?.refreshInterval || 30
          }
        };

        setPreferences(next);
      } catch (error) {
        logger.error('Error loading user profile:', error);
        setFeedback({ type: 'error', message: error?.message || 'Erreur lors du chargement du profil.' });
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user?.id, user?.email, profile?.first_name, profile?.last_name, profile?.full_name, profile?.phone, profile?.avatar_url, currentTenant, companies, theme]);

  const markChanged = () => {
    setHasChanges(true);
    setFeedback(null);
  };

  const handleCompanyChange = async (companyId) => {
    setSelectedCompanyId(companyId);
    if (onSwitchCompany) await onSwitchCompany(companyId);
    setHasChanges(false);
  };

  const handlePersonalInfoChange = (field, value) => {
    setPreferences((prev) => ({
      ...prev,
      personalInfo: { ...prev?.personalInfo, [field]: value }
    }));
    markChanged();
  };

  const handleInterfaceChange = (field, value) => {
    setPreferences((prev) => ({
      ...prev,
      interface: { ...prev?.interface, [field]: value }
    }));
    if (field === 'theme') changeTheme(value);
    markChanged();
  };

  const handleDashboardChange = (field, value) => {
    setPreferences((prev) => ({
      ...prev,
      dashboard: { ...prev?.dashboard, [field]: value }
    }));
    markChanged();
  };

  const handleAvatarUpload = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file || !user?.id) return;

    setUploadingAvatar(true);
    try {
      const { data, error } = await settingsService.uploadAvatar(user.id, file);
      if (error) throw error;
      handlePersonalInfoChange('avatar', data);
      setFeedback({ type: 'success', message: 'Avatar uploadé avec succès.' });
    } catch (error) {
      logger.error('Error uploading avatar:', error);
      setFeedback({ type: 'error', message: error?.message || "Erreur lors de l'upload de l'avatar." });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      setFeedback({ type: 'error', message: 'Aucun utilisateur connecté.' });
      return;
    }

    setIsSaving(true);
    try {
      await onSave('preferences', {
        profile: {
          firstName: preferences?.personalInfo?.firstName,
          lastName: preferences?.personalInfo?.lastName,
          phone: preferences?.personalInfo?.phone,
          avatar: preferences?.personalInfo?.avatar
        },
        preferences: {
          interface: preferences?.interface,
          dashboard: preferences?.dashboard
        }
      });
      setHasChanges(false);
      setFeedback({ type: 'success', message: 'Informations personnelles sauvegardées.' });
    } catch (error) {
      logger.error('Error saving preferences:', error);
      setFeedback({ type: 'error', message: error?.message || 'Erreur lors de la sauvegarde.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const splitFullName = (fullName = '') => {
      const normalized = String(fullName || '').trim();
      if (!normalized) return { firstName: '', lastName: '' };
      const parts = normalized.split(/\s+/);
      return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || ''
      };
    };

    setHasChanges(false);
    setFeedback(null);
    if (user?.id) {
      setLoadingProfile(true);
      try {
        const { data } = await settingsService.getUserPreferences(user.id);
        const dbPreferences = data?.preferences || {};
        const dbNameParts = splitFullName(data?.full_name);
        const profileNameParts = splitFullName(profile?.full_name);
        setPreferences({
          personalInfo: {
            firstName: data?.first_name || dbNameParts.firstName || profile?.first_name || profileNameParts.firstName || '',
            lastName: data?.last_name || dbNameParts.lastName || profile?.last_name || profileNameParts.lastName || '',
            email: data?.email || user?.email || '',
            phone: data?.phone || profile?.phone || '',
            avatar: data?.avatar_url || profile?.avatar_url || ''
          },
          interface: {
            theme: dbPreferences?.interface?.theme || theme || 'light',
            timeFormat: dbPreferences?.interface?.timeFormat || '24h',
            density: dbPreferences?.interface?.density || 'comfortable'
          },
          dashboard: {
            defaultView: dbPreferences?.dashboard?.defaultView || 'grid',
            itemsPerPage: dbPreferences?.dashboard?.itemsPerPage || 20,
            showWelcomeMessage: dbPreferences?.dashboard?.showWelcomeMessage ?? true,
            autoRefresh: dbPreferences?.dashboard?.autoRefresh ?? true,
            refreshInterval: dbPreferences?.dashboard?.refreshInterval || 30
          }
        });
      } finally {
        setLoadingProfile(false);
      }
    }
  };

  const handleExportPreferences = () => {
    const dataStr = JSON.stringify(preferences, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'preferences.json';
    link.click();
  };

  if (loadingProfile) {
    return <div className="rounded-lg border border-border bg-card p-6 text-text-muted">Chargement du profil...</div>;
  }

  return (
    <div className="space-y-8">
      <InlineFeedback type={feedback?.type} message={feedback?.message} />

      <div className="bg-card rounded-lg border border-border p-6 theme-transition">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="User" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Informations personnelles</h3>
            <p className="text-sm text-text-muted">Profil lié au compte connecté</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-border/70 bg-background/60 p-3">
            <div className="text-xs text-text-muted">Compte connecté</div>
            <div className="mt-1 text-sm font-medium text-text-primary">{user?.email || preferences?.personalInfo?.email || '—'}</div>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/60 p-3">
            <div className="text-xs text-text-muted">Entreprise active</div>
            <div className="mt-1 text-sm font-medium text-text-primary">{currentTenant || '—'}</div>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/60 p-3">
            <div className="text-xs text-text-muted">ID utilisateur</div>
            <div className="mt-1 text-sm font-medium text-text-primary truncate">{user?.id || '—'}</div>
          </div>
        </div>

        {(!preferences?.personalInfo?.firstName && !preferences?.personalInfo?.lastName) && (
          <div className="mb-4 rounded-lg border border-warning/20 bg-warning/5 p-3 text-sm text-text-muted">
            Le profil connecté n’a pas encore de prénom/nom clairement renseigné dans <span className="font-medium text-text-primary">user_profiles</span>.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 bg-muted">
                  {preferences?.personalInfo?.avatar ? (
                    <img src={preferences?.personalInfo?.avatar} alt="Avatar utilisateur" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted">
                      <Icon name="User" size={42} />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                  {uploadingAvatar ? <Icon name="Loader2" size={16} className="text-primary-foreground animate-spin" /> : <Icon name="Camera" size={16} className="text-primary-foreground" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </label>
              </div>
              <p className="text-xs text-text-muted text-center">Compte : {preferences?.personalInfo?.email || user?.email || '—'}</p>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Prénom"
              value={preferences?.personalInfo?.firstName}
              onChange={(e) => handlePersonalInfoChange('firstName', e?.target?.value)}
              placeholder="Non renseigné"
              description={!preferences?.personalInfo?.firstName ? 'Aucune valeur enregistrée pour le moment.' : undefined}
            />
            <Input
              label="Nom"
              value={preferences?.personalInfo?.lastName}
              onChange={(e) => handlePersonalInfoChange('lastName', e?.target?.value)}
              placeholder="Non renseigné"
              description={!preferences?.personalInfo?.lastName ? 'Aucune valeur enregistrée pour le moment.' : undefined}
            />
            <Input label="Email" value={preferences?.personalInfo?.email} disabled description="Lié au compte connecté" />
            <Input
              label="Téléphone"
              value={preferences?.personalInfo?.phone}
              onChange={(e) => handlePersonalInfoChange('phone', e?.target?.value)}
              placeholder="Non renseigné"
              description={!preferences?.personalInfo?.phone ? 'Ajoute un numéro si tu veux le retrouver ici.' : undefined}
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 theme-transition">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Icon name="LayoutDashboard" size={20} className="text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Affichage personnel</h3>
            <p className="text-sm text-text-muted">Préférences de vue propres à ton compte</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Select label="Format d'heure" options={timeFormatOptions} value={preferences?.interface?.timeFormat} onChange={(value) => handleInterfaceChange('timeFormat', value)} />
          <Select label="Densité d'affichage" options={densityOptions} value={preferences?.interface?.density} onChange={(value) => handleInterfaceChange('density', value)} />
          <Select label="Vue par défaut" options={viewOptions} value={preferences?.dashboard?.defaultView} onChange={(value) => handleDashboardChange('defaultView', value)} />
          <Select label="Éléments par page" options={itemsPerPageOptions} value={preferences?.dashboard?.itemsPerPage} onChange={(value) => handleDashboardChange('itemsPerPage', Number(value))} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Select label="Rafraîchissement automatique" options={refreshIntervalOptions} value={preferences?.dashboard?.refreshInterval} onChange={(value) => handleDashboardChange('refreshInterval', Number(value))} />
          <div className="flex items-end">
            <Checkbox label="Afficher le message de bienvenue" checked={preferences?.dashboard?.showWelcomeMessage} onChange={(e) => handleDashboardChange('showWelcomeMessage', e?.target?.checked)} />
          </div>
        </div>
      </div>

      {companyOptions?.length > 1 && (
        <div className="bg-card rounded-lg border border-border p-6 theme-transition">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <Icon name="Building2" size={20} className="text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Entreprise active</h3>
              <p className="text-sm text-text-muted">Changer rapidement d'entreprise</p>
            </div>
          </div>
          <Select label="Entreprise" options={companyOptions} value={selectedCompanyId} onChange={handleCompanyChange} />
        </div>
      )}

      <div className="bg-card rounded-lg border border-border p-6 theme-transition">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Sauvegarde</h3>
            <p className="text-sm text-text-muted">Sauvegarder ou exporter tes préférences</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExportPreferences} iconName="Download" iconPosition="left">Exporter</Button>
            <Button variant="outline" onClick={handleReset}>Réinitialiser</Button>
            <Button onClick={handleSave} loading={isSaving} disabled={!hasChanges} iconName="Save" iconPosition="left">Sauvegarder</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreferencesTab;
