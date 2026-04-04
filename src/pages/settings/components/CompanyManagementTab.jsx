import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import InlineFeedback from '../../../components/ui/InlineFeedback';
import { supabase } from '../../../lib/supabase';

const CompanyManagementTab = ({ userRole, onSave }) => {
  const [companies, setCompanies] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [newCompany, setNewCompany] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
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

  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        ?.from('companies')
        ?.select('id, name, email, phone, address, status, created_at, settings')
        ?.order('created_at', { ascending: false });
      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'super_admin') loadCompanies();
  }, [userRole]);

  const handleCreateCompany = async () => {
    if (!newCompany?.name?.trim()) { setFeedback({ type: 'error', message: "Le nom de l'entreprise est requis" }); return; }
    setIsSaving(true);
    try {
      const payload = {
        name: newCompany.name,
        email: newCompany.email || null,
        phone: newCompany.phone || null,
        address: newCompany.address || null,
        status: 'active',
        settings: {
          general: {
            timezone: newCompany.timezone,
            country: newCompany.country,
            maxUsers: newCompany.maxUsers,
            features: newCompany.features
          }
        }
      };
      const { error } = await supabase?.from('companies')?.insert(payload);
      if (error) throw error;
      setShowCreateForm(false);
      setNewCompany({
        name: '', email: '', phone: '', address: '', country: 'France', timezone: 'Europe/Brussels', maxUsers: 10,
        features: { qrScanning: true, csvImport: true, webhooks: false, apiAccess: false, customReports: false }
      });
      await loadCompanies();
      setFeedback({ type: 'success', message: `Entreprise ${nextStatus === 'active' ? 'activée' : 'désactivée'} avec succès.` });
      await onSave('companies', { ok: true });
      setFeedback({ type: 'success', message: 'Entreprise créée avec succès.' });
    } catch (error) {
      console.error('Error creating company:', error);
      setFeedback({ type: 'error', message: error?.message || 'Erreur lors de la création' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCompanyStatus = async (companyId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    if (!window.confirm(`Confirmer le passage en statut ${nextStatus} ?`)) return;
    try {
      const { error } = await supabase?.from('companies')?.update({ status: nextStatus })?.eq('id', companyId);
      if (error) throw error;
      await loadCompanies();
    } catch (error) {
      console.error('Error updating company status:', error);
      setFeedback({ type: 'error', message: error?.message || 'Erreur lors de la mise à jour' });
    }
  };

  const handleFeatureChange = (feature, checked) => {
    setNewCompany(prev => ({ ...prev, features: { ...prev?.features, [feature]: checked } }));
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
      <InlineFeedback type={feedback?.type} message={feedback?.message} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Gestion des entreprises</h2>
          <p className="text-text-muted">Administrer les entreprises réelles de la base</p>
        </div>
        <Button variant="default" onClick={() => setShowCreateForm(true)} iconName="Plus" iconPosition="left">
          Nouvelle entreprise
        </Button>
      </div>

      {showCreateForm && (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-text-primary">Créer une nouvelle entreprise</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowCreateForm(false)}><Icon name="X" size={20} /></Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input label="Nom de l'entreprise" value={newCompany?.name} onChange={(e) => setNewCompany(prev => ({ ...prev, name: e?.target?.value }))} required />
            <Input label="Email de contact" type="email" value={newCompany?.email} onChange={(e) => setNewCompany(prev => ({ ...prev, email: e?.target?.value }))} />
            <Input label="Téléphone" type="tel" value={newCompany?.phone} onChange={(e) => setNewCompany(prev => ({ ...prev, phone: e?.target?.value }))} />
            <Input label="Nombre maximum d'utilisateurs" type="number" min="1" max="100" value={newCompany?.maxUsers} onChange={(e) => setNewCompany(prev => ({ ...prev, maxUsers: parseInt(e?.target?.value || '1', 10) }))} />
            <Input label="Adresse" value={newCompany?.address} onChange={(e) => setNewCompany(prev => ({ ...prev, address: e?.target?.value }))} className="md:col-span-2" />
            <Select label="Pays" options={countryOptions} value={newCompany?.country} onChange={(value) => setNewCompany(prev => ({ ...prev, country: value }))} />
            </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium text-text-primary mb-3">Fonctionnalités activées</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Checkbox label="Scanner QR" checked={newCompany?.features?.qrScanning} onChange={(e) => handleFeatureChange('qrScanning', e?.target?.checked)} />
              <Checkbox label="Import CSV" checked={newCompany?.features?.csvImport} onChange={(e) => handleFeatureChange('csvImport', e?.target?.checked)} />
              <Checkbox label="Webhooks" checked={newCompany?.features?.webhooks} onChange={(e) => handleFeatureChange('webhooks', e?.target?.checked)} />
              <Checkbox label="Accès API" checked={newCompany?.features?.apiAccess} onChange={(e) => handleFeatureChange('apiAccess', e?.target?.checked)} />
              <Checkbox label="Rapports personnalisés" checked={newCompany?.features?.customReports} onChange={(e) => handleFeatureChange('customReports', e?.target?.checked)} />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>Annuler</Button>
            <Button variant="default" onClick={handleCreateCompany} loading={isSaving}>Créer l'entreprise</Button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Entreprises enregistrées</h3>
            <p className="text-sm text-text-muted">Liste réelle des sociétés en base</p>
          </div>
          <div className="text-sm text-text-muted">{companies?.length} entreprise(s)</div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-text-muted">Chargement...</div>
        ) : (
          <div className="divide-y divide-border">
            {companies?.map((company) => (
              <div key={company?.id} className="p-6 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-text-primary">{company?.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs border ${company?.status === 'active' ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
                      {company?.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted">{company?.email || 'Pas d\'email'} • {company?.phone || 'Pas de téléphone'}</p>
                  <p className="text-xs text-text-muted mt-1">Créée le {new Date(company?.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleUpdateCompanyStatus(company?.id, company?.status)}>
                    {company?.status === 'active' ? 'Désactiver' : 'Activer'}
                  </Button>
                </div>
              </div>
            ))}
            {companies?.length === 0 && <div className="p-8 text-center text-text-muted">Aucune entreprise trouvée.</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyManagementTab;
