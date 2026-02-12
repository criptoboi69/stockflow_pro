import React, { useRef, useEffect, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CameraView = ({ onScanSuccess, onError, currentLanguage = 'fr' }) => {
  const videoRef = useRef(null);
  const detectorRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanningActive, setScanningActive] = useState(false);

  const translations = {
    fr: {
      requestingCamera: 'Demande d\'accès à la caméra...',
      positionQR: 'Positionnez le code QR dans le cadre',
      scanningInProgress: 'Scan en cours...',
      startScanning: 'Démarrer le scan',
      stopScanning: 'Arrêter le scan',
      cameraError: 'Erreur d\'accès à la caméra',
      permissionDenied: 'Permission refusée. Veuillez autoriser l\'accès à la caméra.',
      noCamera: 'Aucune caméra détectée sur cet appareil.',
      qrNotSupported: 'Votre navigateur ne supporte pas BarcodeDetector pour le scan caméra natif.',
      tryAgain: 'Réessayer'
    },
    en: {
      requestingCamera: 'Requesting camera access...',
      positionQR: 'Position QR code within the frame',
      scanningInProgress: 'Scanning in progress...',
      startScanning: 'Start Scanning',
      stopScanning: 'Stop Scanning',
      cameraError: 'Camera Access Error',
      permissionDenied: 'Permission denied. Please allow camera access.',
      noCamera: 'No camera detected on this device.',
      qrNotSupported: 'Your browser does not support BarcodeDetector for native camera scanning.',
      tryAgain: 'Try Again'
    }
  };

  const t = translations?.[currentLanguage];

  useEffect(() => () => stopCamera(), []);

  const stopScanLoop = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanningActive(false);
  };

  const startScanLoop = () => {
    if (!videoRef.current || !detectorRef.current) return;
    if (scanIntervalRef.current) return;

    setScanningActive(true);
    scanIntervalRef.current = setInterval(async () => {
      try {
        const barcodes = await detectorRef.current.detect(videoRef.current);
        if (barcodes?.length) {
          const rawValue = barcodes[0]?.rawValue;
          if (rawValue) {
            stopScanLoop();
            onScanSuccess(rawValue);
          }
        }
      } catch (error) {
        stopScanLoop();
        onError(error?.message || t?.cameraError);
      }
    }, 400);
  };

  const startCamera = async () => {
    setIsLoading(true);
    try {
      if (!('BarcodeDetector' in window)) {
        onError(t?.qrNotSupported);
      }

      const mediaStream = await navigator.mediaDevices?.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      setStream(mediaStream);
      setHasPermission(true);

      if ('BarcodeDetector' in window) {
        detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      if (detectorRef.current) {
        startScanLoop();
      }
    } catch (error) {
      setHasPermission(false);
      onError(error?.name === 'NotAllowedError' ? t?.permissionDenied : t?.noCamera);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    stopScanLoop();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  if (hasPermission === false) {
    return (
      <div className="w-full h-96 bg-muted rounded-2xl flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
          <Icon name="Camera" size={32} className="text-error" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">{t?.cameraError}</h3>
        <p className="text-text-muted text-center mb-6">{t?.permissionDenied}</p>
        <Button onClick={startCamera} variant="outline">
          <Icon name="RotateCcw" size={16} className="mr-2" />
          {t?.tryAgain}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div className="relative w-full h-96 bg-black rounded-2xl overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-64 h-64 border-2 border-primary rounded-2xl relative">
              <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg"></div>

              {scanningActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-1 bg-primary animate-pulse"></div>
                </div>
              )}
            </div>

            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
              <p className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-lg">
                {scanningActive ? t?.scanningInProgress : t?.positionQR}
              </p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm">{t?.requestingCamera}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center mt-6 space-x-4">
        {!stream ? (
          <Button onClick={startCamera} disabled={isLoading} className="px-8">
            <Icon name="Camera" size={20} className="mr-2" />
            {t?.startScanning}
          </Button>
        ) : (
          <Button onClick={stopCamera} variant="outline">
            <Icon name="Square" size={20} className="mr-2" />
            {t?.stopScanning}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CameraView;
