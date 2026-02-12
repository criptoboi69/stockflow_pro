import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ImportSection = ({ onImportStart, isImporting }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (e?.type === "dragenter" || e?.type === "dragover") {
      setDragActive(true);
    } else if (e?.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setDragActive(false);
    
    if (e?.dataTransfer?.files && e?.dataTransfer?.files?.[0]) {
      handleFileSelect(e?.dataTransfer?.files?.[0]);
    }
  };

  const handleFileSelect = async (file) => {
    if (file && file?.type === 'text/csv') {
      const text = await file.text();
      const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
      const headers = (lines[0] || '').split(',').map((h) => h.trim().toLowerCase());
      const get = (values, key) => values[headers.indexOf(key)] || '';
      const rows = lines.slice(1, 8).map((line, idx) => {
        const values = line.split(',').map((v) => v.trim());
        const name = get(values, 'name');
        const sku = get(values, 'sku');
        const quantity = Number(get(values, 'quantity'));
        const errors = [];
        if (!name) errors.push('Name is required');
        if (!sku) errors.push('SKU is required');
        if (Number.isNaN(quantity) || quantity < 0) errors.push('Quantity must be a non-negative number');
        return {
          row: idx + 1,
          name,
          sku,
          category: get(values, 'category'),
          quantity: Number.isNaN(quantity) ? '' : quantity,
          status: errors.length > 0 ? 'error' : 'valid',
          errors
        };
      });

      setPreviewRows(rows);
      setSelectedFile(file);
      setShowPreview(true);
    }
  };

  const handleFileInputChange = (e) => {
    if (e?.target?.files && e?.target?.files?.[0]) {
      handleFileSelect(e?.target?.files?.[0]);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      onImportStart(selectedFile);
      setSelectedFile(null);
      setPreviewRows([]);
      setShowPreview(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "name,sku,category,quantity,location,description\nSample Product,SAMPLE-001,Electronics,10,Warehouse A,Sample description";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL?.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    a?.click();
    window.URL?.revokeObjectURL(url);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 card-shadow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Import Products</h2>
          <p className="text-sm text-text-muted mt-1">Upload CSV file to add multiple products</p>
        </div>
        <Button
          variant="outline"
          onClick={downloadTemplate}
          iconName="Download"
          iconPosition="left"
        >
          Download Template
        </Button>
      </div>
      {!showPreview ? (
        <div
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-colors
            ${dragActive 
              ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="Upload" size={32} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Drop your CSV file here
              </h3>
              <p className="text-text-muted mb-4">
                or click to browse files
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef?.current?.click()}
                iconName="FileText"
                iconPosition="left"
              >
                Choose File
              </Button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <Icon name="FileText" size={20} className="text-primary" />
              <div>
                <p className="font-medium text-text-primary">{selectedFile?.name}</p>
                <p className="text-sm text-text-muted">
                  {(selectedFile?.size / 1024)?.toFixed(1)} KB • {previewRows?.length} rows detected
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedFile(null);
                setPreviewRows([]);
                setShowPreview(false);
              }}
            >
              <Icon name="X" size={16} />
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">Data Preview</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-border rounded-lg">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">Row</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">SKU</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows?.map((row, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="px-4 py-3 text-sm text-text-secondary">{row?.row}</td>
                      <td className="px-4 py-3 text-sm text-text-primary">{row?.name}</td>
                      <td className="px-4 py-3 text-sm text-text-primary">{row?.sku}</td>
                      <td className="px-4 py-3 text-sm text-text-primary">{row?.category}</td>
                      <td className="px-4 py-3 text-sm text-text-primary">{row?.quantity}</td>
                      <td className="px-4 py-3">
                        {row?.status === 'valid' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                            <Icon name="Check" size={12} className="mr-1" />
                            Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-error/10 text-error">
                            <Icon name="AlertCircle" size={12} className="mr-1" />
                            Error
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-text-muted">
              3 valid rows, 1 error found
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleImport}
                loading={isImporting}
                iconName="Upload"
                iconPosition="left"
              >
                Import Products
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportSection;