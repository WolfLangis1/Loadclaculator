import React, { useState, useEffect } from 'react';
import { X, Settings, Shield, Eye, Mail, Share2 } from 'lucide-react';

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  third_party_integrations: boolean;
  data_processing: boolean;
  email_communications: boolean;
}

interface ConsentBannerProps {
  onConsentUpdate?: (consents: ConsentPreferences) => void;
  onClose?: () => void;
  showCustomize?: boolean;
}

const ConsentBanner: React.FC<ConsentBannerProps> = ({
  onConsentUpdate,
  onClose,
  showCustomize = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consentTypes, setConsentTypes] = useState<any>({});
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true, // Always true
    analytics: false,
    marketing: false,
    third_party_integrations: false,
    data_processing: true, // Usually true for functional app
    email_communications: false
  });

  useEffect(() => {
    // Check if user has already given consent
    const consentGiven = localStorage.getItem('consent_banner_dismissed');
    const respectDoNotTrack = navigator.doNotTrack === '1';
    
    if (!consentGiven && !respectDoNotTrack) {
      setIsVisible(true);
      loadConsentTypes();
    }
  }, []);

  const loadConsentTypes = async () => {
    try {
      const response = await fetch('/api/user-consent?action=consent_types');
      if (response.ok) {
        const data = await response.json();
        setConsentTypes(data.data);
      }
    } catch (error) {
      console.error('Error loading consent types:', error);
    }
  };

  const handleAcceptAll = async () => {
    const allConsents = {
      essential: true,
      analytics: true,
      marketing: true,
      third_party_integrations: true,
      data_processing: true,
      email_communications: true
    };

    await updateConsent(allConsents);
  };

  const handleRejectNonEssential = async () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
      third_party_integrations: false,
      data_processing: true, // Keep for functionality
      email_communications: false
    };

    await updateConsent(essentialOnly);
  };

  const handleCustomSave = async () => {
    await updateConsent(preferences);
  };

  const updateConsent = async (consents: ConsentPreferences) => {
    setLoading(true);
    
    try {
      // For guest users, store in localStorage
      if (!localStorage.getItem('auth_token')) {
        localStorage.setItem('user_consent_preferences', JSON.stringify(consents));
        localStorage.setItem('consent_banner_dismissed', 'true');
      } else {
        // For authenticated users, send to API
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/user-consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'update',
            consents,
            source: 'consent_banner'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update consent preferences');
        }

        localStorage.setItem('consent_banner_dismissed', 'true');
      }

      // Update analytics and tracking based on consent
      updateTrackingServices(consents);
      
      if (onConsentUpdate) {
        onConsentUpdate(consents);
      }

      closeBanner();
    } catch (error) {
      console.error('Error updating consent:', error);
      alert('Failed to save consent preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateTrackingServices = (consents: ConsentPreferences) => {
    // Update Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        analytics_storage: consents.analytics ? 'granted' : 'denied',
        ad_storage: consents.marketing ? 'granted' : 'denied'
      });
    }

    // Update other tracking services based on consent
    if (!consents.analytics) {
      // Disable analytics tracking
      localStorage.removeItem('analytics_enabled');
    } else {
      localStorage.setItem('analytics_enabled', 'true');
    }

    if (!consents.marketing) {
      // Disable marketing pixels/tracking
      localStorage.removeItem('marketing_enabled');
    } else {
      localStorage.setItem('marketing_enabled', 'true');
    }
  };

  const closeBanner = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  const getConsentIcon = (type: string) => {
    switch (type) {
      case 'analytics': return <Eye className="w-4 h-4" />;
      case 'marketing': return <Mail className="w-4 h-4" />;
      case 'third_party_integrations': return <Share2 className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-4xl bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                We value your privacy
              </h3>
            </div>
            <button
              onClick={closeBanner}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Message */}
          <p className="text-gray-600 mb-6">
            We use cookies and similar technologies to provide, protect and improve our services 
            and to personalize content. You can customize your consent preferences below.
          </p>

          {/* Detailed Preferences */}
          {showDetails && (
            <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Customize Your Preferences</h4>
              
              {Object.entries(consentTypes).map(([key, type]: [string, any]) => (
                <div key={key} className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      {getConsentIcon(key)}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h5 className="font-medium text-gray-900 mr-2">
                          {type.name}
                        </h5>
                        {type.required && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {type.description}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={preferences[key as keyof ConsentPreferences]}
                        disabled={type.required}
                        onChange={(e) => {
                          if (!type.required) {
                            setPreferences(prev => ({
                              ...prev,
                              [key]: e.target.checked
                            }));
                          }
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAcceptAll}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Accept All'}
            </button>
            
            <button
              onClick={handleRejectNonEssential}
              disabled={loading}
              className="flex-1 bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject Non-Essential
            </button>

            {showCustomize && (
              <button
                onClick={() => {
                  if (showDetails) {
                    handleCustomSave();
                  } else {
                    setShowDetails(true);
                  }
                }}
                disabled={loading}
                className="flex-1 bg-white text-blue-600 px-6 py-3 rounded-lg font-medium border border-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                {showDetails ? (loading ? 'Saving...' : 'Save Preferences') : 'Customize'}
              </button>
            )}
          </div>

          {/* Footer Links */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500 text-center">
            <a href="/privacy-policy" className="hover:text-blue-600 transition-colors mr-4">
              Privacy Policy
            </a>
            <a href="/cookie-policy" className="hover:text-blue-600 transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;