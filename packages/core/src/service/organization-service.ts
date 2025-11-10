/**
 * @care-commons/core - Organization Service
 * 
 * Business logic for multi-tenant organization management with state-based isolation
 */

import { randomBytes, pbkdf2Sync } from '../utils/crypto.js';
import { UUID, ValidationError, ConflictError, NotFoundError } from '../types/base';
import {
  Organization,
  CreateOrganizationRequest,
  InviteToken,
  CreateInviteRequest,
  AcceptInviteRequest,
  InviteDetails,
} from '../types/organization';
import { OrganizationRepository } from '../repository/organization-repository';
import { UserRepository, CreateUserRequest } from '../repository/user-repository';
import { Database } from '../db/connection';

export interface IOrganizationService {
  registerOrganization(request: CreateOrganizationRequest): Promise<{
    organization: Organization;
    adminUserId: UUID;
  }>;
  getOrganizationById(id: UUID): Promise<Organization>;
  
  // Invitation management
  createInvitation(
    organizationId: UUID,
    request: CreateInviteRequest,
    createdBy: UUID
  ): Promise<InviteToken>;
  getInvitationDetails(token: string): Promise<InviteDetails>;
  acceptInvitation(request: AcceptInviteRequest): Promise<UUID>;
  revokeInvitation(token: string, revokedBy: UUID): Promise<void>;
  getOrganizationInvitations(organizationId: UUID): Promise<InviteToken[]>;
}

export class OrganizationService implements IOrganizationService {
  private organizationRepo: OrganizationRepository;
  private userRepo: UserRepository;

  constructor(private db: Database) {
    this.organizationRepo = new OrganizationRepository(db);
    this.userRepo = new UserRepository(db);
  }

  /**
   * Register a new organization with initial admin user
   * This is a transactional operation to ensure data consistency
   */
  async registerOrganization(request: CreateOrganizationRequest): Promise<{
    organization: Organization;
    adminUserId: UUID;
  }> {
    // Validation
    this.validateOrganizationRequest(request);

    // Check for duplicate email
    const emailExists = await this.organizationRepo.checkEmailExists(request.email);
    if (emailExists) {
      throw new ConflictError('An organization with this email already exists', {
        email: request.email,
      });
    }

    // Execute within transaction to ensure atomicity
    return await this.db.transaction(async (client) => {
      // Create a temporary user ID for the initial creation
      const tempUserId = this.generateTempId();

      // Create organization
      const organization = await this.organizationRepo.createOrganization(
        {
          name: request.name,
          legalName: request.legalName,
          stateCode: request.stateCode,
          taxId: request.taxId,
          licenseNumber: request.licenseNumber,
          phone: request.phone,
          email: request.email,
          website: request.website,
          primaryAddress: request.primaryAddress,
          billingAddress: request.billingAddress,
        },
        tempUserId
      );

      // Create admin user
      const passwordHash = this.hashPassword(request.adminUser.password);
      const username = this.generateUsername(
        request.adminUser.firstName,
        request.adminUser.lastName
      );

      const userRequest: CreateUserRequest = {
        organizationId: organization.id,
        username,
        email: request.adminUser.email,
        passwordHash,
        firstName: request.adminUser.firstName,
        lastName: request.adminUser.lastName,
        phone: request.adminUser.phone,
        roles: ['ORG_ADMIN'],
        branchIds: [],
        createdBy: tempUserId,
      };

      const adminUser = await this.userRepo.createUser(userRequest);

      // Update organization's created_by and updated_by to the admin user
      await client.query(
        `UPDATE organizations 
         SET created_by = $1, updated_by = $1 
         WHERE id = $2`,
        [adminUser.id, organization.id]
      );

      return {
        organization: {
          ...organization,
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
        },
        adminUserId: adminUser.id,
      };
    });
  }

  async getOrganizationById(id: UUID): Promise<Organization> {
    const organization = await this.organizationRepo.getOrganizationById(id);
    if (organization === null) {
      throw new NotFoundError('Organization not found', { id });
    }
    return organization;
  }

  // Invitation management

  async createInvitation(
    organizationId: UUID,
    request: CreateInviteRequest,
    createdBy: UUID
  ): Promise<InviteToken> {
    // Validate organization exists
    await this.getOrganizationById(organizationId);

    // Validate email format
    if (!this.isValidEmail(request.email)) {
      throw new ValidationError('Invalid email address', { email: request.email });
    }

    // Check if user already exists
    const existingUser = await this.userRepo.getUserByEmail(
      request.email,
      organizationId
    );
    if (existingUser !== null) {
      throw new ConflictError('User with this email already exists in the organization', {
        email: request.email,
      });
    }

    // Create invitation token
    return await this.userRepo.createInviteToken(
      organizationId,
      request,
      createdBy
    );
  }

