import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const CompanyManagementTab = ({ userRole, onSave }) => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newCompany, setNewCompany] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    timezone: 'Europe/Brussels',
    maxUsers: 10,
    features: {
      qrScanning: true,
      csvImport: true,
      webhooks: false,
      apiAccess: false,
      customReports: false
    }
  });

  // Mock companies data
  const mockCompanies = [
    {
      id: 1,
      name: "TechCorp Solutions",
      email: "admin@techcorp.fr",
      phone: "+33 1 23 45 67 89",
      address: "123 Avenue des Champs-Élysées",
      city: "Paris",
      postalCode: "75008",
      country: "France",
      timezone: "Europe/Paris",
      maxUsers: 25,
      currentUsers: 12,
      status: "active",
      createdAt: "2024-01-15",
      features: {
        qrScanning: true,
        csvImport: true,
        webhooks: true,
        apiAccess: true,
        customReports: true
      }
    },
    {
      id: 2,
      name: "Logistics Pro SARL",
      email: "contact@logisticspro.fr",
      phone: "+33 4 56 78 90 12",
      address: "456 Rue de la République",
      city: "Lyon",
      postalCode: "69002",
      country: "France",
      timezone: "Europe/Brussels",
      maxUsers: 15,
      currentUsers: 8,
      status: "active",
      createdAt: "2024-02-20",
      features: {
        qrScanning: true,
        csvImport: true,
        webhooks: false,
        apiAccess: false,
        customReports: true
      }
    },
    {
      id: 3,
      name: "Retail Express",
      email: "info@retailexpress.be",
      phone: "+32 2 345 67 89",
      address: "789 Boulevard Anspach",
      city: "Bruxelles",
      postalCode: "1000",
      country: "Belgique",
      timezone: "Europe/Brussels",
      maxUsers: 5,
      currentUsers: 3,
      status: "trial",
      createdAt: "2024-10-01",
      features: {
        qrScanning: true,
        csvImport: false,
        webhooks: false,
        apiAccess: false,
        customReports: false
      }
    }
  ];

  const countryOptions = [
    { value: 'France', label: 'France' },
    { value: 'Belgique', label: 'Belgique' },
    { value: 'Suisse', label: 'Suisse' },
    { value: 'Luxembourg', label: 'Luxembourg' }
  ];

  const timezoneOptions = [
    { value: 'Europe/Brussels', label: 'Europe/Brussels (GMT+1)' },
    { value: 'Europe/Paris', label: 'Europe/Paris (GMT+1)' },
    { value: 'Europe/Zurich', label: 'Europe/Zurich (GMT+1)' }
  ];

  useEffect(() => {
    if (userRole === 'super_admin') {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setCompanies(mockCompanies);
        setIsLoading(false);
      }, 1000);
    }
  }, [userRole]);

  const handleCreateCompany = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const company = {
        ...newCompany,
        id: companies?.length + 1,
        currentUsers: 0,
        status: 'trial',
        createdAt: new Date()?.toISOString()?.split('T')?.[0]
      };
      
      setCompanies(prev => [...prev, company]);
      setNewCompany({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'France',
        timezone: 'Europe/Brussels',
        maxUsers: 10,
        features: {
          qrScanning: true,
          csvImport: true,
          webhooks: false,
          apiAccess: false,
          customReports: false
        }
      });
      setShowCreateForm(false);
      await onSave('companies', companies);
    } catch (error) {
      console.error('Error creating company:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCompany = async (companyId, updates) => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCompanies(prev => prev?.map(company => 
        company?.id === companyId ? { ...company, ...updates } : company
      ));
      await onSave('companies', companies);
    } catch (error) {
      console.error('Error updating company:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeatureChange = (feature, checked) => {
    setNewCompany(prev => ({
      ...prev,
      features: {
        ...prev?.features,
        [feature]: checked
      }
    }));
  };

  if (userRole !== 'super_admin') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="Lock" size={24} className="text-error" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">Accès restreint</h3>
        <p className="text-text-muted">Cette section est réservée aux super administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Gestion des entreprises</h2>
          <p className="text-text-muted">Administrer les entreprises clientes et leurs configurations</p>
        </div>
        <Button
          variant="default"
          onClick={() => setShowCreateForm(true)}
          iconName="Plus"
          iconPosition="left"
        >
          Nouvelle entreprise
        </Button>
      </div>
      {/* Create Company Form */}
      {showCreateForm && (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-text-primary">Créer une nouvelle entreprise</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCreateForm(false)}
            >
              <Icon name="X" size={20} />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input
              label="Nom de l'entreprise"
              placeholder="Nom de l'entreprise"
              value={newCompany?.name}
              onChange={(e) => setNewCompany(prev => ({ ...prev, name: e?.target?.value }))}
              required
            />

            <Input
              label="Email de contact"
              type="email"
              placeholder="contact@entreprise.fr"
              value={newCompany?.email}
              onChange={(e) => setNewCompany(prev => ({ ...prev, email: e?.target?.value }))}
              required
            />

            <Input
              label="Téléphone"
              type="tel"
              placeholder="+33 1 23 45 67 89"
              value={newCompany?.phone}
              onChange={(e) => setNewCompany(prev => ({ ...prev, phone: e?.target?.value }))}
            />

            <Input
              label="Nombre maximum d'utilisateurs"
              type="number"
              min="1"
              max="100"
              value={newCompany?.maxUsers}
              onChange={(e) => setNewCompany(prev => ({ ...prev, maxUsers: parseInt(e?.target?.value) }))}
            />

            <Input
              label="Adresse"
              placeholder="123 Rue de la Paix"
              value={newCompany?.address}
              onChange={(e) => setNewCompany(prev => ({ ...prev, address: e?.target?.value }))}
              className="md:col-span-2"
            />

            <Input
              label="Ville"
              placeholder="Paris"
              value={newCompany?.city}
              onChange={(e) => setNewCompany(prev => ({ ...prev, city: e?.target?.value }))}
            />

            <Input
              label="Code postal"
              placeholder="75001"
              value={newCompany?.postalCode}
              onChange={(e) => setNewCompany(prev => ({ ...prev, postalCode: e?.target?.value }))}
            />

            <Select
              label="Pays"
              options={countryOptions}
              value={newCompany?.country}
              onChange={(value) => setNewCompany(prev => ({ ...prev, country: value }))}
            />

            <Select
              label="Fuseau horaire"
              options={timezoneOptions}
              value={newCompany?.timezone}
              onChange={(value) => setNewCompany(prev => ({ ...prev, timezone: value }))}
            />
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium text-text-primary mb-3">Fonctionnalités activées</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Checkbox
                label="Scanner QR"
                description="Permettre le scan de codes QR"
                checked={newCompany?.features?.qrScanning}
                onChange={(e) => handleFeatureChange('qrScanning', e?.target?.checked)}
              />

              <Checkbox
                label="Import CSV"
                description="Permettre l'import de fichiers CSV"
                checked={newCompany?.features?.csvImport}
                onChange={(e) => handleFeatureChange('csvImport', e?.target?.checked)}
              />

              <Checkbox
                label="Webhooks"
                description="Intégrations webhook"
                checked={newCompany?.features?.webhooks}
                onChange={(e) => handleFeatureChange('webhooks', e?.target?.checked)}
              />

              <Checkbox
                label="Accès API"
                description="Accès à l'API REST"
                checked={newCompany?.features?.apiAccess}
                onChange={(e) => handleFeatureChange('apiAccess', e?.target?.checked)}
              />

              <Checkbox
                label="Rapports personnalisés"
                description="Génération de rapports avancés"
                checked={newCompany?.features?.customReports}
                onChange={(e) => handleFeatureChange('customReports', e?.target?.checked)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => setShowCreateForm(false)}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button
              variant="default"
              onClick={handleCreateCompany}
              loading={isSaving}
              iconName="Save"
              iconPosition="left"
              disabled={!newCompany?.name || !newCompany?.email}
            >
              Créer l'entreprise
            </Button>
          </div>
        </div>
      )}
      {/* Companies List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-text-muted">Chargement des entreprises...</p>
          </div>
        ) : (
          companies?.map((company) => (
            <div key={company?.id} className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon name="Building2" size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{company?.name}</h3>
                    <p className="text-sm text-text-muted">{company?.email}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-text-muted">{company?.city}, {company?.country}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        company?.status === 'active' ?'bg-success/10 text-success' :'bg-warning/10 text-warning'
                      }`}>
                        {company?.status === 'active' ? 'Actif' : 'Essai'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-text-primary">
                    {company?.currentUsers}/{company?.maxUsers} utilisateurs
                  </p>
                  <p className="text-xs text-text-muted">Créé le {company?.createdAt}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                {Object.entries(company?.features)?.map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-success' : 'bg-muted'}`}></div>
                    <span className="text-xs text-text-muted capitalize">
                      {feature === 'qrScanning' ? 'QR Scanner' :
                       feature === 'csvImport' ? 'Import CSV' :
                       feature === 'webhooks' ? 'Webhooks' :
                       feature === 'apiAccess'? 'API' : 'Rapports'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCompany(company)}
                  iconName="Settings"
                  iconPosition="left"
                >
                  Configurer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateCompany(company?.id, { 
                    status: company?.status === 'active' ? 'suspended' : 'active' 
                  })}
                  iconName={company?.status === 'active' ? 'Pause' : 'Play'}
                  iconPosition="left"
                >
                  {company?.status === 'active' ? 'Suspendre' : 'Activer'}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CompanyManagementTab;