import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import productService from '../../services/productService';
import storageService from '../../services/storageService';
import Button from '../../components/ui/Button';
import Image from '../../components/AppImage';
import Icon from '../../components/AppIcon';

const ProductPhotoUpload = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      if (!productId) {
        setError('Produit introuvable');
        setLoading(false);
        return;
      }
      try {
        const data = await productService.getProduct(productId);
        setProduct(data);
      } catch (e) {
        setError('Impossible de charger le produit');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  const refreshProduct = async () => {
    if (!productId) return;
    const data = await productService.getProduct(productId);
    setProduct(data);
  };

  const handleDeleteImage = async (indexToDelete) => {
    if (!product?.id) return;

    if (!window.confirm('Supprimer cette photo du produit ?')) {
      return;
    }

    const currentUrls = Array.isArray(product?.imageUrls) ? [...product.imageUrls] : [];
    const currentPaths = Array.isArray(product?.imageFilePaths) ? [...product.imageFilePaths] : [];
    const removedPath = currentPaths[indexToDelete] || null;

    const nextUrls = currentUrls.filter((_, index) => index !== indexToDelete);
    const nextPaths = currentPaths.filter((_, index) => index !== indexToDelete);

    try {
      setUploading(true);
      setError('');
      setMessage('Suppression de la photo...');

      if (removedPath) {
        await storageService.deleteProductImage(removedPath);
      }

      await productService.updateProduct(product.id, {
        imageUrl: nextUrls[0] || null,
        imageFilePath: nextPaths[0] || null,
        imageUrls: nextUrls,
        imageFilePaths: nextPaths,
      });

      setProduct((prev) => ({
        ...prev,
        imageUrl: nextUrls[0] || null,
        imageFilePath: nextPaths[0] || null,
        imageUrls: nextUrls,
        imageFilePaths: nextPaths,
      }));

      setMessage('Photo supprimée avec succès.');
    } catch (e) {
      setError(e?.message || 'Échec de la suppression');
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (file, source = 'unknown') => {
    if (!file || !productId) return;
    const startedAt = performance.now();
    const nextTrace = {
      source,
      name: file?.name || 'image',
      type: file?.type || 'unknown',
      sizeMb: `${((file?.size || 0) / (1024 * 1024)).toFixed(2)} MB`,
      status: 'starting',
      fetchMs: null,
      totalMs: null,
    };
    setUploading(true);
    setError('');
    setMessage(`Upload de ${file.name || 'image'}...`);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('productId', productId);

      const fetchStartedAt = performance.now();
      const response = await fetch('/api/upload-product-image', { method: 'POST', body: formData });
      const fetchEndedAt = performance.now();
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Échec upload image');

      if (payload?.publicUrl) {
        setProduct((prev) => {
          if (!prev) return prev;
          const nextImageUrls = [...(Array.isArray(prev?.imageUrls) ? prev.imageUrls : []), payload.publicUrl]
            .filter(Boolean)
            .slice(0, 5);
          const nextImageFilePaths = [...(Array.isArray(prev?.imageFilePaths) ? prev.imageFilePaths : []), payload.filePath]
            .filter(Boolean)
            .slice(0, 5);
          return {
            ...prev,
            imageUrl: nextImageUrls?.[0] || prev?.imageUrl,
            imageFilePath: nextImageFilePaths?.[0] || prev?.imageFilePath,
            imageUrls: nextImageUrls,
            imageFilePaths: nextImageFilePaths,
          };
        });
      }

      setMessage('Photo ajoutée avec succès. Tu peux en prendre une autre directement.');
      setUploading(false);

      refreshProduct().catch((refreshError) => {
        console.error('[product-photo-upload] refreshProduct error', refreshError);
      });
      window.setTimeout(() => {
        refreshProduct().catch((refreshError) => {
          console.error('[product-photo-upload] delayed refreshProduct error', refreshError);
        });
      }, 350);

      const endedAt = performance.now();
      const successTrace = {
        ...nextTrace,
        status: 'success',
        fetchMs: `${Math.round(fetchEndedAt - fetchStartedAt)} ms`,
        totalMs: `${Math.round(endedAt - startedAt)} ms`,
      };
      console.log('[product-photo-upload] trace', successTrace);
    } catch (e) {
      const endedAt = performance.now();
      const errorTrace = {
        ...nextTrace,
        status: 'error',
        totalMs: `${Math.round(endedAt - startedAt)} ms`,
      };
      console.log('[product-photo-upload] trace', errorTrace);
      setError(e?.message || 'Échec du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background text-text-primary p-4">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-text-primary p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Ajouter une photo</h1>
          <p className="text-sm text-text-muted">{product?.name || 'Produit'} • {product?.sku || 'N/A'}</p>
        </div>
        <Button variant="ghost" onClick={() => navigate(`/products?product=${productId}&mode=edit`)}>
          Retour
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <p className="text-sm text-text-muted">Choisis caméra ou galerie. L’upload démarre automatiquement après sélection.</p>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          disabled={uploading}
          onChange={async (e) => {
            const file = e?.target?.files?.[0] || null;
            setError('');
            if (!file) {
              setMessage('');
              return;
            }
            await handleUpload(file, 'camera');
            if (e?.target) e.target.value = '';
          }}
          className="hidden"
        />

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={async (e) => {
            const file = e?.target?.files?.[0] || null;
            setError('');
            if (!file) {
              setMessage('');
              return;
            }
            await handleUpload(file, 'gallery');
            if (e?.target) e.target.value = '';
          }}
          className="hidden"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="default"
            iconName="Camera"
            iconPosition="left"
            disabled={uploading}
            onClick={() => cameraInputRef.current?.click()}
            className="w-full"
          >
            {uploading ? 'Upload en cours...' : 'Prendre une photo'}
          </Button>

          <Button
            variant="outline"
            iconName="Image"
            iconPosition="left"
            disabled={uploading}
            onClick={() => galleryInputRef.current?.click()}
            className="w-full"
          >
            Choisir depuis la galerie
          </Button>
        </div>

        <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-text-muted">
          Flux mobile simplifié : <span className="font-medium text-text-primary">ouvrir le produit → caméra ou galerie → upload direct</span>.
        </div>

        {message && <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">{message}</div>}
        {error && <div className="rounded-md border border-error/20 bg-error/10 p-3 text-sm text-destructive">{error}</div>}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Photos actuelles</h2>
          <span className="text-sm text-text-muted">{(product?.imageUrls || []).length}/5</span>
        </div>

        {(product?.imageUrls || []).length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {(product?.imageUrls || []).map((url, idx) => (
              <div key={`${url}-${idx}`} className="relative rounded-lg overflow-hidden border border-border aspect-square bg-muted">
                <Image src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(idx)}
                  disabled={uploading}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center shadow disabled:opacity-50"
                  aria-label={`Supprimer la photo ${idx + 1}`}
                  title="Supprimer la photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-text-muted flex items-center gap-2"><Icon name="ImageOff" size={16} />Aucune photo</div>
        )}
      </div>
    </div>
  );
};

export default ProductPhotoUpload;
