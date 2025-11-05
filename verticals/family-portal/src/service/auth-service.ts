/**
 * Family Auth Service
 *
 * Handles authentication and authorization for family members
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UUID, UserContext } from '@care-commons/core';
import type {
  FamilyMember,
  FamilyAuthResponse,
  FamilyLoginCredentials,
  CreateFamilyMemberInput,
  UpdateFamilyMemberInput,
} from '../types/index.js';
import { FamilyMemberRepository } from '../repository/index.js';

const SALT_ROUNDS = 10;
const JWT_EXPIRATION = '7d';
const REFRESH_TOKEN_EXPIRATION = '30d';
const PASSWORD_RESET_EXPIRATION_HOURS = 24;

export class FamilyAuthService {
  constructor(
    private familyMemberRepository: FamilyMemberRepository,
    private jwtSecret: string
  ) {}

  /**
   * Register a new family member
   */
  async register(input: CreateFamilyMemberInput, context: UserContext): Promise<FamilyMember> {
    // Check if email already exists
    const existing = await this.familyMemberRepository.findByEmail(input.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create family member
    const familyMember: Partial<FamilyMember> = {
      organizationId: input.organizationId,
      clientId: input.clientId,
      authorizedContactId: input.authorizedContactId,
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      relationship: input.relationship,
      phone: input.phone,
      status: 'ACTIVE',
      permissions: input.permissions,
      accessLevel: input.accessLevel,
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
        theme: 'auto',
      },
      notificationSettings: {
        email: {
          enabled: true,
          careUpdates: true,
          visitReminders: true,
          emergencyAlerts: true,
          chatMessages: false,
        },
        sms: {
          enabled: false,
          emergencyOnly: true,
        },
        push: {
          enabled: false,
          careUpdates: false,
          chatMessages: false,
        },
      },
      lastPasswordChangeAt: new Date(),
    };

    return await this.familyMemberRepository.create(familyMember, context);
  }

  /**
   * Login with email and password
   */
  async login(credentials: FamilyLoginCredentials): Promise<FamilyAuthResponse> {
    // Find family member
    const familyMember = await this.familyMemberRepository.findByEmail(
      credentials.email.toLowerCase()
    );

    if (!familyMember) {
      throw new Error('Invalid email or password');
    }

    // Check status
    if (familyMember.status !== 'ACTIVE') {
      throw new Error(`Account is ${familyMember.status.toLowerCase()}`);
    }

    // Verify password
    const isValid = await bcrypt.compare(credentials.password, familyMember.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await this.familyMemberRepository.updateLastLogin(familyMember.id);

    // Generate tokens
    const token = this.generateToken(familyMember);
    const refreshToken = this.generateRefreshToken(familyMember);

    // Remove sensitive data
    const { passwordHash, passwordResetToken, passwordResetExpires, ...safeFamilyMember } =
      familyMember;

    return {
      familyMember: safeFamilyMember,
      token,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<FamilyMember> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as {
        familyMemberId: UUID;
        email: string;
      };

      const familyMember = await this.familyMemberRepository.findById(decoded.familyMemberId);
      if (!familyMember || familyMember.status !== 'ACTIVE') {
        throw new Error('Invalid token');
      }

      return familyMember;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<FamilyAuthResponse> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret) as {
        familyMemberId: UUID;
        type: string;
      };

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      const familyMember = await this.familyMemberRepository.findById(decoded.familyMemberId);
      if (!familyMember || familyMember.status !== 'ACTIVE') {
        throw new Error('Invalid token');
      }

      // Generate new tokens
      const token = this.generateToken(familyMember);
      const newRefreshToken = this.generateRefreshToken(familyMember);

      const { passwordHash, passwordResetToken, passwordResetExpires, ...safeFamilyMember } =
        familyMember;

      return {
        familyMember: safeFamilyMember,
        token,
        refreshToken: newRefreshToken,
        expiresIn: 7 * 24 * 60 * 60,
      };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ token: string }> {
    const familyMember = await this.familyMemberRepository.findByEmail(email.toLowerCase());

    if (!familyMember) {
      // Don't reveal if email exists
      return { token: '' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_EXPIRATION_HOURS);

    await this.familyMemberRepository.updatePasswordResetToken(
      familyMember.id,
      resetToken,
      expiresAt
    );

    return { token: resetToken };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const familyMember = await this.familyMemberRepository.findByPasswordResetToken(token);

    if (!familyMember) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear reset token
    await this.familyMemberRepository.update(
      familyMember.id,
      {
        passwordHash,
        lastPasswordChangeAt: new Date(),
        passwordResetToken: null,
        passwordResetExpires: null,
      } as Partial<FamilyMember>,
      {
        userId: familyMember.id,
        roles: ['FAMILY'],
        permissions: [],
        organizationId: familyMember.organizationId,
        branchIds: [],
      }
    );
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(
    familyMemberId: UUID,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const familyMember = await this.familyMemberRepository.findById(familyMemberId);

    if (!familyMember) {
      throw new Error('Family member not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, familyMember.passwordHash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await this.familyMemberRepository.update(
      familyMemberId,
      {
        passwordHash,
        lastPasswordChangeAt: new Date(),
      } as Partial<FamilyMember>,
      {
        userId: familyMemberId,
        roles: ['FAMILY'],
        permissions: [],
        organizationId: familyMember.organizationId,
        branchIds: [],
      }
    );
  }

  /**
   * Update family member profile
   */
  async updateProfile(
    familyMemberId: UUID,
    updates: UpdateFamilyMemberInput
  ): Promise<FamilyMember> {
    const familyMember = await this.familyMemberRepository.findById(familyMemberId);

    if (!familyMember) {
      throw new Error('Family member not found');
    }

    const context: UserContext = {
      userId: familyMemberId,
      roles: ['FAMILY'],
      permissions: [],
      organizationId: familyMember.organizationId,
      branchIds: [],
    };

    return await this.familyMemberRepository.update(
      familyMemberId,
      updates as Partial<FamilyMember>,
      context
    );
  }

  /**
   * Generate JWT access token
   */
  private generateToken(familyMember: FamilyMember): string {
    return jwt.sign(
      {
        familyMemberId: familyMember.id,
        email: familyMember.email,
        clientId: familyMember.clientId,
        permissions: familyMember.permissions,
        accessLevel: familyMember.accessLevel,
      },
      this.jwtSecret,
      { expiresIn: JWT_EXPIRATION }
    );
  }

  /**
   * Generate JWT refresh token
   */
  private generateRefreshToken(familyMember: FamilyMember): string {
    return jwt.sign(
      {
        familyMemberId: familyMember.id,
        type: 'refresh',
      },
      this.jwtSecret,
      { expiresIn: REFRESH_TOKEN_EXPIRATION }
    );
  }
}
