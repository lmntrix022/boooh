/**
 * ModernInput Component
 * 
 * Composant d'input moderne avec validation et suggestions
 * Extrait de ModernCardForm.tsx pour améliorer la maintenabilité
 */

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface ModernInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  suggestion?: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
}

export const ModernInput: React.FC<ModernInputProps> = ({ 
  label, 
  value, 
  onChange, 
  error, 
  suggestion, 
  required, 
  placeholder, 
  type = "text" 
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-light text-gray-700 mb-2 block"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          fontWeight: 300,
        }}
      >
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-12 px-4 py-3 bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-900 transition-all duration-200 font-light ${
          error ? 'border-red-300 focus:ring-red-200 focus:border-red-600' : 'border-gray-200'
        }`}
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          fontWeight: 300,
        }}
      />
      {error && (
        <motion.p 
          className="text-sm text-red-600 flex items-center space-x-2 font-light"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </motion.p>
      )}
      {suggestion && (
        <motion.p 
          className="text-sm text-gray-500 flex items-center space-x-2 font-light"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
          <span>{suggestion}</span>
        </motion.p>
      )}
    </div>
  );
};

export default ModernInput;
