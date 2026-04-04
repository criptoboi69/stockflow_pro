import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import QuickActionBar from '../../components/ui/QuickActionBar';
import GeneralParametersTab from './components/GeneralParametersTab';
import NotificationSettingsTab from './components/NotificationSettingsTab';

import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/logger';
import UserPreferencesTab from './components/UserPreferencesTab';
import settingsService from '../../services/settingsService';

const Settings = () => {
  const { currentRole, currentCompany, companies, switchCompany, user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const tabs = [
    {
      id: 'general',
      label: 'Paramètres généraux',
      icon: 'Settings',
      description: 'Configuration système et préférences globales',
      roles: ['super_admin', 'administrator', 'manager', 'user']
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: 'Bell',
      description: 'Alertes, emails et intégrations webhook',
      roles: ['super_admin', 'administrator', 'manager', 'user']
    },

    {
      id: 'preferences',
      label: 'Préférences utilisateur',
      icon: 'User',
      description: 'Personnalisation de l\'interface et du profil',
      roles: ['super_admin', 'administrator', 'manager', 'user']
    }
  ];

  useEffect(() => {
    const savedTimestamp = localStorage.getItem('settingsLastSaved');
    if (savedTimestamp) {
      setLastSaved(new Date(savedTimestamp));
    }
  }, []);

  const hasAccess = (roles) => {
    if (!currentRole) return false;
    return roles?.includes(currentRole);
  };

  const accessibleTabs = tabs?.filter((tab) => hasAccess(tab?.roles));

  useEffect(() => {
    if (!accessibleTabs?.some((tab) => tab?.id === activeTab) && accessibleTabs?.length > 0) {
      setActiveTab(accessibleTabs?.[0]?.id);
    }
  }, [accessibleTabs, activeTab]);

  const handleSave = async (section, data) => {
    try {
      if (section === 'general' && currentCompany?.id) {
        const { error } = await settingsService.updateCompanySettings(currentCompany.id, 'general', data);
        if (error) throw error;
      } else if (section === 'preferences' && user?.id) {
        const { error } = await settingsService.updateUserPreferences(user.id, data);
        if (error) throw error;
      } else {
        localStorage.setItem(`settings_${section}`, JSON.stringify(data));
      }
      const now = new Date();
      setLastSaved(now);
      localStorage.setItem('settingsLastSaved', now?.toISOString());
      return { success: true };
    } catch (error) {
      logger.error('Error saving settings:', error);
      throw error;
    }
  };

  const handleExportAllSettings = () => {
    const allSettings = {
      general: JSON.parse(localStorage.getItem('settings_general') || '{}'),
      notifications: JSON.parse(localStorage.getItem('settings_notifications') || '{}'),

      preferences: JSON.parse(localStorage.getItem('settings_preferences') || '{}'),
      exportedAt: new Date()?.toISOString(),
      userRole: currentRole,
      tenant: currentCompany?.name
    };

    const dataStr = JSON.stringify(allSettings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stockflow-settings-${new Date()?.toISOString()?.split('T')?.[0]}.json`;
    link?.click();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralParametersTab userRole={currentRole} currentCompanyId={currentCompany?.id} onSave={handleSave} />;
      case 'notifications':
        return <NotificationSettingsTab userRole={currentRole} currentCompanyId={currentCompany?.id} onSave={handleSave} />;
      case 'companies':
        return <CompanyManagementTab userRole={currentRole} onSave={handleSave} />;
      case 'preferences':
        return <UserPreferencesTab
          userRole={currentRole}
          currentTenant={currentCompany?.name}
          companies={companies}
          onSwitchCompany={switchCompany}
          profile={profile}
          user={user}
          onSave={handleSave}
        />;
      default:
        return <GeneralParametersTab userRole={currentRole} currentCompanyId={currentCompany?.id} onSave={handleSave} />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Paramètres - StockFlow Pro</title>
        <meta name="description" content="Configuration système, notifications et préférences utilisateur pour StockFlow Pro" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {/* Main Sidebar Navigation */}
        <SidebarNavigation
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          userRole={currentRole}
          currentTenant={currentCompany?.name || 'StockFlow Pro'}
        />

        {/* Main Content */}
        <main className={`transition-all duration-200 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-72'} pt-14 sm:pt-16 lg:pt-0`}>
          <PageHeader
            title="Paramètres"
            subtitle="Configuration système et préférences utilisateur"
            icon={<Icon name="Settings" size={24} className="text-primary" />}
            actions={
              <>
                {lastSaved && (
                  <div className="hidden lg:flex items-center space-x-2 text-sm text-text-muted">
                    <Icon name="Clock" size={16} />
                    <span>
                      Dernière sauvegarde: {lastSaved?.toLocaleDateString('fr-FR')} {lastSaved?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAllSettings}
                  iconName="Download"
                  iconPosition="left"
                  className="hidden sm:flex text-xs lg:text-sm"
                >
                  Exporter la configuration
                </Button>
              </>
            }
          />

          <div className="px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
            {/* Horizontal Tabs */}
            <div className="border-b border-border">
              <nav className="flex space-x-1 overflow-x-auto">
                {accessibleTabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`
                      flex items-center space-x-2 px-4 py-3 border-b-2 transition-all duration-200 whitespace-nowrap
                      ${activeTab === tab?.id
                        ? 'border-primary text-primary font-medium' :'border-transparent text-text-muted hover:text-text-primary hover:border-border'}
                    `}
                  >
                    <Icon name={tab?.icon} size={18} />
                    <span>{tab?.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-3 sm:p-6 lg:p-8">
            {renderTabContent()}
          </div>
        </main>

        {/* Quick Action Bar */}
        <QuickActionBar />
      </div>
    </>
  );
};

export default Settings;