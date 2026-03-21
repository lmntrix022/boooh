import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { Check, X, AlertCircle, Mail, Phone, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  custom?: (value: string) => boolean;
  message?: string;
}

interface PremiumInputProps {
  id: string;
  label: string;
  placeholder?: string;
  helperText?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: 'text' | 'email' | 'tel' | 'url' | 'password';
  icon?: React.ReactNode;
  validation?: ValidationRule;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export const PremiumInput: React.FC<PremiumInputProps> = ({
  id,
  label,
  placeholder,
  helperText,
  value,
  onChange,
  onBlur,
  type = 'text',
  icon,
  validation,
  disabled = false,
  className,
  error: externalError
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  // Validation en temps réel
  useEffect(() => {
    if (!validation || !isTouched) return;

    let error = '';
    let valid = true;

    // Validation required
    if (validation.required && !value.trim()) {
      error = validation.message || 'Ce champ est requis';
      valid = false;
    }
    // Validation pattern
    else if (validation.pattern && value && !validation.pattern.test(value)) {
      error = validation.message || 'Format invalide';
      valid = false;
    }
    // Validation minLength
    else if (validation.minLength && value.length < validation.minLength) {
      error = validation.message || `Minimum ${validation.minLength} caractères`;
      valid = false;
    }
    // Validation maxLength
    else if (validation.maxLength && value.length > validation.maxLength) {
      error = validation.message || `Maximum ${validation.maxLength} caractères`;
      valid = false;
    }
    // Validation custom
    else if (validation.custom && value && !validation.custom(value)) {
      error = validation.message || 'Valeur invalide';
      valid = false;
    }

    setValidationError(error);
    setIsValid(valid);
  }, [value, validation, isTouched]);

  const hasError = externalError || validationError;
  const showValidation = isTouched && validation;

  return (
    <div className={cn("space-y-2", className)}>
      <Label 
        htmlFor={id} 
        className={cn(
          "text-sm font-medium transition-colors",
          hasError ? "text-red-600" : isFocused ? "text-blue-600" : "text-gray-700"
        )}
      >
        {label}
      </Label>
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
            {icon}
          </div>
        )}
        
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setIsTouched(true);
            onBlur?.();
          }}
          disabled={disabled}
          className={cn(
            "transition-all duration-300",
            "border-2 bg-white/80 backdrop-blur-sm",
            "focus:ring-4 focus:ring-blue-100/50",
            "placeholder:text-gray-400",
            icon && "pl-10",
            showValidation && "pr-10",
            // États de validation
            hasError && [
              "border-red-300 focus:border-red-400",
              "focus:ring-red-100/50",
              "shadow-lg shadow-red-100/20"
            ],
            isValid === true && [
              "border-green-300 focus:border-green-400",
              "focus:ring-green-100/50",
              "shadow-lg shadow-green-100/20"
            ],
            isFocused && !hasError && isValid !== true && [
              "border-blue-300 focus:border-blue-400",
              "shadow-lg shadow-blue-100/20"
            ],
            // Animation de focus
            isFocused && "scale-[1.02] transform",
            // Hover effect
            !disabled && "hover:shadow-md hover:shadow-blue-100/30"
          )}
        />
        
        {/* Icône de validation */}
        {showValidation && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid === true ? (
              <Check className="w-5 h-5 text-green-500 animate-in slide-in-from-right-2 duration-300" />
            ) : hasError ? (
              <X className="w-5 h-5 text-red-500 animate-in slide-in-from-right-2 duration-300" />
            ) : null}
          </div>
        )}
      </div>
      
      {/* Messages d'aide et d'erreur */}
      {(helperText || hasError) && (
        <div className="space-y-1">
          {helperText && (
            <p className="text-xs text-gray-500 animate-in fade-in duration-300">
              {helperText}
            </p>
          )}
          {hasError && (
            <p className="text-xs text-red-600 flex items-center gap-1 animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-3 h-3" />
              {hasError}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Composants spécialisés pour différents types d'inputs
export const EmailInput: React.FC<Omit<PremiumInputProps, 'type' | 'validation'> & { required?: boolean }> = ({ 
  required = false, 
  ...props 
}) => (
  <PremiumInput
    {...props}
    type="email"
    icon={<Mail className="w-4 h-4" />}
    validation={{
      required,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: required ? 'Email requis' : 'Format d\'email invalide'
    }}
  />
);

export const PhoneInput: React.FC<Omit<PremiumInputProps, 'type' | 'validation'> & { required?: boolean }> = ({ 
  required = false, 
  ...props 
}) => (
  <PremiumInput
    {...props}
    type="tel"
    icon={<Phone className="w-4 h-4" />}
    validation={{
      required,
      pattern: /^[\+]?[0-9\s\-\(\)]{10,}$/,
      message: required ? 'Téléphone requis' : 'Format de téléphone invalide'
    }}
  />
);

export const UrlInput: React.FC<Omit<PremiumInputProps, 'type' | 'validation'> & { required?: boolean }> = ({ 
  required = false, 
  ...props 
}) => (
  <PremiumInput
    {...props}
    type="url"
    icon={<Globe className="w-4 h-4" />}
    validation={{
      required,
      pattern: /^https?:\/\/.+/,
      message: required ? 'URL requise' : 'Format d\'URL invalide (doit commencer par http:// ou https://)'
    }}
  />
); 