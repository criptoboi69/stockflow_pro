import React, { useRef, useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const baseFieldClass =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50';

const LocationModal = ({
  isOpen,
  onClose,
  location = null,
  mode = 'view', // 'view', 'edit', 'add'
  onSave,
  onDelete,
  onUploadImage,
  companyUsers = [],
  canEdit = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: '',
    status: 'active',
    description: '',
    address: '',
    capacity: 0,
    occupancy: 0,
    manager: '',
    phone: '',
    email: '',
    imageUrl: '',
    imageFilePath: '',
    imageUrls: [],
    imageFilePaths: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errors, setErrors] = useState({});
  const imageInputRef = useRef(null);

  const typeOptions = [
    { value: 'warehouse', label: 'Entrepôt' },
    { value: 'retail', label: 'Magasin' },
    { value: 'processing', label: 'Traitement' },
    { value: 'transit', label: 'Transit' },
    { value: 'showroom', label: 'Showroom' },
    { value: 'workshop', label: 'Atelier' },
    { value: 'truck', label: 'Camion' },
    { value: 'external', label: 'Externe' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Actif' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'inactive', label: 'Inactif' },
  ];

  useEffect(() => {
    if (location && (mode === 'view' || mode === 'edit')) {
      setFormData({
        name: location?.name || '',
        code: location?.code || '',
        type: location?.type || '',
        status: location?.status || 'active',
        description: location?.description || '',
        address: location?.address || '',
        capacity: Number(location?.capacity) || 0,
        occupancy: Number(location?.occupancy) || 0,
        manager: location?.manager || '',
        phone: location?.phone || '',
        email: location?.email || '',
        imageUrl: location?.imageUrl || '',
        imageFilePath: location?.imageFilePath || '',
        imageUrls: location?.imageUrls || [],
        imageFilePaths: location?.imageFilePaths || [],
      });
    } else if (mode === 'add') {
      setFormData({
        name: '',
        code: '',
        type: '',
        status: 'active',
        description: '',
        address: '',
        capacity: 0,
        occupancy: 0,
        manager: '',
        phone: '',
        email: '',
        imageUrl: '',
        imageFilePath: '',
        imageUrls: [],
        imageFilePaths: [],
      });
    }
    setErrors({});
  }, [location, mode, isOpen]);

  const generateLocationCode = () => {
    if (!formData?.name || !formData?.type) return;

    try {
      const typePrefix = String(formData?.type || 'LOC').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3) || 'LOC';
      const namePrefix = String(formData?.name || 'ZONE').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5) || 'ZONE';
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const generatedCode = `${typePrefix}-${namePrefix}-${randomSuffix}`;

      setFormData((prev) => ({ ...prev, code: generatedCode }));
      if (errors?.code) {
        setErrors((prev) => ({ ...prev, code: '' }));
      }
    } catch (error) {
      console.error('Error generating location code:', error);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'manager') {
      const selectedUser = companyUsers.find((user) => getManagerOptionValue(user) === value);
      setFormData((prev) => ({
        ...prev,
        manager: value,
        phone: selectedUser?.phone || prev.phone || '',
        email: selectedUser?.email || prev.email || '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (errors?.[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const getManagerOptionValue = (user) => user?.email || user?.id || '';

  const getManagerDisplayLabel = (user) => user?.fullName || user?.email || 'Utilisateur';

  const selectedManagerValue = (() => {
    const directMatch = companyUsers.find((user) => getManagerOptionValue(user) === formData?.manager);
    if (directMatch) return getManagerOptionValue(directMatch);

    const legacyMatch = companyUsers.find((user) => [user?.fullName, user?.email].includes(formData?.manager));
    return legacyMatch ? getManagerOptionValue(legacyMatch) : formData?.manager || '';
  })();

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.name?.trim()) {
      newErrors.name = "Le nom de l'emplacement est requis";
    }

    if (!formData?.code?.trim()) {
      newErrors.code = 'Le code est requis';
    }

    if (!formData?.type) {
      newErrors.type = 'Le type est requis';
    }

    if (formData?.capacity < 0) {
      newErrors.capacity = 'La capacité ne peut pas être négative';
    }

    if (formData?.occupancy < 0) {
      newErrors.occupancy = "L'occupation ne peut pas être négative";
    }

    if (formData?.occupancy > formData?.capacity && formData?.capacity > 0) {
      newErrors.occupancy = "L'occupation ne peut pas dépasser la capacité";
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      logger.error('Error saving location:', error);
      setErrors((prev) => ({
        ...prev,
        submit: error?.message || "Échec de l'enregistrement de l'emplacement",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'warehouse':
        return 'Warehouse';
      case 'retail':
      case 'showroom':
        return 'Store';
      case 'processing':
      case 'workshop':
        return 'Wrench';
      case 'transit':
      case 'truck':
        return 'Truck';
      case 'external':
        return 'MapPinned';
      default:
        return 'MapPin';
    }
  };

  const getOccupancyPercentage = (occupancy, capacity) => {
    return capacity > 0 ? Math.min(100, Math.round((occupancy / capacity) * 100)) : 0;
  };

  const getOccupancyColor = (percentage) => {
    if (percentage >= 90) return 'bg-error';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-success';
  };

  const handleImageUpload = async (file) => {
    if (!file || !location?.id || typeof onUploadImage !== 'function') return;
    setIsUploadingImage(true);
    try {
      const updatedLocation = await onUploadImage(location.id, file);
      if (updatedLocation) {
        setFormData((prev) => ({
          ...prev,
          imageUrl: updatedLocation?.imageUrl || prev.imageUrl,
          imageFilePath: updatedLocation?.imageFilePath || prev.imageFilePath,
          imageUrls: updatedLocation?.imageUrls || prev.imageUrls,
          imageFilePaths: updatedLocation?.imageFilePaths || prev.imageFilePaths,
        }));
      }
    } catch (error) {
      setErrors((prev) => ({ ...prev, submit: error?.message || 'Échec de l’upload de la photo.' }));
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!isOpen) return null;

  const isReadOnly = mode === 'view';
  const title =
    mode === 'add'
      ? 'Ajouter un emplacement'
      : mode === 'edit'
        ? "Modifier l'emplacement"
        : "Détails de l'emplacement";
  const canEditThis = canEdit && !isReadOnly;
  const canDeleteThis = canEdit && mode !== 'add' && typeof onDelete === 'function';
  const occupancyPercentage = getOccupancyPercentage(formData?.occupancy, formData?.capacity);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="flex h-screen w-full max-w-3xl flex-col overflow-hidden rounded-none bg-surface shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon name={getTypeIcon(formData?.type)} size={20} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Nom de l'emplacement <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData?.name}
                  onChange={(e) => handleInputChange('name', e?.target?.value)}
                  disabled={isReadOnly}
                  className={baseFieldClass}
                />
                {errors?.name && <p className="mt-1 text-sm text-error">{errors?.name}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Code <span className="text-error">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData?.code}
                    onChange={(e) => handleInputChange('code', e?.target?.value)}
                    disabled={isReadOnly}
                    className={baseFieldClass}
                    placeholder="ex: WH-A, STR-01"
                  />
                  {!isReadOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateLocationCode}
                      disabled={!formData?.name || !formData?.type}
                    >
                      Générer
                    </Button>
                  )}
                </div>
                {errors?.code && <p className="mt-1 text-sm text-error">{errors?.code}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Type d'emplacement <span className="text-error">*</span>
                </label>
                <select
                  value={formData?.type}
                  onChange={(e) => handleInputChange('type', e?.target?.value)}
                  disabled={isReadOnly}
                  className={baseFieldClass}
                >
                  <option value="">Sélectionner un type</option>
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors?.type && <p className="mt-1 text-sm text-error">{errors?.type}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Statut</label>
                <select
                  value={formData?.status}
                  onChange={(e) => handleInputChange('status', e?.target?.value)}
                  disabled={isReadOnly}
                  className={baseFieldClass}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Description</label>
                <textarea
                  rows={4}
                  value={formData?.description}
                  onChange={(e) => handleInputChange('description', e?.target?.value)}
                  disabled={isReadOnly}
                  className={`${baseFieldClass} resize-none`}
                  placeholder="Décris rapidement l'emplacement, son usage ou ses particularités"
                />
              </div>

              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-primary/10 p-2">
                    <Icon name="Image" size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">Photos emplacement</div>
                    <div className="mt-1 text-sm text-text-muted">
                      Bonne idée produit, mais la base ne possède pas encore les colonnes image pour les emplacements.
                    </div>
                    <div className="mt-2 text-xs text-text-muted">
                      Prochaine étape nécessaire : migration DB pour `image_url`, `image_file_path`, `image_urls`, `image_file_paths`.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Adresse</label>
                <input
                  type="text"
                  value={formData?.address}
                  onChange={(e) => handleInputChange('address', e?.target?.value)}
                  disabled={isReadOnly}
                  className={baseFieldClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Capacité</label>
                <input
                  type="number"
                  min="0"
                  value={formData?.capacity}
                  onChange={(e) => handleInputChange('capacity', parseInt(e?.target?.value, 10) || 0)}
                  disabled={isReadOnly}
                  className={baseFieldClass}
                />
                {errors?.capacity && <p className="mt-1 text-sm text-error">{errors?.capacity}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Responsable</label>
                <select
                  value={selectedManagerValue}
                  onChange={(e) => handleInputChange('manager', e?.target?.value)}
                  disabled={isReadOnly}
                  className={baseFieldClass}
                >
                  <option value="">Aucun responsable</option>
                  {companyUsers.map((user) => (
                    <option key={user.id} value={getManagerOptionValue(user)}>
                      {getManagerDisplayLabel(user)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Téléphone</label>
                <input
                  type="tel"
                  value={formData?.phone}
                  onChange={(e) => handleInputChange('phone', e?.target?.value)}
                  disabled={isReadOnly}
                  className={baseFieldClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Email</label>
                <input
                  type="email"
                  value={formData?.email}
                  onChange={(e) => handleInputChange('email', e?.target?.value)}
                  disabled={isReadOnly}
                  className={baseFieldClass}
                />
              </div>
            </div>
          </div>
        </div>

        {errors?.submit && (
          <div className="px-6 pb-2 text-sm text-error">{errors?.submit}</div>
        )}

        <div className="sticky bottom-0 border-t border-border bg-surface p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {canDeleteThis && (
                <Button
                  variant="danger"
                  onClick={() => onDelete(location?.id)}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  Supprimer
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:flex items-center gap-2 sm:gap-3">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                {isReadOnly ? 'Fermer' : 'Annuler'}
              </Button>

              {canEditThis && (
                <Button variant="default" onClick={handleSave} loading={isLoading} className="w-full sm:w-auto">
                  {mode === 'add' ? 'Ajouter' : 'Enregistrer'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
