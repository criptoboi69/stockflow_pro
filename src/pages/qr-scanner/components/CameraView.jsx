import React, { useRef, useEffect, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CameraView = ({ 
  onScanSuccess, 
  onError, 
  isScanning, 
  currentLanguage = 'fr' 
}) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanningActive, setScanningActive] = useState(false);

  const translations = {
    fr: {
      cameraAccess: "Accès à la caméra",
      requestingCamera: "Demande d\'accès à la caméra...",
      positionQR: "Positionnez le code QR dans le cadre",
      scanningInProgress: "Scan en cours...",
      startScanning: "Démarrer le scan",
      stopScanning: "Arrêter le scan",
      cameraError: "Erreur d\'accès à la caméra",
      permissionDenied: "Permission refusée. Veuillez autoriser l\'accès à la caméra.",
      noCamera: "Aucune caméra détectée sur cet appareil.",
      tryAgain: "Réessayer"
    },
    en: {
      cameraAccess: "Camera Access",
      requestingCamera: "Requesting camera access...",
      positionQR: "Position QR code within the frame",
      scanningInProgress: "Scanning in progress...",
      startScanning: "Start Scanning",
      stopScanning: "Stop Scanning",
      cameraError: "Camera Access Error",
      permissionDenied: "Permission denied. Please allow camera access.",
      noCamera: "No camera detected on this device.",
      tryAgain: "Try Again"
    }
  };

  const t = translations?.[currentLanguage];

  useEffect(() => {
    return () => {
      if (stream) {
        stream?.getTracks()?.forEach(track => track?.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setIsLoading(true);
    try {
      if (!videoRef?.current) throw new Error('Video element not ready');

      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (!devices?.length) {
        throw new Error(t?.noCamera);
      }

      const preferredDevice =
        devices.find(d => /back|rear|environment/i.test(d.label || '')) || devices[0];

      setHasPermission(true);
      setScanningActive(true);

      const controls = await codeReaderRef.current.decodeFromVideoDevice(
        preferredDevice.deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const text = result.getText?.() || '';
            if (text) {
              onScanSuccess(text);
              controls.stop();
              setScanningActive(false);
              setStream(null);
            }
          }

          if (error && error?.name !== 'NotFoundException') {
            console.error('QR scan error:', error);
          }
        }
      );

      setStream(controls);
    } catch (error) {
      console.error('Camera access error:', error);
      setHasPermission(false);
      setScanningActive(false);
      onError(error?.name === 'NotAllowedError' ? t?.permissionDenied : (error?.message || t?.noCamera));
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    try {
      if (stream?.stop) {
        stream.stop();
      }
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    } catch (e) {
      console.error('Error stopping scanner:', e);
    }

    const src = videoRef?.current?.srcObject;
    if (src?.getTracks) {
      src.getTracks().forEach(track => track.stop());
    }

    setStream(null);
    setScanningActive(false);
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
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        


        {/* Scanning Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Scanning Frame */}
            <div className="w-64 h-64 border-2 border-primary rounded-2xl relative">
              {/* Corner Indicators */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg"></div>
              
              {/* Scanning Animation */}
              {scanningActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-1 bg-primary animate-pulse"></div>
                </div>
              )}
            </div>
            
            {/* Instructions */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
              <p className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-lg">
                {scanningActive ? t?.scanningInProgress : t?.positionQR}
              </p>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm">{t?.requestingCamera}</p>
            </div>
          </div>
        )}
      </div>
      {/* Camera Controls */}
      <div className="flex justify-center mt-6 space-x-4">
        {!stream ? (
          <Button 
            onClick={startCamera} 
            disabled={isLoading}
            className="px-8"
          >
            <Icon name="Camera" size={20} className="mr-2" />
            {t?.startScanning}
          </Button>
        ) : (
          <Button 
            onClick={stopCamera} 
            variant="outline"
          >
            <Icon name="Square" size={20} className="mr-2" />
            {t?.stopScanning}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CameraView;