import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';
import adminConsoleService from '../../../services/adminConsoleService';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import InlineFeedback from '../../../components/ui/InlineFeedback';

const TabButton = ({ active, onClick, icon, label, count }) => (
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
    {count !== undefined && (
      <span className={`px-2 py-0.5 text-xs rounded-full ${active ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
        {count}
      </span>
    )}
  </button>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
    <span className="text-sm text-text-muted">{label}</span>
    <span className="text-sm font-medium text-text-primary">{value || '—'}</span>
  </div>
);

const UserRow = ({ user, companies, onRemove }) => {
  const userCompanies = companies.filter(c => c.user_id === user.id);
  
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon name="User" size={20} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{user?.email}</p>
          <p className="text-xs text-text-muted">
            {userCompanies.length} entreprise{userCompanies.length > 1 ? 's' : ''} • Rôle: {userCompanies[0]?.role}
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onRemove}>
        Retirer
      </Button>
    </div>
  );
};

const CompanyDetail = () => {
  const { companyId } = useParams();
  const { currentRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [allCompanies, setAllCompanies] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [feedback, setFeedback] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('user');

  const loadCompanyDetail = useCallback(async () => {
    try {
      setLoading(true);
      const [companyData, companiesData, usersData] = await Promise.all([
        adminConsoleService.getCompanyDetail(companyId),
        adminConsoleService.getCompaniesOverview(),
        adminConsoleService.getAllUsers()
      ]);
      setCompany(companyData);
      setAllCompanies(companiesData);
      setAllUsers(usersData);
    } catch (error) {
      logger.error('Company detail load error:', error);
      setFeedback({ type: 'error', message: 'Erreur lors du chargement des détails' });
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadCompanyDetail();
  }, [loadCompanyDetail]);

  const handleAddUser = async () => {
    if (!selectedUser) {
      setFeedback({ type: 'error', message: 'Veuillez sélectionner un utilisateur' });
      return;
    }

    try {
      await adminConsoleService.addUserToCompany(selectedUser, companyId, selectedRole);
      setFeedback({ type: 'success', message: 'Utilisateur ajouté avec succès' });
      setShowAddUser(false);
      setSelectedUser('');
      await loadCompanyDetail();
    } catch (error) {
      logger.error('Add user error:', error);
      setFeedback({ type: 'error', message: 'Erreur lors de l\'ajout de l\'utilisateur' });
    }
  };

  const handleRemoveUser = async (userId) => {
    try {
      await adminConsoleService.removeUserFromCompany(userId, companyId);
      setFeedback({ type: 'success', message: 'Utilisateur retiré avec succès' });
      await loadCompanyDetail();
    } catch (error) {
      logger.error('Remove user error:', error);
      setFeedback({ type: 'error', message: 'Erreur lors du retrait de l\'utilisateur' });
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = company?.status === 'active' ? 'inactive' : 'active';
    try {
      await adminConsoleService.updateCompanyStatus(companyId, newStatus);
      setFeedback({ type: 'success', message: `Entreprise ${newStatus === 'active' ? 'activée' : 'désactivée'}` });
      await loadCompanyDetail();
    } catch (error) {
      logger.error('Toggle status error:', error);
      setFeedback({ type: 'error', message: 'Erreur lors du changement de statut' });
    }
  };

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

  const companyUsers = company?.users || [];
  const usersWithoutCurrent = allUsers.filter(u => !companyUsers.find(cu => cu.id === u.id));
  const userOptions = usersWithoutCurrent.map(u => ({ value: u.id, label: u.email }));
  const roleOptions = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'administrator', label: 'Administrateur' },
    { value: 'manager', label: 'Manager' },
    { value: 'user', label: 'Utilisateur' },
  ];

  const tabs = [
    { id: 'overview', icon: 'FileText', label: 'Vue d\'ensemble' },
    { id: 'users', icon: 'Users', label: 'Utilisateurs', count: companyUsers.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={company?.name}
        subtitle={`Gestion de l'entreprise ${company?.name}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={company?.status === 'active' ? 'outline' : 'default'}
              size="sm"
              onClick={handleToggleStatus}
            >
              {company?.status === 'active' ? 'Désactiver' : 'Activer'}
            </Button>
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
        {feedback && (
          <div className="mb-6">
            <InlineFeedback type={feedback.type} message={feedback.message} />
          </div>
        )}

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
              count={tab.count}
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
                <h3 className="text-lg font-semibold text-text-primary">Utilisateurs ({companyUsers.length})</h3>
                <Button
                  variant="default"
                  size="sm"
                  iconName="UserPlus"
                  iconPosition="left"
                  onClick={() => setShowAddUser(!showAddUser)}
                >
                  {showAddUser ? 'Annuler' : 'Ajouter un utilisateur'}
                </Button>
              </div>

              {showAddUser && (
                <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
                  <h4 className="text-sm font-medium text-text-primary mb-3">Ajouter un utilisateur</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select
                      options={userOptions}
                      value={selectedUser}
                      onChange={setSelectedUser}
                      placeholder="Sélectionner un utilisateur"
                    />
                    <Select
                      options={roleOptions}
                      value={selectedRole}
                      onChange={setSelectedRole}
                      placeholder="Rôle"
                    />
                    <Button variant="default" onClick={handleAddUser} disabled={!selectedUser}>
                      Ajouter
                    </Button>
                  </div>
                </div>
              )}

              {companyUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Icon name="Users" size={48} className="text-text-muted mx-auto mb-4" />
                  <p className="text-text-muted">Aucun utilisateur dans cette entreprise</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {companyUsers.map((user) => (
                    <UserRow
                      key={user?.id}
                      user={user}
                      companies={allCompanies.filter(c => c.user_id === user.id)}
                      onRemove={() => handleRemoveUser(user.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;
