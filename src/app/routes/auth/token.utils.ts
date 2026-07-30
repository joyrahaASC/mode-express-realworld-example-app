import * as jwt from 'jsonwebtoken';
import generateToken from './token.utils';

describe('token.utils', () => {
  describe('generateToken', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should generate a valid JWT token with user id', () => {
      const userId = 123;
      const token = generateToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should use JWT_SECRET from environment variable when available', () => {
      const userId = 456;
      const customSecret = 'customTestSecret';
      process.env.JWT_SECRET = customSecret;

      const token = generateToken(userId);
      const decoded = jwt.verify(token, customSecret) as any;

      expect(decoded.user.id).toBe(userId);
    });

    it('should use default secret "superSecret" when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      const userId = 789;

      const token = generateToken(userId);
      const decoded = jwt.verify(token, 'superSecret') as any;

      expect(decoded.user.id).toBe(userId);
    });

    it('should set token expiration to 60 days', () => {
      const userId = 321;
      const token = generateToken(userId);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'superSecret') as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      
      const expirationDays = (decoded.exp - decoded.iat) / (60 * 60 * 24);
      expect(expirationDays).toBe(60);
    });

    it('should encode user id in token payload', () => {
      const userId = 999;
      const token = generateToken(userId);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'superSecret') as any;

      expect(decoded.user).toBeDefined();
      expect(decoded.user.id).toBe(userId);
    });

    it('should generate different tokens for different user ids', () => {
      const token1 = generateToken(100);
      const token2 = generateToken(200);

      expect(token1).not.toBe(token2);
    });

    it('should handle zero as user id', () => {
      const userId = 0;
      const token = generateToken(userId);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'superSecret') as any;

      expect(decoded.user.id).toBe(0);
    });

    it('should handle negative user id', () => {
      const userId = -1;
      const token = generateToken(userId);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'superSecret') as any;

      expect(decoded.user.id).toBe(-1);
    });

    it('should handle large user id numbers', () => {
      const userId = Number.MAX_SAFE_INTEGER;
      const token = generateToken(userId);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'superSecret') as any;

      expect(decoded.user.id).toBe(userId);
    });
  });
});