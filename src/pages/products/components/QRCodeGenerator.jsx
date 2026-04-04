import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

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
    bgColor: '#FFFFFF',
    printFormat: 'label_50x30'
  });
  const [qrData, setQrData] = useState('');
  const [qrVersionToken, setQrVersionToken] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const printFormatOptions = [
    { value: 'label_50x30', label: 'Étiquette 50x30 mm (collante)' },
    { value: 'label_62x29', label: 'Étiquette 62x29 mm (DYMO style)' },
    { value: 'a4', label: 'A4 standard' }
  ];

  useEffect(() => {
    if (product && isOpen) {
      const existing = product?.qrCode || '';
      const existingTokenMatch = existing.match(/[?&]qr=([^&]+)/);
      setQrVersionToken(existingTokenMatch?.[1] || '');
      generateQRData(existingTokenMatch?.[1] || '');
    }
  }, [product, isOpen]);

  const buildProductStockManagementUrl = (tokenOverride = '') => {
    const baseUrl = window.location?.origin;
    const productId = encodeURIComponent(product?.id || '');
    const token = tokenOverride || qrVersionToken || '';
    const tokenSuffix = token ? `&qr=${encodeURIComponent(token)}` : '';
    return `${baseUrl}/products?product=${productId}&mode=add-movement${tokenSuffix}`;
  };

  const generateQRData = (forcedToken = '') => {
    if (!product) return;
    setQrData(buildProductStockManagementUrl(forcedToken));
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

      const imgData = canvas?.toDataURL('image/png');
      const format = qrConfig?.printFormat || 'label_50x30';
      const productLabel = String(product?.name || 'Produit').trim() || 'Produit';

      if (format === 'label_50x30' || format === 'label_62x29') {
        const labelW = format === 'label_62x29' ? 62 : 50;
        const labelH = format === 'label_62x29' ? 29 : 30;
        const pageW = Math.min(labelW, labelH);
        const pageH = Math.max(labelW, labelH);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [pageW, pageH]
        });

        const padding = 1.5;
        const textHeight = 4;
        const availableHeight = pageH - (padding * 2) - textHeight;
        const qrSize = Math.min(pageW - (padding * 2), availableHeight);
        const x = (pageW - qrSize) / 2;
        const y = padding;
        pdf?.addImage(imgData, 'PNG', x, y, qrSize, qrSize);

        pdf?.setFontSize(7);
        pdf?.text(productLabel, pageW / 2, pageH - padding, {
          align: 'center',
          maxWidth: pageW - (padding * 2)
        });

        pdf?.autoPrint();
        window.open(pdf?.output('bloburl'), '_blank');
        return;
      }

      // A4 fallback
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const qrSize = 170;
      const x = (210 - qrSize) / 2;
      const y = 15;
      pdf?.addImage(imgData, 'PNG', x, y, qrSize, qrSize);
      pdf?.setFontSize(12);
      pdf?.text(productLabel, 105, y + qrSize + 8, {
        align: 'center',
        maxWidth: 180
      });
      pdf?.autoPrint();
      window.open(pdf?.output('bloburl'), '_blank');
    } catch (error) {
      console.error('Error printing QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!onGenerate) return;

    const hasExistingQr = !!product?.qrCode;
    if (hasExistingQr) {
      const confirmed = window.confirm('Ce produit possède déjà un QR code enregistré. Veux-tu le remplacer par le nouveau QR ?');
      if (!confirmed) return;
    }

    const newToken = `${Date.now()}`;
    const nextQrData = buildProductStockManagementUrl(newToken);

    setQrVersionToken(newToken);
    setQrData(nextQrData);

    setIsSaving(true);
    try {
      await onGenerate(nextQrData, qrConfig);
    } catch (error) {
      console.error('Error regenerating QR code:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const copyQRData = () => {
    if (navigator.clipboard && qrData) {
      navigator.clipboard?.writeText(qrData)?.catch((error) => {
        console.error('Error copying QR data:', error);
      });
    }
  };

  const getDataTypeDescription = () => {
    return 'QR code optimisé pour gérer le stock de ce produit. Accès direct au produit avec ouverture sur le mode mouvement de stock.';
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
                    <Input
                      label="Type de QR Code"
                      type="text"
                      value="URL Gestion Produit"
                      disabled
                    />
                    <p className="text-xs text-text-muted mt-1">
                      {getDataTypeDescription()}
                    </p>
                  </div>

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

                  <Select
                    label="Format d'impression"
                    options={printFormatOptions}
                    value={qrConfig?.printFormat}
                    onChange={(value) => handleConfigChange('printFormat', value)}
                  />

                  <div>
                    <div className="flex items-center gap-3">
                      <label className="relative cursor-pointer" title="Couleur du QR code">
                        <input
                          type="color"
                          value={qrConfig?.fgColor}
                          onChange={(e) => handleConfigChange('fgColor', e?.target?.value)}
                          className="sr-only"
                        />
                        <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center" style={{ backgroundColor: qrConfig?.fgColor }}>
                          <Icon name="QrCode" size={16} className="text-white mix-blend-difference" />
                        </div>
                      </label>

                      <label className="relative cursor-pointer" title="Couleur d'arrière-plan">
                        <input
                          type="color"
                          value={qrConfig?.bgColor}
                          onChange={(e) => handleConfigChange('bgColor', e?.target?.value)}
                          className="sr-only"
                        />
                        <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center" style={{ backgroundColor: qrConfig?.bgColor }}>
                          <Icon name="PaintBucket" size={16} className="text-black/70" />
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
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
                
                <div className="text-center space-y-2">
                  <p className="text-xs text-text-muted">
                    Le QR code permet un accès direct à la gestion des quantités de ce produit
                  </p>
                  {product?.qrCode && (
                    <p className="text-xs text-warning">
                      Un QR code est déjà enregistré pour ce produit.
                    </p>
                  )}
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
              onClick={handleRegenerate}
              disabled={!qrData || isSaving}
              loading={isSaving}
              iconName="RefreshCw"
              iconPosition="left"
            >
              {product?.qrCode ? 'Régénérer le QR' : 'Enregistrer ce QR'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
