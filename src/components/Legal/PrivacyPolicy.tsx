import React from 'react';
import { Shield, Eye, Lock, Users, Globe, Mail, Phone } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  const lastUpdated = "January 15, 2025";
  const effectiveDate = "January 15, 2025";

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Shield className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        </div>
        <div className="text-gray-600 space-y-1">
          <p><strong>Last Updated:</strong> {lastUpdated}</p>
          <p><strong>Effective Date:</strong> {effectiveDate}</p>
        </div>
      </div>

      {/* Introduction */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          At Load Calculator ("we," "our," or "us"), we are committed to protecting your privacy and personal data. 
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
          our electrical load calculation and project management application (the "Service").
        </p>
        <p className="text-gray-700 leading-relaxed">
          By using our Service, you agree to the collection and use of information in accordance with this policy.
        </p>
      </section>

      {/* Information We Collect */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Eye className="w-6 h-6 mr-2" />
          Information We Collect
        </h2>
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Name and email address (when you create an account)</li>
              <li>Company information (optional)</li>
              <li>Phone number (optional)</li>
              <li>Profile picture (optional)</li>
              <li>Billing information (for paid subscriptions)</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Project and Technical Data</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Electrical load calculations and project data</li>
              <li>Single line diagrams and technical drawings</li>
              <li>Site addresses and location data</li>
              <li>Project photos and documents</li>
              <li>Customer and client information (CRM features)</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Usage Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Log data (IP address, browser type, pages visited)</li>
              <li>Device information (device type, operating system)</li>
              <li>Usage patterns and feature interactions</li>
              <li>Performance and error logs</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How We Use Information */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Service Provision</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Provide and maintain our Service</li>
              <li>Process electrical calculations</li>
              <li>Store and manage your projects</li>
              <li>Enable collaboration features</li>
              <li>Process payments and subscriptions</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Communication & Support</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Send service-related notifications</li>
              <li>Provide customer support</li>
              <li>Send updates about new features</li>
              <li>Conduct user research (with consent)</li>
              <li>Respond to inquiries and feedback</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Service Improvement</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Analyze usage patterns</li>
              <li>Improve application performance</li>
              <li>Develop new features</li>
              <li>Fix bugs and technical issues</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Legal Compliance</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Comply with legal obligations</li>
              <li>Enforce our terms of service</li>
              <li>Protect rights and safety</li>
              <li>Respond to legal requests</li>
              <li>Maintain audit trails</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Legal Basis for Processing */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Legal Basis for Processing (GDPR)</h2>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-gray-700 leading-relaxed mb-4">
            For users in the European Union, we process your personal data based on the following legal grounds:
          </p>
          
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Contract:</strong> To provide our services and fulfill our contractual obligations</li>
            <li><strong>Legitimate Interest:</strong> To improve our services, ensure security, and conduct business operations</li>
            <li><strong>Consent:</strong> For marketing communications and optional features (you can withdraw consent at any time)</li>
            <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
          </ul>
        </div>
      </section>

      {/* Third-Party Integrations */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Globe className="w-6 h-6 mr-2" />
          Third-Party Integrations
        </h2>
        
        <p className="text-gray-700 leading-relaxed mb-4">
          Our Service integrates with third-party services to enhance functionality. When you use these integrations, 
          your data may be shared with these services according to their privacy policies:
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-gray-200 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Google Services</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Google Maps (for location services)</li>
              <li>• Google Drive (for file storage)</li>
              <li>• Gmail (for email integration)</li>
              <li>• Google OAuth (for authentication)</li>
            </ul>
          </div>

          <div className="border border-gray-200 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Business Tools</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• HubSpot (CRM integration)</li>
              <li>• CompanyCam (photo management)</li>
              <li>• Stripe (payment processing)</li>
              <li>• Supabase (data storage)</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> You can control which integrations to enable through your privacy settings. 
            Disabling integrations may limit some functionality.
          </p>
        </div>
      </section>

      {/* Data Security */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Lock className="w-6 h-6 mr-2" />
          Data Security
        </h2>
        
        <p className="text-gray-700 leading-relaxed mb-4">
          We implement appropriate technical and organizational measures to protect your personal data:
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Measures</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Encryption in transit (HTTPS/TLS)</li>
              <li>Encryption at rest for sensitive data</li>
              <li>Secure authentication (JWT tokens)</li>
              <li>Regular security updates</li>
              <li>Automated vulnerability scanning</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Organizational Measures</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Access controls and permissions</li>
              <li>Employee privacy training</li>
              <li>Regular security audits</li>
              <li>Incident response procedures</li>
              <li>Data minimization practices</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Your Rights */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-6 h-6 mr-2" />
          Your Privacy Rights
        </h2>
        
        <p className="text-gray-700 leading-relaxed mb-4">
          You have the following rights regarding your personal data:
        </p>

        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900">Right to Access</h3>
            <p className="text-gray-700">Request a copy of your personal data we hold</p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900">Right to Rectification</h3>
            <p className="text-gray-700">Request correction of inaccurate or incomplete data</p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900">Right to Erasure</h3>
            <p className="text-gray-700">Request deletion of your personal data</p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900">Right to Data Portability</h3>
            <p className="text-gray-700">Request your data in a portable format</p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900">Right to Withdraw Consent</h3>
            <p className="text-gray-700">Withdraw consent for data processing at any time</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-green-800">
            <strong>Exercise Your Rights:</strong> Visit your{' '}
            <a href="/privacy/data-rights" className="underline hover:no-underline">
              Data Rights Center
            </a>{' '}
            to access, export, or delete your data.
          </p>
        </div>
      </section>

      {/* Data Retention */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
        
        <p className="text-gray-700 leading-relaxed mb-4">
          We retain your personal data only as long as necessary for the purposes outlined in this policy:
        </p>

        <div className="bg-gray-50 p-4 rounded-lg">
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Account Data:</strong> Until you delete your account</li>
            <li><strong>Project Data:</strong> Until you delete projects or account</li>
            <li><strong>Activity Logs:</strong> 12 months for security and support</li>
            <li><strong>Guest Session Data:</strong> 30 days of inactivity</li>
            <li><strong>Billing Records:</strong> 7 years for tax and legal compliance</li>
            <li><strong>Support Communications:</strong> 3 years after case closure</li>
          </ul>
        </div>
      </section>

      {/* Contact Information */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Mail className="w-6 h-6 mr-2" />
          Contact Us
        </h2>
        
        <p className="text-gray-700 leading-relaxed mb-4">
          If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:
        </p>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-gray-700">
                <strong>Email:</strong>{' '}
                <a href="mailto:privacy@loadcalculator.com" className="text-blue-600 hover:underline">
                  privacy@loadcalculator.com
                </a>
              </span>
            </div>
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-gray-700">
                <strong>Phone:</strong> +1 (555) 123-4567
              </span>
            </div>
            <div className="text-gray-700 mt-4">
              <strong>Mailing Address:</strong><br />
              Load Calculator Privacy Team<br />
              123 Main Street<br />
              Anytown, ST 12345<br />
              United States
            </div>
          </div>
        </div>
      </section>

      {/* Updates to Policy */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
        
        <p className="text-gray-700 leading-relaxed mb-4">
          We may update this Privacy Policy from time to time. We will notify you of any changes by:
        </p>

        <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
          <li>Posting the new Privacy Policy on this page</li>
          <li>Updating the "Last Updated" date</li>
          <li>Sending you an email notification (for significant changes)</li>
          <li>Displaying a notice in the application</li>
        </ul>

        <p className="text-gray-700 leading-relaxed">
          Your continued use of the Service after changes become effective constitutes acceptance of the updated policy.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 pt-6">
        <p className="text-sm text-gray-500 text-center">
          This Privacy Policy is effective as of {effectiveDate} and was last updated on {lastUpdated}.
        </p>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;