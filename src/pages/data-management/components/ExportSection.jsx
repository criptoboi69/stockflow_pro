import React, { useEffect, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import categoryService from '../../../services/categoryService';

const ExportSection = ({ onExportStart, isExporting, companyId }) => {
  const [exportConfig, setExportConfig] = useState({
    format: 'csv',
    dateRange: 'all',
    categories: [],
    includeImages: false,
    includeMovements: false
  });

  const formatOptions = [
    { value: 'csv', label: 'CSV' },
    { value: 'xlsx', label: 'Excel (.xlsx → export CSV pour le moment)' },
    { value: 'json', label: 'JSON' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'Toute la période' },
    { value: 'last_30', label: '30 derniers jours' },
    { value: 'last_90', label: '90 derniers jours' },
    { value: 'custom', label: 'Période personnalisée' }
  ];

  const [categoryOptions, setCategoryOptions] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      if (!companyId) {
        setCategoryOptions([]);
        return;
      }
      const categories = await categoryService.getCategories(companyId);
      const options = (categories || []).map((category) => ({
        value: category?.name,
        label: category?.name
      }));
      setCategoryOptions(options);
    };
    loadCategories();
  }, [companyId]);

  const handleExport = () => {
    onExportStart(exportConfig);
  };

  const handleConfigChange = (field, value) => {
    setExportConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 card-shadow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Export produits</h2>
          <p className="text-sm text-text-muted mt-1">Télécharge les données produits dans le format utile.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-text-muted">
          <Icon name="Database" size={16} />
          <span>Source : produits de la société active</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <Select
            label="Format d'export"
            options={formatOptions}
            value={exportConfig?.format}
            onChange={(value) => handleConfigChange('format', value)}
          />

          <Select
            label="Période"
            options={dateRangeOptions}
            value={exportConfig?.dateRange}
            onChange={(value) => handleConfigChange('dateRange', value)}
          />

          {exportConfig?.dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Date"
                type="date"
                value="2024-01-01"
              />
              <Input
                label="End Date"
                type="date"
                value="2024-10-25"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Select
            label="Catégories"
            description="Laisser vide pour exporter toutes les catégories"
            options={categoryOptions}
            value={exportConfig?.categories}
            onChange={(value) => handleConfigChange('categories', value)}
            multiple
            searchable
            clearable
          />

          <div className="space-y-3">
            <label className="text-sm font-medium text-text-primary">Options supplémentaires</label>
            <div className="space-y-2">
              <Checkbox
                label="Inclure les images produits"
                description="Ajoute les URLs des images dans l'export"
                checked={exportConfig?.includeImages}
                onChange={(e) => handleConfigChange('includeImages', e?.target?.checked)}
              />
              <Checkbox
                label="Inclure l'historique de mouvements"
                description="Prépare le terrain pour enrichir l'export stock plus tard"
                checked={exportConfig?.includeMovements}
                onChange={(e) => handleConfigChange('includeMovements', e?.target?.checked)}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-muted rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Icon name="Info" size={20} className="text-accent mt-0.5" />
          <div>
            <h4 className="font-medium text-text-primary mb-1">Infos export</h4>
            <ul className="text-sm text-text-muted space-y-1">
              <li>• Le téléchargement se lance localement dès que le fichier est prêt.</li>
              <li>• Le format Excel reste pour l’instant un fallback CSV.</li>
              <li>• Les catégories viennent de la base active, pas d’une liste statique.</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-text-muted">
          L’export est généré depuis les données réelles de la société active.
        </div>
        <Button
          variant="default"
          onClick={handleExport}
          loading={isExporting}
          iconName="Download"
          iconPosition="left"
        >
          Générer l'export
        </Button>
      </div>
    </div>
  );
};

export default ExportSection;