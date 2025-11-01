import { Repository } from '@care-commons/core/src/db/repository';
import { Database } from '@care-commons/core/src/db/connection';
import { UUID, UserContext } from '@care-commons/core';
import { ServiceAuthorization } from '../types/state-specific';

export class ServiceAuthorizationRepository extends Repository<ServiceAuthorization> {
  constructor(database: Database) {
    super({
      tableName: 'service_authorizations',
      database,
      enableAudit: true,
      enableSoftDelete: true,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapRowToEntity(row: any): ServiceAuthorization {
    return {
      id: row.id,
      carePlanId: row.care_plan_id,
      clientId: row.client_id,
      organizationId: row.organization_id,
      stateJurisdiction: row.state_jurisdiction,
      authorizationType: row.authorization_type,
      authorizationNumber: row.authorization_number,
      payerName: row.payer_name,
      payerId: row.payer_id,
      serviceCodes: row.service_codes,
      authorizedUnits: parseFloat(row.authorized_units),
      unitType: row.unit_type,
      ratePerUnit: row.rate_per_unit ? parseFloat(row.rate_per_unit) : undefined,
      effectiveDate: row.effective_date,
      expirationDate: row.expiration_date,
      unitsUsed: parseFloat(row.units_used),
      unitsRemaining: parseFloat(row.units_remaining),
      lastUsageDate: row.last_usage_date,
      formNumber: row.form_number,
      mcoId: row.mco_id,
      ahcaProviderNumber: row.ahca_provider_number,
      smmcPlanName: row.smmc_plan_name,
      status: row.status,
      notes: row.notes,
      stateSpecificData: row.state_specific_data,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
    } as ServiceAuthorization;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapEntityToRow(entity: Partial<ServiceAuthorization>): Record<string, any> {
    return {
      care_plan_id: entity.carePlanId,
      client_id: entity.clientId,
      organization_id: entity.organizationId,
      state_jurisdiction: entity.stateJurisdiction,
      authorization_type: entity.authorizationType,
      authorization_number: entity.authorizationNumber,
      payer_name: entity.payerName,
      payer_id: entity.payerId,
      service_codes: entity.serviceCodes,
      authorized_units: entity.authorizedUnits,
      unit_type: entity.unitType,
      rate_per_unit: entity.ratePerUnit,
      effective_date: entity.effectiveDate,
      expiration_date: entity.expirationDate,
      units_used: entity.unitsUsed || 0,
      units_remaining: entity.unitsRemaining,
      last_usage_date: entity.lastUsageDate,
      form_number: entity.formNumber,
      mco_id: entity.mcoId,
      ahca_provider_number: entity.ahcaProviderNumber,
      smmc_plan_name: entity.smmcPlanName,
      status: entity.status || 'PENDING',
      notes: entity.notes,
      state_specific_data: entity.stateSpecificData || {},
    };
  }

  async findActiveByClientAndService(
    clientId: UUID,
    serviceCode: string
  ): Promise<ServiceAuthorization[]> {
    const query = `
      SELECT * FROM service_authorizations
      WHERE client_id = $1
        AND $2 = ANY(service_codes)
        AND status = 'ACTIVE'
        AND effective_date <= CURRENT_DATE
        AND expiration_date >= CURRENT_DATE
        AND units_remaining > 0
        AND deleted_at IS NULL
      ORDER BY expiration_date ASC
    `;

    const result = await this.database.query(query, [clientId, serviceCode]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.rows.map((row: any) => this.mapRowToEntity(row));
  }

  async deductUnits(
    authorizationId: UUID,
    unitsToDeduct: number,
    context: UserContext
  ): Promise<ServiceAuthorization> {
    const query = `
      UPDATE service_authorizations
      SET units_used = units_used + $1,
          units_remaining = units_remaining - $1,
          last_usage_date = CURRENT_DATE,
          updated_at = NOW(),
          updated_by = $2,
          version = version + 1
      WHERE id = $3
        AND units_remaining >= $1
        AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.database.query(query, [
      unitsToDeduct,
      context.userId,
      authorizationId,
    ]);

    if (result.rows.length === 0) {
      throw new Error('Insufficient authorized units remaining');
    }

    return this.mapRowToEntity(result.rows[0]);
  }
}