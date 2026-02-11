import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

import { useAuth } from '../../../hooks/useAuth';

const QRCodeGenerator = ({ 
  product, 
  isOpen, 
  onClose, 
  onGenerate 
}) => {
  const [qrConfig, setQrConfig] = useState({
    size: 256,
    level: 'M', // Error correction level
    includeMargin: true,
    fgColor: '#000000',
    bgColor: '#FFFFFF'
  });
  const [qrData, setQrData] = useState('');
  const [customData, setCustomData] = useState('');
  const [dataType, setDataType] = useState('product_management_url');
  const [isGenerating, setIsGenerating] = useState(false);
  const qrRef = useRef(null);

  const errorLevels = [
    { value: 'L', label: 'Faible (7%)' },
    { value: 'M', label: 'Moyen (15%)' },
    { value: 'Q', label: 'Élevé (25%)' },
    { value: 'H', label: 'Très élevé (30%)' }
  ];

  const sizeOptions = [
    { value: 128, label: '128x128 px' },
    { value: 256, label: '256x256 px' },
    { value: 512, label: '512x512 px' },
    { value: 1024, label: '1024x1024 px' }
  ];

  const dataTypeOptions = [
    { value: 'product_management_url', label: 'URL Gestion Produit (Recommandé)' },
    { value: 'product_page_url', label: 'URL Page Produit' },
    { value: 'stock_management_url', label: 'URL Gestion Stock Directe' },
    { value: 'product_info', label: 'Informations produit' },
    { value: 'sku_only', label: 'SKU uniquement' },
    { value: 'custom', label: 'Données personnalisées' }
  ];

  useEffect(() => {
    if (product && isOpen) {
      generateQRData();
    }
  }, [product, dataType, customData, isOpen]);

  const generateQRData = () => {
    if (!product) return;

    let data = '';
    const baseUrl = window.location?.origin;
    
    switch (dataType) {
      case 'product_management_url':
        // Main URL for product page with quantity management capability
        data = `${baseUrl}/products/${product?.id || product?.sku}?action=manage`;
        break;
      case 'product_page_url':
        // Direct link to product page
        data = `${baseUrl}/products/${product?.id || product?.sku}`;
        break;
      case 'stock_management_url':
        // Direct link to stock management for this product
        data = `${baseUrl}/stock-movements?product=${product?.id || product?.sku}&quick_add=true`;
        break;
      case 'product_info':
        data = JSON.stringify({
          id: product?.id,
          name: product?.name,
          sku: product?.sku,
          price: product?.price,
          category: product?.category,
          location: product?.location,
          management_url: `${baseUrl}/products/${product?.id || product?.sku}?action=manage`
        });
        break;
      case 'sku_only':
        data = product?.sku || '';
        break;
      case 'custom':
        data = customData;
        break;
      default:
        data = `${baseUrl}/products/${product?.id || product?.sku}?action=manage`;
    }
    setQrData(data);
  };

  const handleConfigChange = (field, value) => {
    setQrConfig(prev => ({ ...prev, [field]: value }));
  };

  const downloadQRCode = async (format = 'png') => {
    if (!qrRef?.current || !qrData) return;

    setIsGenerating(true);
    try {
      const qrElement = qrRef?.current;
      
      if (format === 'svg') {
        // Download as SVG
        const svgElement = qrElement?.querySelector('svg');
        const svgData = new XMLSerializer()?.serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const link = document.createElement('a');
        link.href = svgUrl;
        link.download = `qr-${product?.sku || 'product'}-management.svg`;
        link?.click();
        
        URL.revokeObjectURL(svgUrl);
      } else {
        // Download as PNG using html2canvas
        const canvas = await html2canvas(qrElement, {
          backgroundColor: qrConfig?.bgColor,
          scale: 2
        });
        
        const link = document.createElement('a');
        link.download = `qr-${product?.sku || 'product'}-management.png`;
        link.href = canvas?.toDataURL('image/png');
        link?.click();
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const printQRCode = async () => {
    if (!qrRef?.current || !qrData) return;

    setIsGenerating(true);
    try {
      const qrElement = qrRef?.current;
      const canvas = await html2canvas(qrElement, {
        backgroundColor: qrConfig?.bgColor,
        scale: 3
      });

      // Create PDF for printing
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas?.toDataURL('image/png');
      const qrSize = 80; // 80mm square
      const x = (210 - qrSize) / 2; // Center horizontally on A4
      const y = 40; // 40mm from top

      // Add header
      pdf?.setFontSize(18);
      pdf?.text('QR Code - Gestion Produit', 105, 20, { align: 'center' });
      
      pdf?.setFontSize(14);
      pdf?.text(product?.name || 'Produit', 105, 30, { align: 'center' });
      
      pdf?.setFontSize(12);
      pdf?.text(`SKU: ${product?.sku || 'N/A'}`, 105, 35, { align: 'center' });

      // Add QR code
      pdf?.addImage(imgData, 'PNG', x, y, qrSize, qrSize);

      // Add instructions
      pdf?.setFontSize(11);
      pdf?.text('Instructions:', 20, y + qrSize + 15);
      
      const instructions = [
        '• Scanner ce QR code pour accéder rapidement au produit',
        '• Gérer les quantités directement depuis votre mobile',
        '• Suivre les mouvements de stock en temps réel',
        '• Accès optimisé pour les terminaux mobiles'
      ];

      instructions?.forEach((instruction, index) => {
        pdf?.text(instruction, 20, y + qrSize + 20 + (index * 5));
      });

      // Add additional product details
      if (product) {
        pdf?.setFontSize(10);
        const { isAdministrator, isManager } = useAuth();
        const canSeePrices = isAdministrator() || isManager();
        
        const details = [
          `Catégorie: ${product?.category || 'N/A'}`,
          ...(canSeePrices ? [`Prix: ${product?.price ? `${product?.price}€` : 'N/A'}`] : []),
          `Stock actuel: ${product?.quantity || 0}`,
          `Emplacement: ${product?.location || 'N/A'}`,
          `Stock minimum: ${product?.minStock || 0}`
        ];

        pdf?.text('Détails du produit:', 20, y + qrSize + 45);
        details?.forEach((detail, index) => {
          pdf?.text(detail, 20, y + qrSize + 50 + (index * 4));
        });
      }

      // Add footer
      pdf?.setFontSize(8);
      pdf?.text('Généré par StockFlow Pro - Système de gestion d\'inventaire', 105, 280, { align: 'center' });

      // Open print dialog
      pdf?.autoPrint();
      window.open(pdf?.output('bloburl'), '_blank');
    } catch (error) {
      console.error('Error printing QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyQRData = () => {
    if (navigator.clipboard && qrData) {
      navigator.clipboard?.writeText(qrData);
    }
  };

  const getDataTypeDescription = () => {
    switch (dataType) {
      case 'product_management_url':
        return 'QR code optimisé pour la gestion mobile des stocks. Accès direct à la page produit avec options de modification de quantité.';
      case 'product_page_url':
        return 'Lien direct vers la page de consultation du produit.';
      case 'stock_management_url':
        return 'Accès direct au module de gestion des mouvements de stock pour ce produit.';
      case 'product_info':
        return 'Informations complètes du produit au format JSON avec URL de gestion.';
      case 'sku_only':
        return 'Code SKU uniquement pour identification rapide.';
      case 'custom':
        return 'Données personnalisées définies par l\'utilisateur.';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[250] flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden modal-shadow">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="QrCode" size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">QR Code - Gestion des Stocks</h2>
              <p className="text-sm text-text-muted">
                {product?.name || 'Produit sélectionné'} • SKU: {product?.sku || 'N/A'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Configuration Panel */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <Select
                      label="Type de QR Code"
                      options={dataTypeOptions}
                      value={dataType}
                      onChange={(value) => setDataType(value)}
                    />
                    <p className="text-xs text-text-muted mt-1">
                      {getDataTypeDescription()}
                    </p>
                  </div>

                  {dataType === 'custom' && (
                    <Input
                      label="Données personnalisées"
                      type="text"
                      value={customData}
                      onChange={(e) => setCustomData(e?.target?.value)}
                      placeholder="Entrez vos données personnalisées"
                    />
                  )}

                  <Select
                    label="Taille"
                    options={sizeOptions}
                    value={qrConfig?.size}
                    onChange={(value) => handleConfigChange('size', parseInt(value))}
                  />

                  <Select
                    label="Niveau de correction d'erreur"
                    options={errorLevels}
                    value={qrConfig?.level}
                    onChange={(value) => handleConfigChange('level', value)}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Couleur de premier plan
                      </label>
                      <input
                        type="color"
                        value={qrConfig?.fgColor}
                        onChange={(e) => handleConfigChange('fgColor', e?.target?.value)}
                        className="w-full h-10 rounded border border-border cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Couleur d'arrière-plan
                      </label>
                      <input
                        type="color"
                        value={qrConfig?.bgColor}
                        onChange={(e) => handleConfigChange('bgColor', e?.target?.value)}
                        className="w-full h-10 rounded border border-border cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                  <Icon name="Info" size={16} className="mr-2" />
                  Utilisation du QR Code
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Scanner avec un smartphone ou tablette</li>
                  <li>• Accès direct à la page de gestion du produit</li>
                  <li>• Modification rapide des quantités</li>
                  <li>• Optimisé pour usage mobile en entrepôt</li>
                </ul>
              </div>

              {/* Data Preview */}
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">URL générée</h3>
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <pre className="text-sm text-text-secondary font-mono whitespace-pre-wrap break-all flex-1 mr-2">
                      {qrData || 'Aucune donnée'}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyQRData}
                      className="text-text-muted hover:text-text-primary flex-shrink-0"
                      title="Copier l'URL"
                    >
                      <Icon name="Copy" size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Preview */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">Aperçu du QR Code</h3>
                <div className="flex justify-center">
                  <div 
                    ref={qrRef}
                    className="p-6 bg-white rounded-lg border-2 border-dashed border-border inline-block"
                    style={{ backgroundColor: qrConfig?.bgColor }}
                  >
                    {qrData ? (
                      <QRCodeSVG
                        value={qrData}
                        size={Math.min(qrConfig?.size, 300)}
                        level={qrConfig?.level}
                        includeMargin={qrConfig?.includeMargin}
                        fgColor={qrConfig?.fgColor}
                        bgColor={qrConfig?.bgColor}
                      />
                    ) : (
                      <div 
                        className="flex items-center justify-center text-text-muted border-2 border-dashed border-border rounded"
                        style={{ 
                          width: Math.min(qrConfig?.size, 300), 
                          height: Math.min(qrConfig?.size, 300) 
                        }}
                      >
                        <div className="text-center">
                          <Icon name="QrCode" size={48} className="mx-auto mb-2" />
                          <p className="text-sm">QR Code apparaîtra ici</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-text-primary">Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => downloadQRCode('png')}
                    disabled={!qrData || isGenerating}
                    loading={isGenerating}
                    iconName="Download"
                    iconPosition="left"
                    className="w-full"
                  >
                    PNG
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => downloadQRCode('svg')}
                    disabled={!qrData || isGenerating}
                    loading={isGenerating}
                    iconName="Download"
                    iconPosition="left"
                    className="w-full"
                  >
                    SVG
                  </Button>
                  
                  <Button
                    variant="default"
                    onClick={printQRCode}
                    disabled={!qrData || isGenerating}
                    loading={isGenerating}
                    iconName="Printer"
                    iconPosition="left"
                    className="w-full col-span-2"
                  >
                    Imprimer avec Instructions
                  </Button>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-text-muted">
                    Le QR code permet un accès direct à la gestion des quantités de ce produit
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Fermer
          </Button>
          
          {onGenerate && (
            <Button
              variant="default"
              onClick={() => onGenerate(qrData, qrConfig)}
              disabled={!qrData}
            >
              Utiliser ce QR Code
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;