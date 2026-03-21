import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MobileMoneyService } from '@/services/mobileMoneyService';

describe('MobileMoneyService', () => {
  describe('detectPaymentSystem', () => {
    it('should detect Airtel Money (07)', () => {
      expect(MobileMoneyService.detectPaymentSystem('07123456')).toBe('airtelmoney');
      expect(MobileMoneyService.detectPaymentSystem('24107123456')).toBe('airtelmoney');
      expect(MobileMoneyService.detectPaymentSystem('+241 07 12 34 56')).toBe('airtelmoney');
    });

    it('should detect Moov Money (06)', () => {
      expect(MobileMoneyService.detectPaymentSystem('06123456')).toBe('moovmoney4');
      expect(MobileMoneyService.detectPaymentSystem('24106123456')).toBe('moovmoney4');
      expect(MobileMoneyService.detectPaymentSystem('+241 06 12 34 56')).toBe('moovmoney4');
    });

    it('should return null for invalid numbers', () => {
      expect(MobileMoneyService.detectPaymentSystem('05123456')).toBeNull();
      expect(MobileMoneyService.detectPaymentSystem('08123456')).toBeNull();
      expect(MobileMoneyService.detectPaymentSystem('123456')).toBeNull();
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate Airtel numbers', () => {
      expect(MobileMoneyService.validatePhoneNumber('07123456')).toBe(true);
      expect(MobileMoneyService.validatePhoneNumber('24107123456')).toBe(true);
    });

    it('should validate Moov numbers', () => {
      expect(MobileMoneyService.validatePhoneNumber('06123456')).toBe(true);
      expect(MobileMoneyService.validatePhoneNumber('24106123456')).toBe(true);
    });

    it('should reject invalid numbers', () => {
      expect(MobileMoneyService.validatePhoneNumber('05123456')).toBe(false);
      expect(MobileMoneyService.validatePhoneNumber('1234')).toBe(false);
      expect(MobileMoneyService.validatePhoneNumber('')).toBe(false);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format phone numbers with country code', () => {
      expect(MobileMoneyService.formatPhoneNumber('24107123456')).toBe('+241 07 12 34 56');
      expect(MobileMoneyService.formatPhoneNumber('24106123456')).toBe('+241 06 12 34 56');
    });

    it('should format phone numbers without country code', () => {
      expect(MobileMoneyService.formatPhoneNumber('07123456')).toBe('+241 07 12 34 56');
      expect(MobileMoneyService.formatPhoneNumber('06123456')).toBe('+241 06 12 34 56');
    });

    it('should handle already formatted numbers', () => {
      const formatted = MobileMoneyService.formatPhoneNumber('+241 07 12 34 56');
      expect(formatted).toContain('07');
    });
  });

  describe('getOperatorName', () => {
    it('should return correct operator names', () => {
      expect(MobileMoneyService.getOperatorName('airtelmoney')).toBe('Airtel Money');
      expect(MobileMoneyService.getOperatorName('moovmoney4')).toBe('Moov Money');
    });

    it('should return the operator code for unknown operators', () => {
      expect(MobileMoneyService.getOperatorName('unknown')).toBe('unknown');
    });
  });

  describe('getPhoneInfo', () => {
    it('should return complete phone info for Airtel', () => {
      const info = MobileMoneyService.getPhoneInfo('07123456');
      
      expect(info.isValid).toBe(true);
      expect(info.operator).toBe('airtelmoney');
      expect(info.operatorName).toBe('Airtel Money');
      expect(info.formatted).toContain('07');
    });

    it('should return complete phone info for Moov', () => {
      const info = MobileMoneyService.getPhoneInfo('06123456');
      
      expect(info.isValid).toBe(true);
      expect(info.operator).toBe('moovmoney4');
      expect(info.operatorName).toBe('Moov Money');
      expect(info.formatted).toContain('06');
    });

    it('should handle invalid numbers', () => {
      const info = MobileMoneyService.getPhoneInfo('12345');
      
      expect(info.isValid).toBe(false);
      expect(info.operator).toBeNull();
      expect(info.operatorName).toBe('Inconnu');
    });
  });
});


