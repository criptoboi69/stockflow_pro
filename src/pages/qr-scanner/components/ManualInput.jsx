import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ManualInput = ({ onSubmit, isProcessing, currentLanguage = 'fr' }) => {
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');

  const translations = {
    fr: {
      manualEntry: "Saisie manuelle",
      enterBarcode: "Entrer le code-barres",
      barcodePlaceholder: "Saisissez le code produit ou code-barres",
      searchProduct: "Rechercher le produit",
      processing: "Traitement...",
      invalidFormat: "Format de code invalide",
      examples: "Exemples: PRD-2024-001, 1234567890123",
      description: "Vous pouvez également saisir manuellement le code produit si la caméra n\'est pas disponible."
    },
    en: {
      manualEntry: "Manual Entry",
      enterBarcode: "Enter Barcode",
      barcodePlaceholder: "Enter product code or barcode",
      searchProduct: "Search Product",
      processing: "Processing...",
      invalidFormat: "Invalid code format",
      examples: "Examples: PRD-2024-001, 1234567890123",
      description: "You can also manually enter the product code if camera is not available."
    }
  };

  const t = translations?.[currentLanguage];

  const validateBarcode = (code) => {
    // Basic validation for common barcode formats
    const patterns = [
      /^PRD-\d{4}-\d{3}$/, // Product code format
      /^\d{8,13}$/, // EAN/UPC format
      /^[A-Z0-9]{6,20}$/ // General alphanumeric
    ];
    
    return patterns?.some(pattern => pattern?.test(code));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError('');
    
    const trimmedCode = barcode?.trim();
    
    if (!trimmedCode) {
      return;
    }
    
    if (!validateBarcode(trimmedCode)) {
      setError(t?.invalidFormat);
      return;
    }
    
    onSubmit(trimmedCode);
  };

  const handleInputChange = (e) => {
    const value = e?.target?.value?.toUpperCase();
    setBarcode(value);
    if (error) setError('');
  };

  return (
    <div className="w-full bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mr-3">
          <Icon name="Keyboard" size={20} className="text-secondary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{t?.manualEntry}</h3>
          <p className="text-sm text-text-muted">{t?.description}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t?.enterBarcode}
          type="text"
          value={barcode}
          onChange={handleInputChange}
          placeholder={t?.barcodePlaceholder}
          error={error}
          disabled={isProcessing}
          className="font-mono"
        />
        
        <div className="text-xs text-text-muted">
          {t?.examples}
        </div>

        <Button
          type="submit"
          disabled={!barcode?.trim() || isProcessing}
          loading={isProcessing}
          className="w-full"
        >
          <Icon name="Search" size={16} className="mr-2" />
          {isProcessing ? t?.processing : t?.searchProduct}
        </Button>
      </form>
    </div>
  );
};

export default ManualInput;