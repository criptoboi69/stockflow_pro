import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';
import adminConsoleService from '../../../services/adminConsoleService';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-text-muted hover:text-text-primary hover:bg-muted'
    }`}
  >
    <Icon name={icon} size={16} />
    {label}
  </button>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
    <span className="text-sm text-text-muted">{label}</span>
    <span className="text-sm font-medium text-text-primary">{value || '—'}</span>
  </div>
);

const CompanyDetail = () => {
  const { companyId } = useParams();
  const { currentRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadCompanyDetail = async () => {
      try {
        setLoading(true);
        const data = await adminConsoleService.getCompanyDetail(companyId);
        setCompany(data);
      } catch (error) {
        logger.error('Company detail load error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCompanyDetail();
  }, [companyId]);

  const tabs = [
    { id: 'overview', icon: 'FileText', label: 'Vue d\'ensemble' },
    { id: 'users', icon: 'Users', label: `Utilisateurs (${company?.users?.length || 0})` },
    { id: 'products', icon: 'Package', label: `Produits (${company?.productCount || 0})` },
    { id: 'locations', icon: 'MapPin', label: `Locations (${company?.locationCount || 0})` },
    { id: 'activity', icon: 'Clock', label: 'Activité' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-muted">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="text-error mx-auto mb-4" />
          <p className="text-text-primary font-medium">Entreprise non trouvée</p>
          <Link to="/admin-console/companies" className="text-primary hover:underline mt-2 inline-block">
            ← Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = {
    active: { color: 'text-success', label: 'Actif' },
    inactive: { color: 'text-text-muted', label: 'Inactif' },
    suspended: { color: 'text-error', label: 'Suspendu' },
  };

  const status = statusConfig[company?.status] || statusConfig.inactive;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={company?.name}
        subtitle={`Gestion de l'entreprise ${company?.name}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/admin-console/companies"
              className="text-sm text-text-muted hover:text-text-primary flex items-center gap-1"
            >
              <Icon name="ArrowLeft" size={16} />
              Retour
            </Link>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {/* Header Card */}
        <div className="rounded-xl border border-border bg-surface p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon name="Building2" size={32} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">{company?.name}</h1>
                <p className="text-sm text-text-muted mt-1">
                  ID: {company?.id} • Créé le {new Date(company?.created_at)?.toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full bg-muted ${status.color}`}>
              {status.label}
            </span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-3xl font-bold text-text-primary">{company?.userCount || 0}</p>
              <p className="text-xs text-text-muted mt-1">Utilisateurs</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-3xl font-bold text-text-primary">{company?.productCount || 0}</p>
              <p className="text-xs text-text-muted mt-1">Produits</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-3xl font-bold text-text-primary">{company?.locationCount || 0}</p>
              <p className="text-xs text-text-muted mt-1">Locations</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-3xl font-bold text-text-primary">{company?.movementCount || 0}</p>
              <p className="text-xs text-text-muted mt-1">Mouvements</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              icon={tab.icon}
              label={tab.label}
            />
          ))}
        </div>

        {/* Tab Content */}
        <div className="rounded-xl border border-border bg-surface p-6">
          {activeTab === 'overview' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Informations générales</h3>
              <InfoRow label="Nom" value={company?.name} />
              <InfoRow label="ID" value={company?.id} />
              <InfoRow label="Statut" value={status.label} />
              <InfoRow label="Date de création" value={new Date(company?.created_at)?.toLocaleDateString('fr-FR')} />
              <InfoRow label="Dernière modification" value={new Date(company?.updated_at)?.toLocaleDateString('fr-FR')} />
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Utilisateurs</h3>
                <Button variant="default" size="sm" iconName="UserPlus" iconPosition="left">
                  Ajouter un utilisateur
                </Button>
              </div>
              {company?.users?.length === 0 ? (
                <div className="text-center py-8">
                  <Icon name="Users" size={48} className="text-text-muted mx-auto mb-4" />
                  <p className="text-text-muted">Aucun utilisateur dans cette entreprise</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {company.users.map((user) => (
                    <div key={user?.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon name="User" size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{user?.email}</p>
                          <p className="text-xs text-text-muted">Rôle: {user?.role}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Gérer</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="text-center py-8">
              <Icon name="Package" size={48} className="text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">Liste des produits (à implémenter)</p>
            </div>
          )}

          {activeTab === 'locations' && (
            <div className="text-center py-8">
              <Icon name="MapPin" size={48} className="text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">Liste des locations (à implémenter)</p>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="text-center py-8">
              <Icon name="Clock" size={48} className="text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">Historique d'activité (à implémenter)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;
