import React from 'react';
import Icon from '../../../components/AppIcon';

const ScanInstructions = ({ currentLanguage = 'fr' }) => {
  const translations = {
    fr: {
      title: "Instructions de scan",
      tips: [
        {
          icon: "Camera",
          title: "Positionnement",
          description: "Tenez votre appareil stable et centrez le code QR dans le cadre"
        },
        {
          icon: "Sun",
          title: "Éclairage",
          description: "Assurez-vous d'avoir un bon éclairage, évitez les reflets"
        },
        {
          icon: "Focus",
          title: "Distance",
          description: "Maintenez une distance de 10-30 cm du code QR"
        },
        {
          icon: "Smartphone",
          title: "Stabilité",
          description: "Gardez l\'appareil immobile pendant le scan"
        }
      ],
      troubleshooting: "Problèmes de scan ?",
      troubleshootingTips: [
        "Nettoyez l'objectif de votre caméra",
        "Vérifiez que le code QR n'est pas endommagé",
        "Utilisez la saisie manuelle en alternative"
      ]
    },
    en: {
      title: "Scanning Instructions",
      tips: [
        {
          icon: "Camera",
          title: "Positioning",
          description: "Hold your device steady and center the QR code in the frame"
        },
        {
          icon: "Sun",
          title: "Lighting",
          description: "Ensure good lighting, avoid reflections"
        },
        {
          icon: "Focus",
          title: "Distance",
          description: "Maintain a distance of 10-30 cm from the QR code"
        },
        {
          icon: "Smartphone",
          title: "Stability",
          description: "Keep the device still during scanning"
        }
      ],
      troubleshooting: "Scanning Issues?",
      troubleshootingTips: [
        "Clean your camera lens",
        "Check that the QR code is not damaged",
        "Use manual input as an alternative"
      ]
    }
  };

  const t = translations?.[currentLanguage];

  return (
    <div className="w-full bg-surface border border-border rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-6">{t?.title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {t?.tips?.map((tip, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <Icon name={tip?.icon} size={16} className="text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-text-primary text-sm">{tip?.title}</h4>
              <p className="text-xs text-text-muted mt-1">{tip?.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-4">
        <div className="flex items-center mb-3">
          <Icon name="HelpCircle" size={16} className="text-warning mr-2" />
          <h4 className="font-medium text-text-primary text-sm">{t?.troubleshooting}</h4>
        </div>
        <ul className="space-y-1">
          {t?.troubleshootingTips?.map((tip, index) => (
            <li key={index} className="flex items-center text-xs text-text-muted">
              <div className="w-1 h-1 bg-text-muted rounded-full mr-2 flex-shrink-0"></div>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ScanInstructions;