import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  warning?: string;
  hint?: string;
  required?: boolean;
  inputId?: string;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = React.memo(({
  label,
  error,
  warning,
  hint,
  required,
  inputId,
  className = '',
  value,
  type = 'text',
  ...inputProps
}) => {
  const id = inputId || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = Boolean(error);
  const hasWarning = Boolean(warning);
  
  // Ensure controlled inputs always have defined values
  // For number inputs, use empty string instead of 0 to avoid leading zeros
  const safeValue = value === undefined || value === null ? '' : value;
  
  const inputClasses = `
    block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset
    placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6
    ${hasError ? 'ring-red-300 focus:ring-red-500' : 
      hasWarning ? 'ring-yellow-300 focus:ring-yellow-500' : 
      'ring-gray-300 focus:ring-blue-500'}
    disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200
    ${className}
  `.trim();

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={id}
          className={`block text-sm font-medium leading-6 ${
            hasError ? 'text-red-900' : 'text-gray-900'
          }`}
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">*</span>
          )}
        </label>
      )}
      
      <div className="relative">
        <input
          {...inputProps}
          type={type}
          value={safeValue}
          id={id}
          className={inputClasses}
          aria-invalid={hasError}
          aria-describedby={`${id}-description`}
          aria-required={required}
        />
        
        {(hasError || hasWarning) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle 
              className={`h-5 w-5 ${hasError ? 'text-red-500' : 'text-yellow-500'}`}
              aria-hidden="true"
            />
          </div>
        )}
      </div>
      
      <div id={`${id}-description`} className="space-y-1">
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        
        {warning && !error && (
          <p className="text-sm text-yellow-600" role="alert">
            {warning}
          </p>
        )}
        
        {hint && !error && !warning && (
          <p className="text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
});

ValidatedInput.displayName = 'ValidatedInput';