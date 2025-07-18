import React, { useCallback } from 'react';
import { Heart } from 'lucide-react';

interface DonationButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const DonationButton: React.FC<DonationButtonProps> = ({ 
  className = '', 
  size = 'md',
  showText = true 
}) => {
  // Environment variable for Stripe Payment Link - configured in .env file
  const donationUrl = import.meta.env.REACT_APP_STRIPE_DONATION_URL || 'https://donate.stripe.com/test_00000000';

  const handleDonation = useCallback(() => {
    // Open Stripe Payment Link in a new tab
    window.open(donationUrl, '_blank', 'noopener,noreferrer');
  }, [donationUrl]);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  return (
    <div className="relative group">
      <button
        onClick={handleDonation}
        className={`
          flex items-center gap-1 sm:gap-2 
          ${sizeClasses[size]}
          bg-gradient-to-r from-pink-500 to-red-500 
          hover:from-pink-600 hover:to-red-600
          text-white rounded-lg 
          transition-all duration-200 
          focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2
          hover:shadow-lg hover:scale-105
          active:scale-95
          ${className}
        `}
        aria-label="Support development with a donation"
        title="This was developed by 1 person. If you find it resourceful then please consider donating here"
      >
        <Heart className={`${iconSizes[size]} fill-current`} aria-hidden="true" />
        {showText && (
          <span className="hidden sm:inline font-medium">
            Donate
          </span>
        )}
      </button>
      
      {/* Tooltip for mobile and additional context */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        <div className="text-center">
          <div className="font-medium">Support Development</div>
          <div className="text-gray-300 mt-1">
            This was developed by 1 person.<br />
            If you find it resourceful, please consider donating.
          </div>
        </div>
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

export default DonationButton;