  async getInvitationDetails(token: string): Promise<InviteDetails> {
    const details = await this.userRepo.validateInviteToken(token);
    if (details === null) {
      throw new NotFoundError('Invitation not found', { token });
    }

    if (!details.isValid) {
      const invite = await this.userRepo.getInviteByToken(token);
      if (invite?.status === 'EXPIRED') {
        throw new ValidationError('Invitation has expired');
      }
      if (invite?.status === 'REVOKED') {
        throw new ValidationError('Invitation has been revoked');
      }
      if (invite?.status === 'ACCEPTED') {
        throw new ValidationError('Invitation has already been accepted');
      }
      throw new ValidationError('Invitation is not valid');
    }

    return details;
  }

  async acceptInvitation(request: AcceptInviteRequest): Promise<UUID> {
    // Validate invitation
    const inviteDetails = await this.getInvitationDetails(request.token);

    // Validate password strength
    this.validatePasswordStrength(request.password);

    // Get full invite token
    const invite = await this.userRepo.getInviteByToken(request.token);
    if (invite === null) {
      throw new NotFoundError('Invitation not found');
    }

    // Create user within transaction
    return await this.db.transaction(async () => {
      const passwordHash = this.hashPassword(request.password);
      const username = this.generateUsername(request.firstName, request.lastName);

      const userRequest: CreateUserRequest = {
        organizationId: inviteDetails.organizationId,
        username,
        email: inviteDetails.email,
        passwordHash,
        firstName: request.firstName,
        lastName: request.lastName,
        phone: request.phone,
        roles: invite.roles,
        branchIds: invite.branchIds,
        createdBy: invite.createdBy,
      };

      const newUser = await this.userRepo.createUser(userRequest);

      // Mark invitation as accepted
      await this.userRepo.acceptInviteToken(request.token, newUser.id);

      return newUser.id;
    });
  }

  async revokeInvitation(token: string, revokedBy: UUID): Promise<void> {
    const invite = await this.userRepo.getInviteByToken(token);
    if (invite === null) {
      throw new NotFoundError('Invitation not found', { token });
    }

    if (invite.status !== 'PENDING') {
      throw new ValidationError('Only pending invitations can be revoked', {
        status: invite.status,
      });
    }

    await this.userRepo.revokeInviteToken(token, revokedBy);
  }

  async getOrganizationInvitations(organizationId: UUID): Promise<InviteToken[]> {
    // Validate organization exists
    await this.getOrganizationById(organizationId);

    return await this.userRepo.getOrganizationInvites(organizationId);
  }

  // Private helper methods

  private validateOrganizationRequest(request: CreateOrganizationRequest): void {
    if (request.name.trim().length === 0) {
      throw new ValidationError('Organization name is required');
    }

    if (request.stateCode.length === 0) {
      throw new ValidationError('State code is required');
    }

    if (!this.isValidEmail(request.email)) {
      throw new ValidationError('Invalid organization email address');
    }

    if (!this.isValidEmail(request.adminUser.email)) {
      throw new ValidationError('Invalid admin user email address');
    }

    if (request.adminUser.firstName.trim().length === 0) {
      throw new ValidationError('Admin user first name is required');
    }

    if (request.adminUser.lastName.trim().length === 0) {
      throw new ValidationError('Admin user last name is required');
    }

    this.validatePasswordStrength(request.adminUser.password);

    this.validateAddress(request.primaryAddress);
  }

  private validateAddress(address: {
    street1: string;
    city: string;
    state: string;
    zipCode: string;
  }): void {
    if (address.street1.trim().length === 0) {
      throw new ValidationError('Street address is required');
    }

    if (address.city.trim().length === 0) {
      throw new ValidationError('City is required');
    }

    if (address.state.trim().length === 0) {
      throw new ValidationError('State is required');
    }

    if (address.zipCode.trim().length === 0) {
      throw new ValidationError('ZIP code is required');
    }

    // Validate ZIP code format (basic US format)
    // Allow either 5 digits or 5+4 with hyphen
    const isValidZip = /^\d{5}$/.test(address.zipCode) || /^\d{5}-\d{4}$/.test(address.zipCode);
    if (!isValidZip) {
      throw new ValidationError('Invalid ZIP code format');
    }
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Check for at least one uppercase, one lowercase, one number, one special char
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!"#$%&()*,.:<>?@^{|}]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      throw new ValidationError(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      );
    }
  }

  private isValidEmail(email: string): boolean {
    // Simple email validation - checks for basic email structure
    // Splits on @ and . to avoid backtracking issues
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    
    const [localPart, domain] = parts;
    if (localPart === undefined || domain === undefined) return false;
    if (localPart.length === 0 || domain.length === 0) return false;
    
    const domainParts = domain.split('.');
    if (domainParts.length < 2) return false;
    
    return domainParts.every((part) => part.length > 0);
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  private generateUsername(firstName: string, lastName: string): string {
    const base = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const random = randomBytes(3).toString('hex');
    return `${base}.${random}`;
  }

  private generateTempId(): UUID {
    return '00000000-0000-0000-0000-000000000000';
  }
}
