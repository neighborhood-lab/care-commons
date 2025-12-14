/**
 * Agency Contact Information Service
 *
 * Provides clear display of agency contact info, hours, and emergency lines
 * for family members in the family portal.
 *
 * Requirements:
 * - Display main office contact information
 * - Show business hours with timezone
 * - Highlight emergency and after-hours contacts
 * - Show current office status (open/closed)
 * - Display upcoming holiday closures
 */

import type { UUID } from '@folkcare/core';
import type {
  FamilyMember,
  AgencyContactInfo,
  AgencyStatusInfo,
  AgencyContact,
  AgencyAnnouncement,
  BusinessHours,
  HolidaySchedule,
  GetAgencyContactInfoInput,
  DayOfWeek,
  OfficeStatus,
} from '../types/family-engagement.js';

/**
 * Error thrown when family member lacks access to agency info
 */
export class AgencyInfoAccessDeniedError extends Error {
  constructor(familyMemberId: UUID) {
    super(`Family member ${familyMemberId} does not have portal access`);
    this.name = 'AgencyInfoAccessDeniedError';
  }
}

/**
 * Repository interface for agency data
 */
export interface AgencyDataRepository {
  getOrganizationContactInfo(organizationId: UUID): Promise<RawAgencyData | null>;
  getDepartmentContacts(organizationId: UUID): Promise<RawDepartmentContact[]>;
  getBusinessHours(organizationId: UUID): Promise<RawBusinessHours[]>;
  getHolidaySchedule(organizationId: UUID): Promise<RawHolidaySchedule[]>;
  getAnnouncements(organizationId: UUID): Promise<RawAnnouncement[]>;
}

/**
 * Family member access repository for agency contact service
 */
export interface AgencyFamilyMemberRepository {
  getFamilyMemberForClient(
    familyMemberId: UUID,
    clientId: UUID
  ): Promise<FamilyMember | null>;
}

// ---- Raw data types from database ----

interface RawAgencyData {
  organizationId: UUID;
  name: string;
  logoUrl?: string;
  mainPhone: string;
  faxNumber?: string;
  generalEmail: string;
  websiteUrl?: string;
  streetAddress: string;
  suiteNumber?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  timezone: string;
  emergencyPhone: string;
  emergencyInstructions: string;
  afterHoursPhone?: string;
  afterHoursInstructions?: string;
  nurseHotline?: string;
  welcomeMessage?: string;
  lastUpdated: Date;
}

interface RawDepartmentContact {
  id: UUID;
  contactType: string;
  displayName: string;
  description?: string;
  phoneNumber: string;
  phoneExtension?: string;
  email?: string;
  isAvailable24Hours: boolean;
  isPrimaryContact: boolean;
  sortOrder: number;
  availabilityJson?: string;
}

interface RawBusinessHours {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  notes?: string;
}

interface RawHolidaySchedule {
  date: string;
  name: string;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
  notes?: string;
}

interface RawAnnouncement {
  id: UUID;
  title: string;
  message: string;
  priority: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  dismissible: boolean;
}

/**
 * Service for providing agency contact information to families
 */
export class AgencyContactService {
  constructor(
    private familyMemberRepo: AgencyFamilyMemberRepository,
    private agencyRepo: AgencyDataRepository
  ) {}

  /**
   * Verify family member has portal access
   */
  private async verifyAccess(
    familyMemberId: UUID,
    clientId: UUID
  ): Promise<FamilyMember> {
    const familyMember = await this.familyMemberRepo.getFamilyMemberForClient(
      familyMemberId,
      clientId
    );

    if (familyMember === null) {
      throw new AgencyInfoAccessDeniedError(familyMemberId);
    }

    if (
      familyMember.status !== 'ACTIVE' ||
      familyMember.invitationStatus !== 'ACCEPTED'
    ) {
      throw new AgencyInfoAccessDeniedError(familyMemberId);
    }

    return familyMember;
  }

