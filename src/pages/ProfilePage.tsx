import React, { useState, useRef } from 'react';
import { 
  User, 
  Mail, 
  Camera, 
  Save, 
  Edit3, 
  Building, 
  Shield, 
  Award,
  Calendar,
  MapPin,
  Phone,
  Globe,
  Trash2,
  Plus,
  Check,
  X,
  Upload,
  AlertCircle
} from 'lucide-react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

// Profile section component
const ProfileSection: React.FC<{
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

// Input field component
const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  description?: string;
  required?: boolean;
}> = ({ label, value, onChange, placeholder, type = 'text', description, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
    />
    {description && (
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    )}
  </div>
);

// Certificate/License component
const CertificationItem: React.FC<{
  certification: string;
  onUpdate: (value: string) => void;
  onRemove: () => void;
}> = ({ certification, onUpdate, onRemove }) => (
  <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
    <Award className="h-4 w-4 text-blue-600" />
    <input
      type="text"
      value={certification}
      onChange={(e) => onUpdate(e.target.value)}
      className="flex-1 text-sm border-none outline-none bg-transparent"
      placeholder="Enter certification or license"
    />
    <button
      onClick={onRemove}
      className="p-1 text-red-600 hover:bg-red-50 rounded"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  </div>
);

export const ProfilePage: React.FC = () => {
  const { dbUser, updateUserProfile, uploadAvatar } = useSupabaseAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for editing
  const [editData, setEditData] = useState({
    name: dbUser?.name || '',
    email: dbUser?.email || '',
    phone: dbUser?.phone || '',
    company: dbUser?.company || '',
    title: dbUser?.title || '',
    website: dbUser?.website || '',
    address: dbUser?.address || '',
    licenseNumber: dbUser?.license_number || '',
    certifications: dbUser?.certifications || []
  });

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await updateUserProfile({
        name: editData.name,
        phone: editData.phone,
        company: editData.company,
        title: editData.title,
        website: editData.website,
        address: editData.address,
        license_number: editData.licenseNumber,
        certifications: editData.certifications
      });
      
      setSaveStatus('saved');
      setIsEditing(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: dbUser?.name || '',
      email: dbUser?.email || '',
      phone: dbUser?.phone || '',
      company: dbUser?.company || '',
      title: dbUser?.title || '',
      website: dbUser?.website || '',
      address: dbUser?.address || '',
      licenseNumber: dbUser?.license_number || '',
      certifications: dbUser?.certifications || []
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const addCertification = () => {
    setEditData(prev => ({
      ...prev,
      certifications: [...prev.certifications, '']
    }));
  };

  const updateCertification = (index: number, value: string) => {
    setEditData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => i === index ? value : cert)
    }));
  };

  const removeCertification = (index: number) => {
    setEditData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your account information and professional details
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
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
                    {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          
          {/* Avatar and Basic Info */}
          <ProfileSection
            title="Personal Information"
            description="Your basic account information"
            icon={User}
          >
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  {dbUser?.avatar_url ? (
                    <img
                      src={dbUser.avatar_url}
                      alt="Profile"
                      className="h-24 w-24 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
                      <User className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                    >
                      {avatarUploading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                
                {isEditing && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Click to upload new photo
                  </p>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Full Name"
                  value={isEditing ? editData.name : dbUser?.name || ''}
                  onChange={(value) => setEditData(prev => ({ ...prev, name: value }))}
                  placeholder="Enter your full name"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {dbUser?.email || 'No email provided'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed here. Contact support if needed.
                  </p>
                </div>
                
                <InputField
                  label="Phone Number"
                  value={isEditing ? editData.phone : dbUser?.phone || ''}
                  onChange={(value) => setEditData(prev => ({ ...prev, phone: value }))}
                  placeholder="+1 (555) 123-4567"
                  type="tel"
                />
                
                <InputField
                  label="Job Title"
                  value={isEditing ? editData.title : dbUser?.title || ''}
                  onChange={(value) => setEditData(prev => ({ ...prev, title: value }))}
                  placeholder="Electrical Engineer"
                />
              </div>
            </div>
          </ProfileSection>

          {/* Professional Information */}
          <ProfileSection
            title="Professional Information"
            description="Your company and professional details"
            icon={Building}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Company Name"
                value={isEditing ? editData.company : dbUser?.company || ''}
                onChange={(value) => setEditData(prev => ({ ...prev, company: value }))}
                placeholder="ABC Electrical Services"
              />
              
              <InputField
                label="Website"
                value={isEditing ? editData.website : dbUser?.website || ''}
                onChange={(value) => setEditData(prev => ({ ...prev, website: value }))}
                placeholder="https://company.com"
                type="url"
              />
              
              <div className="md:col-span-2">
                <InputField
                  label="Business Address"
                  value={isEditing ? editData.address : dbUser?.address || ''}
                  onChange={(value) => setEditData(prev => ({ ...prev, address: value }))}
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>
            </div>
          </ProfileSection>

          {/* Licenses & Certifications */}
          <ProfileSection
            title="Licenses & Certifications"
            description="Your professional licenses and certifications"
            icon={Shield}
          >
            <div className="space-y-4">
              <InputField
                label="Primary License Number"
                value={isEditing ? editData.licenseNumber : dbUser?.license_number || ''}
                onChange={(value) => setEditData(prev => ({ ...prev, licenseNumber: value }))}
                placeholder="EL-12345"
                description="Your electrical contractor or engineer license number"
              />
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Additional Certifications
                  </label>
                  {isEditing && (
                    <button
                      onClick={addCertification}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Certification
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {editData.certifications.length > 0 ? (
                    editData.certifications.map((cert, index) => (
                      <CertificationItem
                        key={index}
                        certification={cert}
                        onUpdate={(value) => updateCertification(index, value)}
                        onRemove={() => removeCertification(index)}
                      />
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic p-4 border border-gray-200 rounded-lg text-center">
                      No certifications added yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ProfileSection>

          {/* Account Information */}
          <ProfileSection
            title="Account Information"
            description="Your account status and subscription details"
            icon={Calendar}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    dbUser?.is_guest 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {dbUser?.is_guest ? 'Guest User' : 'Registered User'}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subscription Plan
                </label>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                    {dbUser?.subscription_tier || 'Free'}
                  </div>
                </div>
              </div>
              
              {dbUser?.created_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Member Since
                  </label>
                  <p className="text-sm text-gray-600">
                    {new Date(dbUser.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
            
            {dbUser?.is_guest && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Guest Account</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      You're using a guest account. Some features may be limited. Consider creating a full account to save your work permanently.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ProfileSection>

        </div>
      </div>
    </div>
  );
};