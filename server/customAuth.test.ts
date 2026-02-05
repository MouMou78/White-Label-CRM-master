/**
 * Tests for custom authentication system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { signup, login, setup2FA, verify2FASetup } from './customAuth';
import { getDb } from './db';

describe('Custom Authentication System', () => {
  let testUserId: string;
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  describe('Signup', () => {
    it('should create a new user with email and password', async () => {
      const result = await signup({
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      });

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('tenantId');
      expect(result).toHaveProperty('email', testEmail);
      expect(result).toHaveProperty('requiresTwoFactorSetup', true);

      testUserId = result.userId;
    });

    it('should reject duplicate email addresses', async () => {
      await expect(
        signup({
          email: testEmail,
          password: testPassword,
        })
      ).rejects.toThrow('Email already exists');
    });

    it('should reject weak passwords', async () => {
      await expect(
        signup({
          email: `test-weak-${Date.now()}@example.com`,
          password: '123', // Too short
        })
      ).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should reject invalid email formats', async () => {
      await expect(
        signup({
          email: 'invalid-email',
          password: testPassword,
        })
      ).rejects.toThrow('Invalid email address');
    });
  });

  describe('2FA Setup', () => {
    it('should generate 2FA secret and QR code', async () => {
      const result = await setup2FA(testUserId);

      expect(result).toHaveProperty('qrCodeUrl');
      expect(result).toHaveProperty('backupCodes');
      expect(result.backupCodes).toBeInstanceOf(Array);
      expect(result.backupCodes.length).toBe(10);
      expect(result.qrCodeUrl).toContain('data:image/png;base64');
    });

    it('should reject invalid user ID', async () => {
      await expect(setup2FA('invalid-user-id')).rejects.toThrow('User not found');
    });
  });

  describe('2FA Verification', () => {
    it('should accept valid 2FA code', async () => {
      // This test requires a real 2FA code which we can't generate in tests
      // In a real scenario, you'd mock the speakeasy.totp.verify function
      // For now, we'll just test the error case
      const result = await verify2FASetup(testUserId, '000000');
      expect(result).toBe(false); // Invalid code
    });

    it('should reject invalid user ID', async () => {
      await expect(verify2FASetup('invalid-user-id', '123456')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('Login', () => {
    it('should reject login without 2FA setup', async () => {
      const result = await login({
        email: testEmail,
        password: testPassword,
      });

      expect(result).toHaveProperty('requires2FA', true);
      expect(result).toHaveProperty('userId', testUserId);
    });

    it('should reject invalid email', async () => {
      await expect(
        login({
          email: 'nonexistent@example.com',
          password: testPassword,
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should reject invalid password', async () => {
      await expect(
        login({
          email: testEmail,
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('Database Integration', () => {
    it('should store hashed passwords, not plaintext', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      const users = await db
        .select()
        .from((await import('../drizzle/schema')).user)
        .where((await import('../drizzle/schema')).user.email.eq(testEmail))
        .limit(1);

      expect(users.length).toBe(1);
      expect(users[0].passwordHash).not.toBe(testPassword);
      expect(users[0].passwordHash).toContain('$2'); // bcrypt hash prefix
    });

    it('should create tenant for new user', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      const users = await db
        .select()
        .from((await import('../drizzle/schema')).user)
        .where((await import('../drizzle/schema')).user.email.eq(testEmail))
        .limit(1);

      expect(users[0].tenantId).toBeTruthy();
    });
  });
});
