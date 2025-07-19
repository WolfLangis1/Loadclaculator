import React from 'react';
import { FileText, Shield, AlertTriangle, Scale, Users, Globe } from 'lucide-react';

const TermsOfService: React.FC = () => {
  const lastUpdated = "January 15, 2025";
  const effectiveDate = "January 15, 2025";

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <FileText className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
        </div>
        <div className="text-gray-600 space-y-1">
          <p><strong>Last Updated:</strong> {lastUpdated}</p>
          <p><strong>Effective Date:</strong> {effectiveDate}</p>
        </div>
      </div>

      {/* Acceptance */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Welcome to Load Calculator. These Terms of Service ("Terms") govern your use of the Load Calculator 
          application and related services (collectively, the "Service") operated by Load Calculator, Inc. ("we," "us," or "our").
        </p>
        <p className="text-gray-700 leading-relaxed">
          By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part 
          of these Terms, then you may not access the Service.
        </p>
      </section>

      {/* Service Description */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Load Calculator is a professional electrical load calculation and project management application that provides:
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>NEC-compliant residential and commercial electrical load calculations</li>
            <li>Single Line Diagram (SLD) creation and management tools</li>
            <li>Aerial view and site analysis capabilities</li>
            <li>Project management and collaboration features</li>
            <li>Customer relationship management (CRM) tools</li>
            <li>Third-party integrations (Google Drive, HubSpot, etc.)</li>
            <li>Data export and reporting capabilities</li>
          </ul>
        </div>
      </section>

      {/* User Accounts */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-6 h-6 mr-2" />
          3. User Accounts
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Registration</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              To access certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Types</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border border-gray-200 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900">Free Tier</h4>
                <p className="text-sm text-gray-600">Basic load calculations and limited projects</p>
              </div>
              <div className="border border-gray-200 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900">Pro Tier</h4>
                <p className="text-sm text-gray-600">Advanced features and unlimited projects</p>
              </div>
              <div className="border border-gray-200 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900">Enterprise</h4>
                <p className="text-sm text-gray-600">Team collaboration and enterprise features</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Acceptable Use */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="w-6 h-6 mr-2" />
          4. Acceptable Use Policy
        </h2>
        
        <p className="text-gray-700 leading-relaxed mb-4">You agree not to use the Service to:</p>

        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold text-red-900 mb-2 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Prohibited Activities
            </h3>
            <ul className="list-disc list-inside text-red-800 space-y-1">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon intellectual property rights</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Use the Service for competitive intelligence</li>
              <li>Share account credentials with unauthorized parties</li>
              <li>Reverse engineer or decompile the application</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">Professional Use</h3>
            <p className="text-green-800">
              Our Service is designed for professional electrical contractors, engineers, and related professionals. 
              All calculations and designs should be reviewed by qualified professionals before implementation.
            </p>
          </div>
        </div>
      </section>

      {/* Professional Disclaimer */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2 text-orange-600" />
          5. Professional Disclaimer
        </h2>
        
        <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
          <h3 className="font-semibold text-orange-900 mb-3">IMPORTANT PROFESSIONAL NOTICE</h3>
          <div className="text-orange-800 space-y-3">
            <p>
              <strong>Professional Review Required:</strong> All electrical calculations, load analyses, and single line diagrams 
              generated by this Service must be reviewed, verified, and approved by a licensed electrical engineer or qualified 
              electrical professional before implementation.
            </p>
            <p>
              <strong>Code Compliance:</strong> While our calculations are based on the National Electrical Code (NEC) and industry standards, 
              local codes, amendments, and specific site conditions may require modifications. Users are responsible for ensuring 
              compliance with all applicable local codes and regulations.
            </p>
            <p>
              <strong>No Engineering Services:</strong> This Service provides computational tools and does not constitute professional 
              engineering services. We do not provide engineering advice, consultations, or professional certifications.
            </p>
            <p>
              <strong>User Responsibility:</strong> You acknowledge that electrical work involves inherent risks and that improper 
              calculations or installations can result in property damage, injury, or death. You assume all responsibility for 
              the accuracy and appropriateness of any calculations or designs created using our Service.
            </p>
          </div>
        </div>
      </section>

      {/* Payment Terms */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Payment Terms</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscription Fees</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              Paid subscriptions are billed in advance on a monthly or annual basis. Fees are non-refundable except as required by law.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Processing</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Payments are processed securely through Stripe</li>
              <li>You authorize us to charge your payment method for all fees</li>
              <li>Failed payments may result in service suspension</li>
              <li>You're responsible for any applicable taxes</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancellation and Refunds</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>You may cancel your subscription at any time</li>
              <li>Service continues until the end of your current billing period</li>
              <li>No refunds for partial months or unused services</li>
              <li>Data export available for 30 days after cancellation</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Intellectual Property */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property Rights</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Rights</h3>
            <p className="text-gray-700 leading-relaxed">
              The Service, including its design, code, features, and content, is owned by us and protected by 
              intellectual property laws. You may not copy, modify, distribute, or create derivative works without permission.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Content</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              You retain ownership of the content you create using our Service, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Project data and calculations</li>
              <li>Single line diagrams and drawings</li>
              <li>Customer and project information</li>
              <li>Files and documents you upload</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              You grant us a limited license to store, process, and display your content solely to provide the Service.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy and Data Protection */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacy and Data Protection</h2>
        
        <p className="text-gray-700 leading-relaxed mb-4">
          Your privacy is important to us. Please review our{' '}
          <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>{' '}
          for information about how we collect, use, and protect your data.
        </p>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Data Security</h3>
          <p className="text-blue-800">
            We implement industry-standard security measures to protect your data, including encryption, 
            access controls, and regular security audits. However, no system is completely secure, and you 
            use the Service at your own risk.
          </p>
        </div>
      </section>

      {/* Limitation of Liability */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Scale className="w-6 h-6 mr-2" />
          9. Limitation of Liability
        </h2>
        
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <p className="text-yellow-900 font-semibold mb-3">IMPORTANT LEGAL NOTICE</p>
          <div className="text-yellow-800 space-y-3">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED 
              DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
            <p>
              OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING TO THE SERVICE SHALL NOT 
              EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
            <p>
              SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES, SO THE ABOVE 
              LIMITATIONS MAY NOT APPLY TO YOU.
            </p>
          </div>
        </div>
      </section>

      {/* Indemnification */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
        
        <p className="text-gray-700 leading-relaxed">
          You agree to indemnify, defend, and hold harmless Load Calculator, its officers, directors, employees, 
          and agents from any claims, damages, losses, liabilities, and expenses (including attorney's fees) 
          arising from your use of the Service, violation of these Terms, or infringement of any rights of another.
        </p>
      </section>

      {/* Termination */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">By You</h3>
            <p className="text-gray-700 leading-relaxed">
              You may terminate your account at any time through your account settings or by contacting us. 
              Upon termination, your right to use the Service will cease immediately.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">By Us</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              We may terminate or suspend your account immediately if you:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Violate these Terms</li>
              <li>Fail to pay subscription fees</li>
              <li>Engage in prohibited activities</li>
              <li>Pose a security risk to the Service</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Effect of Termination</h3>
            <p className="text-gray-700 leading-relaxed">
              Upon termination, you will lose access to your account and data. We will provide a reasonable 
              opportunity to export your data, but we are not obligated to maintain your data indefinitely.
            </p>
          </div>
        </div>
      </section>

      {/* Governing Law */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Globe className="w-6 h-6 mr-2" />
          12. Governing Law and Disputes
        </h2>
        
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, 
            United States, without regard to its conflict of law provisions.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Dispute Resolution</h3>
            <p className="text-gray-700 leading-relaxed">
              Any disputes arising from these Terms or your use of the Service shall be resolved through binding 
              arbitration in accordance with the Commercial Arbitration Rules of the American Arbitration Association.
            </p>
          </div>
        </div>
      </section>

      {/* Changes to Terms */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
        
        <p className="text-gray-700 leading-relaxed mb-4">
          We reserve the right to modify these Terms at any time. If we make material changes, we will notify you by:
        </p>

        <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
          <li>Posting the updated Terms on our website</li>
          <li>Sending you an email notification</li>
          <li>Displaying a notice in the application</li>
          <li>Requiring acceptance before continued use</li>
        </ul>

        <p className="text-gray-700 leading-relaxed">
          Your continued use of the Service after changes become effective constitutes acceptance of the new Terms.
        </p>
      </section>

      {/* Contact Information */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
        
        <p className="text-gray-700 leading-relaxed mb-4">
          If you have questions about these Terms, please contact us:
        </p>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="space-y-2">
            <p className="text-gray-700">
              <strong>Email:</strong>{' '}
              <a href="mailto:legal@loadcalculator.com" className="text-blue-600 hover:underline">
                legal@loadcalculator.com
              </a>
            </p>
            <p className="text-gray-700">
              <strong>Address:</strong><br />
              Load Calculator, Inc.<br />
              123 Main Street<br />
              Anytown, ST 12345<br />
              United States
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 pt-6">
        <p className="text-sm text-gray-500 text-center">
          These Terms of Service are effective as of {effectiveDate} and were last updated on {lastUpdated}.
        </p>
      </footer>
    </div>
  );
};

export default TermsOfService;