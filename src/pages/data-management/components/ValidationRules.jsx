import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ValidationRules = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const validationRules = [
    {
      field: 'name',
      label: 'Product Name',
      rules: [
        { type: 'required', description: 'Product name is mandatory' },
        { type: 'length', description: 'Must be between 3-100 characters' },
        { type: 'format', description: 'No special characters except hyphens and spaces' }
      ],
      example: 'Laptop Dell XPS 13'
    },
    {
      field: 'sku',
      label: 'SKU Code',
      rules: [
        { type: 'required', description: 'SKU must be unique across all products' },
        { type: 'format', description: 'Alphanumeric with hyphens (A-Z, 0-9, -)' },
        { type: 'length', description: '6-20 characters maximum' }
      ],
      example: 'DELL-XPS-001'
    },
    {
      field: 'category',
      label: 'Category',
      rules: [
        { type: 'required', description: 'Must match existing category name' },
        { type: 'validation', description: 'Category will be created if it doesn\'t exist' }
      ],
      example: 'Electronics'
    },
    {
      field: 'quantity',
      label: 'Quantity',
      rules: [
        { type: 'required', description: 'Initial stock quantity is required' },
        { type: 'format', description: 'Must be a positive integer' },
        { type: 'range', description: 'Maximum value: 999,999' }
      ],
      example: '15'
    },
    {
      field: 'location',
      label: 'Location',
      rules: [
        { type: 'optional', description: 'Storage location (optional)' },
        { type: 'validation', description: 'Location will be created if it doesn\'t exist' }
      ],
      example: 'Warehouse A'
    },
    {
      field: 'description',
      label: 'Description',
      rules: [
        { type: 'optional', description: 'Product description (optional)' },
        { type: 'length', description: 'Maximum 500 characters' }
      ],
      example: 'High-performance ultrabook with 13-inch display'
    }
  ];

  const getRuleIcon = (type) => {
    switch (type) {
      case 'required':
        return <Icon name="AlertCircle" size={14} className="text-error" />;
      case 'optional':
        return <Icon name="Info" size={14} className="text-accent" />;
      case 'format':
        return <Icon name="Type" size={14} className="text-warning" />;
      case 'length':
        return <Icon name="Ruler" size={14} className="text-primary" />;
      case 'range':
        return <Icon name="BarChart3" size={14} className="text-success" />;
      case 'validation':
        return <Icon name="CheckCircle" size={14} className="text-success" />;
      default:
        return <Icon name="Dot" size={14} className="text-text-muted" />;
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 card-shadow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Validation Rules</h2>
          <p className="text-sm text-text-muted mt-1">CSV import requirements and formatting guidelines</p>
        </div>
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
          iconPosition="right"
        >
          {isExpanded ? 'Collapse' : 'View Details'}
        </Button>
      </div>
      {!isExpanded ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {validationRules?.slice(0, 6)?.map((field, index) => (
            <div key={index} className="border border-border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="FileText" size={16} className="text-primary" />
                <h3 className="font-medium text-text-primary">{field?.label}</h3>
              </div>
              <p className="text-sm text-text-muted mb-2">
                {field?.rules?.[0]?.description}
              </p>
              <div className="bg-muted rounded px-2 py-1">
                <code className="text-xs text-text-primary">{field?.example}</code>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {validationRules?.map((field, index) => (
            <div key={index} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Icon name="FileText" size={20} className="text-primary" />
                  <h3 className="text-lg font-medium text-text-primary">{field?.label}</h3>
                  <code className="text-sm bg-muted px-2 py-1 rounded text-text-secondary">
                    {field?.field}
                  </code>
                </div>
                <div className="bg-muted rounded px-3 py-1">
                  <code className="text-sm text-text-primary">{field?.example}</code>
                </div>
              </div>
              
              <div className="space-y-2">
                {field?.rules?.map((rule, ruleIndex) => (
                  <div key={ruleIndex} className="flex items-start space-x-2">
                    {getRuleIcon(rule?.type)}
                    <span className="text-sm text-text-primary">{rule?.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Icon name="Lightbulb" size={20} className="text-accent mt-0.5" />
              <div>
                <h4 className="font-medium text-text-primary mb-2">Import Tips</h4>
                <ul className="text-sm text-text-muted space-y-1">
                  <li>• Use UTF-8 encoding to ensure special characters display correctly</li>
                  <li>• Remove empty rows and columns before importing</li>
                  <li>• Ensure column headers match exactly: name, sku, category, quantity, location, description</li>
                  <li>• Test with a small batch first to validate your data format</li>
                  <li>• Duplicate SKUs will be ignored during import</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationRules;