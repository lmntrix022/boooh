import { describe, it, expect } from 'vitest';
import { formatAmount, validateAmount } from '@/services/mobileMoneyService';

describe('formatAmount', () => {
  it('should format amount with FCFA currency', () => {
    // Note: toLocaleString utilise un espace insécable (\u202f)
    expect(formatAmount(1000)).toMatch(/1[\s\u202f]000 FCFA/);
    expect(formatAmount(10000)).toMatch(/10[\s\u202f]000 FCFA/);
    expect(formatAmount(100000)).toMatch(/100[\s\u202f]000 FCFA/);
  });

  it('should handle decimal amounts', () => {
    const result = formatAmount(1234.56);
    expect(result).toContain('1');
    expect(result).toContain('234');
    expect(result).toContain('FCFA');
  });

  it('should handle zero', () => {
    expect(formatAmount(0)).toBe('0 FCFA');
  });

  it('should handle negative amounts', () => {
    expect(formatAmount(-1000)).toMatch(/-1[\s\u202f]000 FCFA/);
  });
});

describe('validateAmount', () => {
  it('should validate positive amounts', () => {
    const result = validateAmount(1000);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject zero or negative amounts', () => {
    const result = validateAmount(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Le montant doit être supérieur à 0 FCFA');
  });

  it('should reject amounts exceeding maximum', () => {
    const result = validateAmount(6000000);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Le montant dépasse la limite autorisée (5,000,000 FCFA)');
  });

  it('should accept maximum amount', () => {
    const result = validateAmount(5000000);
    expect(result.valid).toBe(true);
  });
});