  /**
   * Get full agency contact information
   */
  async getAgencyContactInfo(
    input: GetAgencyContactInfoInput
  ): Promise<AgencyContactInfo> {
    const familyMember = await this.verifyAccess(
      input.familyMemberId,
      input.clientId
    );

    const organizationId = familyMember.organizationId;

    // Fetch all data in parallel
    const [agencyData, departmentContacts, businessHours, holidaySchedule, announcements] =
      await Promise.all([
        this.agencyRepo.getOrganizationContactInfo(organizationId),
        this.agencyRepo.getDepartmentContacts(organizationId),
        this.agencyRepo.getBusinessHours(organizationId),
        input.includeHolidaySchedule !== false
          ? this.agencyRepo.getHolidaySchedule(organizationId)
          : Promise.resolve([]),
        input.includeAnnouncements !== false
          ? this.agencyRepo.getAnnouncements(organizationId)
          : Promise.resolve([]),
      ]);

    if (agencyData === null) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    return {
      organizationId: agencyData.organizationId,
      organizationName: agencyData.name,
      logoUrl: agencyData.logoUrl,
      mainPhone: agencyData.mainPhone,
      faxNumber: agencyData.faxNumber,
      generalEmail: agencyData.generalEmail,
      websiteUrl: agencyData.websiteUrl,
      streetAddress: agencyData.streetAddress,
      suiteNumber: agencyData.suiteNumber,
      city: agencyData.city,
      state: agencyData.state,
      postalCode: agencyData.postalCode,
      country: agencyData.country,
      businessHours: this.transformBusinessHours(businessHours),
      timezone: agencyData.timezone,
      holidaySchedule: this.transformHolidaySchedule(holidaySchedule),
      emergencyPhone: agencyData.emergencyPhone,
      emergencyInstructions: agencyData.emergencyInstructions,
      afterHoursPhone: agencyData.afterHoursPhone,
      afterHoursInstructions: agencyData.afterHoursInstructions,
      nurseHotline: agencyData.nurseHotline,
      departmentContacts: this.transformDepartmentContacts(departmentContacts),
      welcomeMessage: agencyData.welcomeMessage,
      announcements: this.transformAnnouncements(announcements),
      lastUpdated: agencyData.lastUpdated,
    };
  }

  /**
   * Get current agency status (open/closed, emergency availability)
   */
  async getAgencyStatus(
    familyMemberId: UUID,
    clientId: UUID
  ): Promise<AgencyStatusInfo> {
    const familyMember = await this.verifyAccess(familyMemberId, clientId);
    const organizationId = familyMember.organizationId;

    const [agencyData, businessHours, holidaySchedule, announcements] =
      await Promise.all([
        this.agencyRepo.getOrganizationContactInfo(organizationId),
        this.agencyRepo.getBusinessHours(organizationId),
        this.agencyRepo.getHolidaySchedule(organizationId),
        this.agencyRepo.getAnnouncements(organizationId),
      ]);

    if (agencyData === null) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    const now = new Date();
    const timezone = agencyData.timezone;

    // Check if today is a holiday
    const todayString = now.toISOString().slice(0, 10);
    const todayHoliday = holidaySchedule.find((h) => h.date === todayString);

    // Get current day's business hours
    const currentDayIndex = now.getDay();
    const todayHours = businessHours.find(
      (h) => h.dayOfWeek === currentDayIndex
    );

    // Determine current status
    const { status, message, isBusinessHours } = this.calculateCurrentStatus(
      now,
      timezone,
      todayHours,
      todayHoliday
    );

    // Find next status change
    const nextStatusChange = this.calculateNextStatusChange(
      now,
      timezone,
      businessHours,
      holidaySchedule
    );

    // Filter urgent announcements
    const urgentAnnouncements = announcements
      .filter(
        (a) =>
          a.priority === 'URGENT' &&
          new Date(a.effectiveFrom) <= now &&
          (a.effectiveTo === undefined || new Date(a.effectiveTo) >= now)
      )
      .map((a) => this.transformAnnouncement(a));

    return {
      currentStatus: status,
      statusMessage: message,
      nextStatusChange,
      isBusinessHours,
      emergencyAvailable: true, // Emergency line always available
      urgentAnnouncements,
    };
  }

  /**
   * Get emergency contact information (accessible without full verification)
   */
  async getEmergencyContacts(
    familyMemberId: UUID,
    clientId: UUID
  ): Promise<{
    emergencyPhone: string;
    emergencyInstructions: string;
    nurseHotline?: string;
    afterHoursPhone?: string;
  }> {
    const familyMember = await this.verifyAccess(familyMemberId, clientId);
    const organizationId = familyMember.organizationId;

    const agencyData =
      await this.agencyRepo.getOrganizationContactInfo(organizationId);

    if (agencyData === null) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    return {
      emergencyPhone: agencyData.emergencyPhone,
      emergencyInstructions: agencyData.emergencyInstructions,
      nurseHotline: agencyData.nurseHotline,
      afterHoursPhone: agencyData.afterHoursPhone,
    };
  }

