import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';
import adminConsoleService from '../../../services/adminConsoleService';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const CompanyCard = ({ company }) => {
  const statusConfig = {
    active: { color: 'bg-success/10 text-success border-success/20', label: 'Actif' },
    inactive: { color: 'bg-muted text-text-muted border-border', label: 'Inactif' },
    suspended: { color: 'bg-error/10 text-error border-error/20', label: 'Suspendu' },
  };

  const status = statusConfig[company?.status] || statusConfig.inactive;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 hover:border-primary/50 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="Building2" size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">{company?.name}</h3>
            <p className="text-xs text-text-muted">ID: {company?.id?.slice(0, 8)}...</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <p className="text-2xl font-bold text-text-primary">{company?.userCount || 0}</p>
          <p className="text-xs text-text-muted mt-1">Utilisateurs</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <p className="text-2xl font-bold text-text-primary">{company?.productCount || 0}</p>
          <p className="text-xs text-text-muted mt-1">Produits</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <p className="text-2xl font-bold text-text-primary">{company?.locationCount || 0}</p>
          <p className="text-xs text-text-muted mt-1">Locations</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="text-xs text-text-muted">
          Créé le {new Date(company?.created_at)?.toLocaleDateString('fr-FR')}
        </div>
        <Link
          to={`/admin-console/companies/${company?.id}`}
          className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1"
        >
          Voir détails
          <Icon name="ArrowRight" size={16} />
        </Link>
      </div>
    </div>
  );
};

const CompaniesList = () => {
  const { currentRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const data = await adminConsoleService.getCompaniesOverview();
        setCompanies(data);
      } catch (error) {
        logger.error('Companies list load error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const matchesSearch = company?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                           company?.id?.toLowerCase()?.includes(searchTerm?.toLowerCase());
      const matchesStatus = statusFilter === 'all' || company?.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [companies, searchTerm, statusFilter]);

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
    { value: 'suspended', label: 'Suspendu' },
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

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Entreprises"
        subtitle={`Gestion des ${companies.length} sociétés enregistrées`}
        actions={
          <Button
            variant="default"
            onClick={() => {/* TODO: Add company modal */}}
            iconName="Plus"
            iconPosition="left"
            size="sm"
          >
            Nouvelle entreprise
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par nom ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e?.target?.value)}
              iconName="Search"
            />
          </div>
          <div className="sm:w-48">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Filtrer par statut"
            />
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-text-muted">
          {filteredCompanies.length} entreprise{filteredCompanies.length > 1 ? 's' : ''} trouvée{filteredCompanies.length > 1 ? 's' : ''}
        </div>

        {/* Grid */}
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="Building2" size={48} className="text-text-muted mx-auto mb-4" />
            <p className="text-text-primary font-medium">Aucune entreprise trouvée</p>
            <p className="text-sm text-text-muted mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company) => (
              <CompanyCard key={company?.id} company={company} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompaniesList;
