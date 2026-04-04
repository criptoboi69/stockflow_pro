import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';
import adminConsoleService from '../../../services/adminConsoleService';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import InlineFeedback from '../../../components/ui/InlineFeedback';

const UserRow = ({ user, companies, allCompanies, onManage }) => {
  const userCompanies = companies.filter(c => c.user_id === user.id);
  
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon name="User" size={20} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{user?.email}</p>
          <p className="text-xs text-text-muted">
            {userCompanies.length} entreprise{userCompanies.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2">
          {userCompanies.slice(0, 3).map((uc, idx) => {
            const company = allCompanies.find(c => c.id === uc.company_id);
            return (
              <span key={idx} className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                {company?.name?.slice(0, 15)}{company?.name?.length > 15 ? '...' : ''}
              </span>
            );
          })}
          {userCompanies.length > 3 && (
            <span className="text-xs text-text-muted">+{userCompanies.length - 3}</span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => onManage(user)}>
          Gérer
        </Button>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const { currentRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [feedback, setFeedback] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, companiesData, companiesOverview] = await Promise.all([
        adminConsoleService.getAllUsers(),
        adminConsoleService.getAllUserCompanyRoles(),
        adminConsoleService.getCompaniesOverview()
      ]);
      setUsers(usersData);
      setCompanies(companiesData);
      setAllCompanies(companiesOverview);
    } catch (error) {
      logger.error('User management load error:', error);
      setFeedback({ type: 'error', message: 'Erreur lors du chargement des utilisateurs' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = user?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase());
      const userCompanyIds = companies
        .filter(c => c.user_id === user.id)
        .map(c => c.company_id);
      const matchesCompany = companyFilter === 'all' || userCompanyIds.includes(companyFilter);
      return matchesSearch && matchesCompany;
    });
  }, [users, companies, searchTerm, companyFilter]);

  const companyOptions = useMemo(() => {
    const uniqueCompanies = companies.reduce((acc, c) => {
      if (!acc.find(x => x.company_id === c.company_id)) {
        acc.push({ company_id: c.company_id, company_name: c.company_name });
      }
      return acc;
    }, []);
    
    return [
      { value: 'all', label: 'Toutes les entreprises' },
      ...uniqueCompanies.map(c => ({ value: c.company_id, label: c.company_name }))
    ];
  }, [companies]);

  const handleManageUser = (user) => {
    setFeedback({ 
      type: 'info', 
      message: `Gestion de ${user.email} - Fonctionnalité à implémenter` 
    });
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

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Utilisateurs"
        subtitle={`Gestion des ${users.length} utilisateurs multi-sociétés`}
        actions={
          <Button
            variant="default"
            onClick={() => setFeedback({ type: 'info', message: 'Fonctionnalité à implémenter' })}
            iconName="UserPlus"
            iconPosition="left"
            size="sm"
          >
            Nouvel utilisateur
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {feedback && (
          <div className="mb-6">
            <InlineFeedback type={feedback.type} message={feedback.message} />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e?.target?.value)}
              iconName="Search"
            />
          </div>
          <div className="sm:w-64">
            <Select
              options={companyOptions}
              value={companyFilter}
              onChange={setCompanyFilter}
              placeholder="Filtrer par entreprise"
            />
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-text-muted">
          {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="Users" size={48} className="text-text-muted mx-auto mb-4" />
            <p className="text-text-primary font-medium">Aucun utilisateur trouvé</p>
            <p className="text-sm text-text-muted mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <UserRow
                key={user?.id}
                user={user}
                companies={companies}
                allCompanies={allCompanies}
                onManage={handleManageUser}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
