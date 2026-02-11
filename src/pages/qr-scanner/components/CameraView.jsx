import React, { useRef, useEffect, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CameraView = ({ 
  onScanSuccess, 
  onError, 
  isScanning, 
  currentLanguage = 'fr' 
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
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
      const mediaStream = await navigator.mediaDevices?.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      setHasPermission(true);
      
      if (videoRef?.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef?.current?.play();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setHasPermission(false);
      onError(error?.name === 'NotAllowedError' ? t?.permissionDenied : t?.noCamera);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream?.getTracks()?.forEach(track => track?.stop());
      setStream(null);
    }
    setScanningActive(false);
  };

  const simulateQRScan = () => {
    // Simulate QR code detection after 2-3 seconds
    setScanningActive(true);
    setTimeout(() => {
      const mockQRCode = "PRD-2024-001";
      onScanSuccess(mockQRCode);
      setScanningActive(false);
    }, 2500);
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
        
        {/* Canvas for QR detection (hidden) */}
        <canvas
          ref={canvasRef}
          className="hidden"
          width="640"
          height="480"
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
          <>
            <Button 
              onClick={simulateQRScan} 
              disabled={scanningActive}
              variant={scanningActive ? "secondary" : "default"}
              className="px-8"
            >
              <Icon name="QrCode" size={20} className="mr-2" />
              {scanningActive ? t?.scanningInProgress : "Scan QR"}
            </Button>
            <Button 
              onClick={stopCamera} 
              variant="outline"
            >
              <Icon name="Square" size={20} className="mr-2" />
              {t?.stopScanning}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraView;