/**
 * BoohPay service mocks for testing
 */

import { vi } from 'vitest';

export const mockBoohPayService = {
  createPayment: vi.fn(),
  confirmPayment: vi.fn(),
  refundPayment: vi.fn(),
  getPaymentStatus: vi.fn(),
};

// Mock the boohPayService
vi.mock('@/services/boohPayService', () => ({
  boohPayService: mockBoohPayService,
}));

export default mockBoohPayService;