  // ---- Private helper methods ----

  private transformBusinessHours(raw: RawBusinessHours[]): BusinessHours[] {
    const dayMapping: Record<number, DayOfWeek> = {
      0: 'SUNDAY',
      1: 'MONDAY',
      2: 'TUESDAY',
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
      6: 'SATURDAY',
    };

    const result: BusinessHours[] = [];
    for (const h of raw) {
      const dayOfWeek = dayMapping[h.dayOfWeek];
      if (dayOfWeek !== undefined) {
        result.push({
          dayOfWeek,
          isOpen: h.isOpen,
          openTime: h.openTime,
          closeTime: h.closeTime,
          notes: h.notes,
        });
      }
    }
    return result;
  }

  private transformHolidaySchedule(raw: RawHolidaySchedule[]): HolidaySchedule[] {
    return raw.map((h) => ({
      date: h.date,
      name: h.name,
      isClosed: h.isClosed,
      specialHours:
        h.openTime !== undefined && h.closeTime !== undefined
          ? { openTime: h.openTime, closeTime: h.closeTime }
          : undefined,
      notes: h.notes,
    }));
  }

  private transformDepartmentContacts(raw: RawDepartmentContact[]): AgencyContact[] {
    return raw
      .map((c) => ({
        id: c.id,
        contactType: this.mapContactType(c.contactType),
        displayName: c.displayName,
        description: c.description,
        phoneNumber: c.phoneNumber,
        phoneExtension: c.phoneExtension,
        email: c.email,
        isAvailable24Hours: c.isAvailable24Hours,
        availableHours: c.availabilityJson !== undefined
          ? this.parseAvailabilityJson(c.availabilityJson)
          : undefined,
        isPrimaryContact: c.isPrimaryContact,
        sortOrder: c.sortOrder,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private transformAnnouncements(raw: RawAnnouncement[]): AgencyAnnouncement[] {
    const now = new Date();
    return raw
      .filter(
        (a) =>
          new Date(a.effectiveFrom) <= now &&
          (a.effectiveTo === undefined || new Date(a.effectiveTo) >= now)
      )
      .map((a) => this.transformAnnouncement(a));
  }

  private transformAnnouncement(raw: RawAnnouncement): AgencyAnnouncement {
    return {
      id: raw.id,
      title: raw.title,
      message: raw.message,
      priority: this.mapPriority(raw.priority),
      effectiveFrom: raw.effectiveFrom,
      effectiveTo: raw.effectiveTo,
      dismissible: raw.dismissible,
    };
  }

  private mapContactType(
    raw: string
  ): AgencyContact['contactType'] {
    const mapping: Record<string, AgencyContact['contactType']> = {
      MAIN_OFFICE: 'MAIN_OFFICE',
      BILLING: 'BILLING',
      SCHEDULING: 'SCHEDULING',
      CARE_COORDINATION: 'CARE_COORDINATION',
      EMERGENCY: 'EMERGENCY',
      AFTER_HOURS: 'AFTER_HOURS',
      NURSE_LINE: 'NURSE_LINE',
      SOCIAL_WORKER: 'SOCIAL_WORKER',
    };
    return mapping[raw] ?? 'MAIN_OFFICE';
  }

  private mapPriority(raw: string): AgencyAnnouncement['priority'] {
    const mapping: Record<string, AgencyAnnouncement['priority']> = {
      LOW: 'LOW',
      NORMAL: 'NORMAL',
      HIGH: 'HIGH',
      URGENT: 'URGENT',
    };
    return mapping[raw] ?? 'NORMAL';
  }

  private parseAvailabilityJson(json: string): BusinessHours[] | undefined {
    try {
      const parsed = JSON.parse(json) as BusinessHours[];
      return parsed;
    } catch {
      return undefined;
    }
  }

  private calculateCurrentStatus(
    now: Date,
    _timezone: string,
    todayHours?: RawBusinessHours,
    todayHoliday?: RawHolidaySchedule
  ): { status: OfficeStatus; message: string; isBusinessHours: boolean } {
    // Check holiday first
    if (todayHoliday !== undefined) {
      if (todayHoliday.isClosed) {
        return {
          status: 'CLOSED',
          message: `Closed for ${todayHoliday.name}`,
          isBusinessHours: false,
        };
      }
      // Holiday with special hours
      if (
        todayHoliday.openTime !== undefined &&
        todayHoliday.closeTime !== undefined
      ) {
        const isWithinHours = this.isWithinHours(
          now,
          todayHoliday.openTime,
          todayHoliday.closeTime
        );
        return {
          status: isWithinHours ? 'LIMITED_HOURS' : 'CLOSED',
          message: isWithinHours
            ? `Open ${todayHoliday.openTime} - ${todayHoliday.closeTime} (${todayHoliday.name})`
            : `Closed - Special hours: ${todayHoliday.openTime} - ${todayHoliday.closeTime}`,
          isBusinessHours: isWithinHours,
        };
      }
    }

    // Check regular business hours
    if (todayHours === undefined || !todayHours.isOpen) {
      return {
        status: 'CLOSED',
        message: 'Office is closed today',
        isBusinessHours: false,
      };
    }

    if (
      todayHours.openTime !== undefined &&
      todayHours.closeTime !== undefined
    ) {
      const isWithinHours = this.isWithinHours(
        now,
        todayHours.openTime,
        todayHours.closeTime
      );
      return {
        status: isWithinHours ? 'OPEN' : 'CLOSED',
        message: isWithinHours
          ? `Open until ${todayHours.closeTime}`
          : `Closed - Opens at ${todayHours.openTime}`,
        isBusinessHours: isWithinHours,
      };
    }

    return {
      status: 'OPEN',
      message: 'Office is open',
      isBusinessHours: true,
    };
  }

  private isWithinHours(now: Date, openTime: string, closeTime: string): boolean {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    const openParts = openTime.split(':');
    const closeParts = closeTime.split(':');

    const openHour = Number(openParts[0] ?? 0);
    const openMinute = Number(openParts[1] ?? 0);
    const closeHour = Number(closeParts[0] ?? 0);
    const closeMinute = Number(closeParts[1] ?? 0);

    const openTimeMinutes = openHour * 60 + openMinute;
    const closeTimeMinutes = closeHour * 60 + closeMinute;

    return (
      currentTimeMinutes >= openTimeMinutes &&
      currentTimeMinutes < closeTimeMinutes
    );
  }

  private calculateNextStatusChange(
    now: Date,
    _timezone: string,
    businessHours: RawBusinessHours[],
    _holidaySchedule: RawHolidaySchedule[]
  ): AgencyStatusInfo['nextStatusChange'] | undefined {
    const currentDayIndex = now.getDay();
    const todayHours = businessHours.find((h) => h.dayOfWeek === currentDayIndex);

    if (todayHours === undefined || !todayHours.isOpen) {
      // Find next open day
      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (currentDayIndex + i) % 7;
        const nextDayHours = businessHours.find(
          (h) => h.dayOfWeek === nextDayIndex
        );
        if (nextDayHours?.isOpen && nextDayHours.openTime !== undefined) {
          const nextOpenDate = new Date(now);
          nextOpenDate.setDate(now.getDate() + i);
          const timeParts = nextDayHours.openTime.split(':');
          const hour = Number(timeParts[0] ?? 0);
          const minute = Number(timeParts[1] ?? 0);
          nextOpenDate.setHours(hour, minute, 0, 0);
          return {
            status: 'OPEN',
            time: nextOpenDate,
            message: `Opens ${this.formatDay(nextDayIndex)} at ${nextDayHours.openTime}`,
          };
        }
      }
      return undefined;
    }

    // Currently open day - when does it close?
    if (todayHours.closeTime !== undefined) {
      const timeParts = todayHours.closeTime.split(':');
      const closeHour = Number(timeParts[0] ?? 0);
      const closeMinute = Number(timeParts[1] ?? 0);
      const closeTime = new Date(now);
      closeTime.setHours(closeHour, closeMinute, 0, 0);

      if (closeTime > now) {
        return {
          status: 'CLOSED',
          time: closeTime,
          message: `Closes at ${todayHours.closeTime}`,
        };
      }
    }

    return undefined;
  }

  private formatDay(dayIndex: number): string {
    const days: Record<number, string> = {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday',
    };
    return days[dayIndex] ?? 'Unknown';
  }
}
