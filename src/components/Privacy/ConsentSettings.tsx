import React, { useState, useEffect } from 'react';
import { Shield, Save, RefreshCw, AlertTriangle, CheckCircle, Eye, Mail, Share2, Database, Cookie } from 'lucide-react';

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  third_party_integrations: boolean;
  data_processing: boolean;
  email_communications: boolean;
}

interface ConsentType {
  name: string;
  description: string;
  required: boolean;
  category: string;
}

const ConsentSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [consentTypes, setConsentTypes] = useState<Record<string, ConsentType>>({});
  const [currentConsents, setCurrentConsents] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    third_party_integrations: false,
    data_processing: true,
    email_communications: false
  });
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    third_party_integrations: false,
    data_processing: true,
    email_communications: false
  });
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    loadConsentData();
  }, []);

  const loadConsentData = async () => {
    setLoading(true);
    try {
      // Load consent types
      const typesResponse = await fetch('/api/user-consent?action=consent_types');
      if (typesResponse.ok) {
        const typesData = await typesResponse.json();
        setConsentTypes(typesData.data);
      }

      // Load user's current consent status
      const token = localStorage.getItem('auth_token');
      if (token) {
        const statusResponse = await fetch('/api/user-consent?action=status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const consents = statusData.data.consents;
          
          const consentPrefs: ConsentPreferences = {
            essential: consents.essential?.granted ?? true,
            analytics: consents.analytics?.granted ?? false,
            marketing: consents.marketing?.granted ?? false,
            third_party_integrations: consents.third_party_integrations?.granted ?? false,
            data_processing: consents.data_processing?.granted ?? true,
            email_communications: consents.email_communications?.granted ?? false
          };

          setCurrentConsents(consentPrefs);
          setPreferences(consentPrefs);
          setLastUpdated(statusData.data.last_updated);
        }
      } else {
        // For guest users, load from localStorage
        const savedConsents = localStorage.getItem('user_consent_preferences');
        if (savedConsents) {
          const consents = JSON.parse(savedConsents);
          setCurrentConsents(consents);
          setPreferences(consents);
        }
      }
    } catch (error) {
      console.error('Error loading consent data:', error);
      setMessage({ type: 'error', text: 'Failed to load consent preferences.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        // For authenticated users
        const response = await fetch('/api/user-consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'update',
            consents: preferences,
            source: 'settings_page'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update consent preferences');
        }

        const data = await response.json();
        setMessage({ type: 'success', text: 'Consent preferences updated successfully.' });
        setCurrentConsents(preferences);
        setLastUpdated(data.data.timestamp);
      } else {
        // For guest users
        localStorage.setItem('user_consent_preferences', JSON.stringify(preferences));
        setMessage({ type: 'success', text: 'Consent preferences saved locally.' });
        setCurrentConsents(preferences);
        setLastUpdated(new Date().toISOString());
      }

      // Update tracking services
      updateTrackingServices(preferences);
    } catch (error) {
      console.error('Error saving consent preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save consent preferences. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawAll = async () => {
    if (!window.confirm('Are you sure you want to withdraw all non-essential consents? This may limit some functionality.')) {
      return;
    }

    setWithdrawing(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        const response = await fetch('/api/user-consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'withdraw_all',
            source: 'settings_page'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to withdraw consents');
        }

        const data = await response.json();
        setMessage({ type: 'success', text: 'All non-essential consents have been withdrawn.' });
        
        // Reload consent data
        await loadConsentData();
      } else {
        // For guest users
        const essentialOnly = {
          essential: true,
          analytics: false,
          marketing: false,
          third_party_integrations: false,
          data_processing: true,
          email_communications: false
        };
        
        localStorage.setItem('user_consent_preferences', JSON.stringify(essentialOnly));
        setPreferences(essentialOnly);
        setCurrentConsents(essentialOnly);
        setMessage({ type: 'success', text: 'All non-essential consents have been withdrawn.' });
      }

      // Update tracking services
      updateTrackingServices({
        essential: true,
        analytics: false,
        marketing: false,
        third_party_integrations: false,
        data_processing: true,
        email_communications: false
      });
    } catch (error) {
      console.error('Error withdrawing consents:', error);
      setMessage({ type: 'error', text: 'Failed to withdraw consents. Please try again.' });
    } finally {
      setWithdrawing(false);
    }
  };

  const updateTrackingServices = (consents: ConsentPreferences) => {
    // Update Google Analytics consent
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        analytics_storage: consents.analytics ? 'granted' : 'denied',
        ad_storage: consents.marketing ? 'granted' : 'denied'
      });
    }

    // Update local storage flags for other services
    localStorage.setItem('analytics_enabled', consents.analytics.toString());
    localStorage.setItem('marketing_enabled', consents.marketing.toString());
  };

  const getConsentIcon = (type: string) => {
    switch (type) {
      case 'essential': return <Cookie className="w-5 h-5 text-red-600" />;
      case 'analytics': return <Eye className="w-5 h-5 text-blue-600" />;
      case 'marketing': return <Mail className="w-5 h-5 text-purple-600" />;
      case 'third_party_integrations': return <Share2 className="w-5 h-5 text-green-600" />;
      case 'data_processing': return <Database className="w-5 h-5 text-orange-600" />;
      case 'email_communications': return <Mail className="w-5 h-5 text-indigo-600" />;
      default: return <Shield className="w-5 h-5 text-gray-600" />;
    }
  };

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(currentConsents);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading consent preferences...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Shield className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Privacy & Consent Settings</h1>
        </div>
        <p className="text-gray-600">
          Manage your privacy preferences and control how your data is used. You can change these settings at any time.
        </p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertTriangle className="w-5 h-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="mb-6 text-sm text-gray-500">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}

      {/* Consent Categories */}
      <div className="space-y-6 mb-8">
        {Object.entries(consentTypes).map(([key, type]) => (
          <div key={key} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start flex-1">
                <div className="mr-4 mt-1">
                  {getConsentIcon(key)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 mr-3">
                      {type.name}
                    </h3>
                    {type.required && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">
                    {type.description}
                  </p>
                  
                  {/* Additional info based on type */}
                  {key === 'third_party_integrations' && preferences[key] && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Enabled integrations:</strong> Google Drive, Gmail, HubSpot, CompanyCam
                      </p>
                    </div>
                  )}
                  
                  {key === 'analytics' && preferences[key] && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Analytics data collected:</strong> Page views, feature usage, performance metrics (anonymized)
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="ml-6">
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
                  <div className={`w-11 h-6 rounded-full peer transition-colors ${
                    type.required 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:bg-blue-600'
                  } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
        
        <button
          onClick={handleWithdrawAll}
          disabled={withdrawing}
          className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          {withdrawing ? 'Withdrawing...' : 'Withdraw All Consents'}
        </button>
      </div>

      {/* Info Section */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Rights</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• <strong>Right to Access:</strong> You can request a copy of your personal data</p>
          <p>• <strong>Right to Rectification:</strong> You can request corrections to your data</p>
          <p>• <strong>Right to Erasure:</strong> You can request deletion of your data</p>
          <p>• <strong>Right to Data Portability:</strong> You can request your data in a portable format</p>
          <p>• <strong>Right to Withdraw Consent:</strong> You can withdraw consent at any time</p>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            For questions about your data or to exercise your rights, contact our privacy team at{' '}
            <a href="mailto:privacy@loadcalculator.com" className="text-blue-600 hover:underline">
              privacy@loadcalculator.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsentSettings;