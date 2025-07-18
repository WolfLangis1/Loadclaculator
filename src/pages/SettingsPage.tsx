import React, { useState } from 'react';
import { 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Settings, 
  Palette, 
  Calculator,
  Globe,
  FileText,
  Shield,
  Monitor,
  Bell,
  Key,
  ChevronRight,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { useUserSettings } from '../context/UserSettingsContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

// Section component for organizing settings
const SettingsSection: React.FC<{
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}> = ({ title, description, icon: Icon, children }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-blue-600" />
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

// Setting row component
const SettingRow: React.FC<{
  label: string;
  description?: string;
  children: React.ReactNode;
}> = ({ label, description, children }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
    <div className="flex-1">
      <label className="text-sm font-medium text-gray-900">{label}</label>
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </div>
    <div className="ml-4">
      {children}
    </div>
  </div>
);

export const SettingsPage: React.FC = () => {
  const { settings, setSetting, setMultipleSettings, resetSettings, exportSettings, importSettings, saveSettings } = useUserSettings();
  const { dbUser } = useSupabaseAuth();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [importFileRef, setImportFileRef] = useState<HTMLInputElement | null>(null);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await saveSettings();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      resetSettings();
    }
  };

  const handleExport = () => {
    const settingsData = exportSettings();
    const blob = new Blob([settingsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `load-calculator-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (importSettings(content)) {
          alert('Settings imported successfully!');
        } else {
          alert('Failed to import settings. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600 mt-1">
                Customize your Load Calculator experience
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              
              <label className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import
                <input
                  ref={setImportFileRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
              
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saveStatus === 'saving' ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : saveStatus === 'saved' ? (
                  <Check className="h-4 w-4" />
                ) : saveStatus === 'error' ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          
          {/* Theme & Display */}
          <SettingsSection
            title="Theme & Display"
            description="Customize the appearance and units"
            icon={Palette}
          >
            <SettingRow
              label="Theme"
              description="Choose your preferred color scheme"
            >
              <select
                value={settings.theme}
                onChange={(e) => setSetting('theme', e.target.value as 'light' | 'dark' | 'system')}
                className="text-sm border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </SettingRow>
            
            <SettingRow
              label="Units"
              description="Default measurement system"
            >
              <select
                value={settings.units}
                onChange={(e) => setSetting('units', e.target.value as 'imperial' | 'metric')}
                className="text-sm border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="imperial">Imperial</option>
                <option value="metric">Metric</option>
              </select>
            </SettingRow>
            
            <SettingRow
              label="Compact Mode"
              description="Show more content in less space"
            >
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={(e) => setSetting('compactMode', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </SettingRow>
          </SettingsSection>

          {/* Application Preferences */}
          <SettingsSection
            title="Application Preferences"
            description="Configure default behaviors and features"
            icon={Calculator}
          >
            <SettingRow
              label="Default Calculation Method"
              description="Method used for new projects"
            >
              <select
                value={settings.defaultCalculationMethod}
                onChange={(e) => setSetting('defaultCalculationMethod', e.target.value as 'standard' | 'optional' | 'existing')}
                className="text-sm border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="standard">NEC 220.42 Standard</option>
                <option value="optional">NEC 220.83 Optional</option>
                <option value="existing">NEC 220.87 Existing</option>
              </select>
            </SettingRow>
            
            <SettingRow
              label="Auto-Save"
              description="Automatically save your work"
            >
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => setSetting('autoSave', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </SettingRow>
            
            {settings.autoSave && (
              <SettingRow
                label="Save Interval"
                description="How often to auto-save (seconds)"
              >
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={settings.saveInterval}
                  onChange={(e) => setSetting('saveInterval', parseInt(e.target.value))}
                  className="text-sm border border-gray-300 rounded-md px-3 py-2 w-20"
                />
              </SettingRow>
            )}
            
            <SettingRow
              label="Show Advanced Features"
              description="Enable experimental and advanced tools"
            >
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showAdvancedFeatures}
                  onChange={(e) => setSetting('showAdvancedFeatures', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </SettingRow>
          </SettingsSection>

          {/* API Configuration */}
          <SettingsSection
            title="API Configuration"
            description="Configure external service integrations"
            icon={Key}
          >
            <SettingRow
              label="Use Real Aerial Data"
              description="Connect to Google Maps for satellite imagery"
            >
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.useRealAerialData}
                  onChange={(e) => setSetting('useRealAerialData', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </SettingRow>
            
            <SettingRow
              label="Aerial Provider"
              description="Choose your preferred map provider"
            >
              <select
                value={settings.aerialProvider}
                onChange={(e) => setSetting('aerialProvider', e.target.value as 'google' | 'mapbox')}
                className="text-sm border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="google">Google Maps</option>
                <option value="mapbox">Mapbox</option>
              </select>
            </SettingRow>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">API Keys</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    API keys are configured server-side for security. Contact your administrator to update API configurations.
                  </p>
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* Report Settings */}
          <SettingsSection
            title="Report Settings"
            description="Configure default report generation settings"
            icon={FileText}
          >
            <SettingRow
              label="Paper Size"
              description="Default paper size for reports"
            >
              <select
                value={settings.reportPaperSize}
                onChange={(e) => setSetting('reportPaperSize', e.target.value as 'letter' | 'a4')}
                className="text-sm border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="letter">Letter (8.5" × 11")</option>
                <option value="a4">A4 (210 × 297 mm)</option>
              </select>
            </SettingRow>
            
            <SettingRow
              label="Orientation"
              description="Default page orientation"
            >
              <select
                value={settings.reportOrientation}
                onChange={(e) => setSetting('reportOrientation', e.target.value as 'portrait' | 'landscape')}
                className="text-sm border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </SettingRow>
            
            <SettingRow
              label="Include Logo"
              description="Show company logo in reports"
            >
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.includeLogoInReports}
                  onChange={(e) => setSetting('includeLogoInReports', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </SettingRow>
          </SettingsSection>

          {/* User Interface */}
          <SettingsSection
            title="User Interface"
            description="Customize your interaction preferences"
            icon={Monitor}
          >
            <SettingRow
              label="Show Tooltips"
              description="Display helpful hints and explanations"
            >
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showTooltips}
                  onChange={(e) => setSetting('showTooltips', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </SettingRow>
            
            <SettingRow
              label="Keyboard Shortcuts"
              description="Enable keyboard shortcuts for faster navigation"
            >
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.keyboardShortcuts}
                  onChange={(e) => setSetting('keyboardShortcuts', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </SettingRow>
            
            <SettingRow
              label="Confirm Deletions"
              description="Show confirmation dialogs before deleting items"
            >
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.confirmDeletions}
                  onChange={(e) => setSetting('confirmDeletions', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </SettingRow>
            
            <SettingRow
              label="Notifications"
              description="Enable in-app notifications"
            >
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => setSetting('enableNotifications', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </SettingRow>
          </SettingsSection>

          {/* Professional Information */}
          <SettingsSection
            title="Professional Information"
            description="Information used in reports and certifications"
            icon={Shield}
          >
            <SettingRow
              label="Company Name"
              description="Your company or organization name"
            >
              <input
                type="text"
                value={settings.companyName || ''}
                onChange={(e) => setSetting('companyName', e.target.value)}
                placeholder="Enter company name"
                className="text-sm border border-gray-300 rounded-md px-3 py-2 w-64"
              />
            </SettingRow>
            
            <SettingRow
              label="License Number"
              description="Professional license or certification number"
            >
              <input
                type="text"
                value={settings.licenseNumber || ''}
                onChange={(e) => setSetting('licenseNumber', e.target.value)}
                placeholder="Enter license number"
                className="text-sm border border-gray-300 rounded-md px-3 py-2 w-64"
              />
            </SettingRow>
          </SettingsSection>

        </div>
      </div>
    </div>
  );
};