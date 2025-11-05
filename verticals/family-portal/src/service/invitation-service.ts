/**
 * Family Invitation Service
 *
 * Manages family member invitations
 */

import crypto from 'crypto';
import { UUID, UserContext } from '@care-commons/core';
import type {
  FamilyInvitation,
  CreateInvitationInput,
  AcceptInvitationInput,
} from '../types/index.js';
import { FamilyInvitationRepository, FamilyMemberRepository } from '../repository/index.js';
import { FamilyAuthService } from './auth-service.js';

const DEFAULT_INVITATION_EXPIRY_DAYS = 7;

export class FamilyInvitationService {
  constructor(
    private invitationRepository: FamilyInvitationRepository,
    private familyMemberRepository: FamilyMemberRepository,
    private authService: FamilyAuthService
  ) {}

  /**
   * Create and send invitation
   */
  async createInvitation(
    input: CreateInvitationInput,
    context: UserContext
  ): Promise<FamilyInvitation> {
    // Check if family member already exists with this email
    const existing = await this.familyMemberRepository.findByEmail(input.email);
    if (existing) {
      throw new Error('Family member with this email already exists');
    }

    // Check for pending invitations
    const pendingInvitations = await this.invitationRepository.findByEmail(input.email);
    const activePending = pendingInvitations.find(
      (inv) => inv.status === 'PENDING' && inv.expiresAt > new Date()
    );

    if (activePending) {
      throw new Error('Pending invitation already exists for this email');
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays || DEFAULT_INVITATION_EXPIRY_DAYS));

    // Create invitation
    const invitation: Partial<FamilyInvitation> = {
      organizationId: input.organizationId,
      clientId: input.clientId,
      authorizedContactId: input.authorizedContactId,
      email: input.email.toLowerCase(),
      token,
      expiresAt,
      status: 'PENDING',
      proposedPermissions: input.permissions,
      proposedAccessLevel: input.accessLevel,
    };

    const created = await this.invitationRepository.create(invitation, context);

    // Update status to SENT
    await this.invitationRepository.updateStatus(created.id, 'SENT', new Date());

    return await this.invitationRepository.findById(created.id) as FamilyInvitation;
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<FamilyInvitation | null> {
    const invitation = await this.invitationRepository.findByToken(token);

    if (!invitation) {
      return null;
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      await this.invitationRepository.updateStatus(invitation.id, 'EXPIRED');
      return null;
    }

    return invitation;
  }

  /**
   * Accept invitation and create family member account
   */
  async acceptInvitation(input: AcceptInvitationInput): Promise<{ familyMemberId: UUID }> {
    const invitation = await this.getInvitationByToken(input.token);

    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    if (invitation.status !== 'SENT' && invitation.status !== 'PENDING') {
      throw new Error('Invitation has already been used or revoked');
    }

    // Create family member account
    const context: UserContext = {
      userId: invitation.createdBy,
      roles: ['ADMIN'],
      permissions: ['family:create'],
      organizationId: invitation.organizationId,
      branchIds: [],
    };

    const familyMember = await this.authService.register(
      {
        organizationId: invitation.organizationId,
        clientId: invitation.clientId,
        authorizedContactId: invitation.authorizedContactId,
        email: invitation.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        relationship: 'Family Member', // Can be updated later
        permissions: invitation.proposedPermissions,
        accessLevel: invitation.proposedAccessLevel,
      },
      context
    );

    // Mark invitation as accepted
    await this.invitationRepository.updateStatus(invitation.id, 'ACCEPTED', new Date());

    return { familyMemberId: familyMember.id };
  }

  /**
   * Revoke invitation
   */
  async revokeInvitation(invitationId: UUID, context: UserContext): Promise<void> {
    const invitation = await this.invitationRepository.findById(invitationId);

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status === 'ACCEPTED') {
      throw new Error('Cannot revoke an accepted invitation');
    }

    await this.invitationRepository.updateStatus(invitationId, 'REVOKED', new Date());
  }

  /**
   * Resend invitation
   */
  async resendInvitation(invitationId: UUID, context: UserContext): Promise<FamilyInvitation> {
    const invitation = await this.invitationRepository.findById(invitationId);

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status === 'ACCEPTED') {
      throw new Error('Cannot resend an accepted invitation');
    }

    // Generate new token and extend expiration
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DEFAULT_INVITATION_EXPIRY_DAYS);

    await this.invitationRepository.update(
      invitationId,
      {
        token,
        expiresAt,
        status: 'SENT',
        sentAt: new Date(),
      } as Partial<FamilyInvitation>,
      context
    );

    return (await this.invitationRepository.findById(invitationId)) as FamilyInvitation;
  }

  /**
   * Get invitations for a client
   */
  async getClientInvitations(clientId: UUID): Promise<FamilyInvitation[]> {
    return await this.invitationRepository.findByClientId(clientId);
  }

  /**
   * Get pending invitations
   */
  async getPendingInvitations(clientId?: UUID): Promise<FamilyInvitation[]> {
    return await this.invitationRepository.findPendingInvitations(clientId);
  }
}
