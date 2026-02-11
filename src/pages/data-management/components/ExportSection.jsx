import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const ExportSection = ({ onExportStart, isExporting }) => {
  const [exportConfig, setExportConfig] = useState({
    format: 'csv',
    dateRange: 'all',
    categories: [],
    includeImages: false,
    includeMovements: false
  });

  const formatOptions = [
    { value: 'csv', label: 'CSV Format' },
    { value: 'xlsx', label: 'Excel Format' },
    { value: 'json', label: 'JSON Format' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'last_30', label: 'Last 30 Days' },
    { value: 'last_90', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const categoryOptions = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'office_supplies', label: 'Office Supplies' },
    { value: 'tools', label: 'Tools' }
  ];

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
          <h2 className="text-xl font-semibold text-text-primary">Export Products</h2>
          <p className="text-sm text-text-muted mt-1">Download product data in various formats</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-text-muted">
          <Icon name="Clock" size={16} />
          <span>Last export: 2 hours ago</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <Select
            label="Export Format"
            options={formatOptions}
            value={exportConfig?.format}
            onChange={(value) => handleConfigChange('format', value)}
          />

          <Select
            label="Date Range"
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
            label="Categories"
            description="Leave empty to export all categories"
            options={categoryOptions}
            value={exportConfig?.categories}
            onChange={(value) => handleConfigChange('categories', value)}
            multiple
            searchable
            clearable
          />

          <div className="space-y-3">
            <label className="text-sm font-medium text-text-primary">Additional Options</label>
            <div className="space-y-2">
              <Checkbox
                label="Include product images"
                description="Export with image URLs"
                checked={exportConfig?.includeImages}
                onChange={(e) => handleConfigChange('includeImages', e?.target?.checked)}
              />
              <Checkbox
                label="Include movement history"
                description="Export with stock movement data"
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
            <h4 className="font-medium text-text-primary mb-1">Export Information</h4>
            <ul className="text-sm text-text-muted space-y-1">
              <li>• Estimated file size: ~2.5 MB</li>
              <li>• Estimated records: 1,247 products</li>
              <li>• Processing time: 30-60 seconds</li>
              <li>• Download link expires in 24 hours</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-text-muted">
          Export will be generated as a secure download link
        </div>
        <Button
          variant="default"
          onClick={handleExport}
          loading={isExporting}
          iconName="Download"
          iconPosition="left"
        >
          Generate Export
        </Button>
      </div>
    </div>
  );
};

export default ExportSection;