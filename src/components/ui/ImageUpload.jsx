import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Icon from '../AppIcon';
import Image from '../AppImage';
import Button from './Button';

const ImageUpload = ({ 
  onUpload, 
  currentImage = null, 
  onRemove,
  maxSize = 20971520, // 20MB default
  accept = { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'] },
  disabled = false,
  capture = 'environment'
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    setError(null);

    // Handle rejected files
    if (rejectedFiles?.length > 0) {
      const rejection = rejectedFiles?.[0];
      if (rejection?.errors?.[0]?.code === 'file-too-large') {
        setError(`Fichier trop volumineux. Taille maximale: ${(maxSize / 1024 / 1024)?.toFixed(0)}MB`);
      } else if (rejection?.errors?.[0]?.code === 'file-invalid-type') {
        setError('Type de fichier non supporté. Utilisez JPEG, PNG, WebP ou GIF.');
      } else {
        setError('Erreur lors du téléchargement du fichier.');
      }
      return;
    }

    if (acceptedFiles?.length === 0) return;

    const file = acceptedFiles?.[0];
    
    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Upload file
    setUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError('Échec du téléchargement. Veuillez réessayer.');
      setPreview(currentImage);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  }, [onUpload, currentImage, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled: disabled || uploading
  });

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="space-y-2">
      {/* Preview */}
      {preview && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted border border-border">
          <Image
            src={preview}
            alt="Aperçu du produit"
            className="w-full h-full object-cover"
          />
          {!disabled && (
            <div className="absolute top-2 right-2 flex space-x-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={uploading}
              >
                <Icon name="Trash2" size={14} className="mr-1" />
                Supprimer
              </Button>
            </div>
          )}
        </div>
      )}
      {/* Upload Area */}
      {!preview && (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${
              isDragActive
                ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50 hover:bg-muted/50'
            }
            ${
              disabled || uploading
                ? 'opacity-50 cursor-not-allowed' :''
            }
          `}
        >
          <input {...getInputProps({ capture })} />
          
          <div className="flex flex-col items-center space-y-3">
            <div className={`p-3 rounded-full ${
              isDragActive ? 'bg-primary/10' : 'bg-muted'
            }`}>
              <Icon 
                name={uploading ? 'Loader2' : 'Upload'} 
                size={32} 
                className={`text-text-muted ${
                  uploading ? 'animate-spin' : ''
                }`}
              />
            </div>
            
            <div>
              <p className="text-sm font-medium text-text-primary">
                {uploading
                  ? 'Téléchargement en cours...'
                  : isDragActive
                  ? 'Déposez l\'image ici' :'Glissez-déposez une image ou cliquez pour sélectionner'
                }
              </p>
              <p className="text-xs text-text-muted mt-1">
                JPEG, PNG, WebP, GIF - Max {(maxSize / 1024 / 1024)?.toFixed(0)}MB
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-error/10 border border-error/20 rounded-md">
          <Icon name="AlertCircle" size={16} className="text-error" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
