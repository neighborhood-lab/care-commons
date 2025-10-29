/**
 * Billing & Invoicing seed data
 *
 * Creates realistic demo data for billing operations including:
 * - Payers (Medicare, Medicaid, private insurance, private pay)
 * - Rate schedules
 * - Service authorizations
 * - Billable items from completed visits
 * - Invoices
 * - Payments
 * - Claims
 */
import { v4 as uuidv4 } from 'uuid';
import { initializeDatabase } from '../src/db/connection';
async function seedBillingData() {
    console.log('💰 Seeding billing data...\n');
    const db = initializeDatabase({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'care_commons',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        ssl: process.env.DB_SSL === 'true',
    });
    try {
        await db.transaction(async (client) => {
            // Get existing data
            console.log('Fetching existing organization and user data...');
            const orgResult = await client.query('SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1');
            if (orgResult.rows.length === 0) {
                throw new Error('No organization found. Please run seed.ts first.');
            }
            const orgId = orgResult.rows[0].id;
            const userResult = await client.query('SELECT id FROM users WHERE organization_id = $1 ORDER BY created_at ASC LIMIT 1', [orgId]);
            if (userResult.rows.length === 0) {
                throw new Error('No user found. Please run seed.ts first.');
            }
            const systemUserId = userResult.rows[0].id;
            const branchResult = await client.query('SELECT id FROM branches WHERE organization_id = $1 ORDER BY created_at ASC LIMIT 1', [orgId]);
            if (branchResult.rows.length === 0) {
                throw new Error('No branch found. Please run seed.ts first.');
            }
            const branchId = branchResult.rows[0].id;
            // Get clients
            const clientsResult = await client.query('SELECT id, first_name, last_name FROM clients WHERE organization_id = $1 AND status = $2', [orgId, 'ACTIVE']);
            const clients = clientsResult.rows;
            // Get caregivers
            const caregiversResult = await client.query('SELECT id, first_name, last_name FROM caregivers WHERE organization_id = $1 AND status = $2 LIMIT 3', [orgId, 'ACTIVE']);
            const caregivers = caregiversResult.rows;
            console.log(`Found org: ${orgId}, ${clients.length} active clients, ${caregivers.length} active caregivers\n`);
            // ========================================================================
            // CREATE PAYERS
            // ========================================================================
            console.log('Creating payers...');
            // Medicare
            const medicareId = uuidv4();
            await client.query(`
        INSERT INTO payers (
          id, organization_id, payer_name, payer_type, payer_code,
          national_payer_id, medicare_provider_id,
          address, phone, email, website,
          billing_email, submission_methods,
          payment_terms_days, requires_pre_authorization, requires_referral,
          claim_filing_limit, status, average_payment_days, denial_rate,
          notes, created_by, updated_by, created_at, updated_at, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
        )
        `, [
                medicareId,
                orgId,
                'Medicare Part A & B',
                'MEDICARE',
                'MED01',
                '00450',
                'A12345',
                JSON.stringify({
                    line1: '7500 Security Boulevard',
                    city: 'Baltimore',
                    state: 'MD',
                    postalCode: '21244',
                    country: 'US',
                }),
                '1-800-633-4227',
                'medicare@cms.hhs.gov',
                'https://www.medicare.gov',
                'claims@medicare.gov',
                JSON.stringify(['EDI', 'CLEARINGHOUSE', 'PORTAL']),
                30,
                false,
                false,
                365,
                'ACTIVE',
                28,
                4.5,
                'Standard Medicare billing',
                systemUserId,
                systemUserId,
                new Date(),
                new Date(),
                1,
            ]);
            // Medicaid (Illinois)
            const medicaidId = uuidv4();
            await client.query(`
        INSERT INTO payers (
          id, organization_id, payer_name, payer_type, payer_code,
          national_payer_id, medicaid_provider_id,
          address, phone, email, website,
          billing_email, submission_methods,
          payment_terms_days, requires_pre_authorization, requires_referral,
          claim_filing_limit, status, average_payment_days, denial_rate,
          notes, created_by, updated_by, created_at, updated_at, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
        )
        `, [
                medicaidId,
                orgId,
                'Illinois Medicaid',
                'MEDICAID',
                'MCD01',
                'IL001',
                'ILM123456',
                JSON.stringify({
                    line1: '201 South Grand Avenue East',
                    city: 'Springfield',
                    state: 'IL',
                    postalCode: '62763',
                    country: 'US',
                }),
                '1-800-252-8635',
                'hfs.webmaster@illinois.gov',
                'https://www.illinois.gov/hfs',
                'medicaid.claims@illinois.gov',
                JSON.stringify(['EDI', 'CLEARINGHOUSE']),
                45,
                true,
                false,
                180,
                'ACTIVE',
                42,
                8.2,
                'Illinois Medicaid Home Services',
                systemUserId,
                systemUserId,
                new Date(),
                new Date(),
                1,
            ]);
            // Private Insurance - Blue Cross Blue Shield
            const bcbsId = uuidv4();
            await client.query(`
        INSERT INTO payers (
          id, organization_id, payer_name, payer_type, payer_code,
          national_payer_id, tax_id,
          address, phone, email, website,
          billing_address, billing_email, billing_portal_url,
          submission_methods,
          payment_terms_days, requires_pre_authorization, requires_referral,
          claim_filing_limit, status, average_payment_days, denial_rate,
          notes, created_by, updated_by, created_at, updated_at, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
        )
        `, [
                bcbsId,
                orgId,
                'Blue Cross Blue Shield - Illinois',
                'PRIVATE_INSURANCE',
                'BCBS01',
                '00590',
                '36-2880994',
                JSON.stringify({
                    line1: '300 E. Randolph Street',
                    city: 'Chicago',
                    state: 'IL',
                    postalCode: '60601',
                    country: 'US',
                }),
                '1-800-892-2299',
                'provider.services@bcbsil.com',
                'https://www.bcbsil.com',
                JSON.stringify({
                    line1: 'PO Box 805107',
                    city: 'Chicago',
                    state: 'IL',
                    postalCode: '60680',
                    country: 'US',
                }),
                'claims@bcbsil.com',
                'https://www.bcbsil.com/provider/claims',
                JSON.stringify(['EDI', 'CLEARINGHOUSE', 'PORTAL', 'MAIL']),
                30,
                true,
                true,
                90,
                'ACTIVE',
                21,
                5.8,
                'Requires pre-auth for most services',
                systemUserId,
                systemUserId,
                new Date(),
                new Date(),
                1,
            ]);
            // Veterans Benefits
            const vaId = uuidv4();
            await client.query(`
        INSERT INTO payers (
          id, organization_id, payer_name, payer_type, payer_code,
          address, phone, email, website,
          billing_email, submission_methods,
          payment_terms_days, requires_pre_authorization, requires_referral,
          claim_filing_limit, status, average_payment_days, denial_rate,
          notes, created_by, updated_by, created_at, updated_at, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23
        )
        `, [
                vaId,
                orgId,
                'VA Home Based Primary Care',
                'VETERANS_BENEFITS',
                'VA01',
                JSON.stringify({
                    line1: '810 Vermont Avenue, NW',
                    city: 'Washington',
                    state: 'DC',
                    postalCode: '20420',
                    country: 'US',
                }),
                '1-877-222-8387',
                'vaclaims@va.gov',
                'https://www.va.gov',
                'community.care.claims@va.gov',
                JSON.stringify(['PORTAL', 'MAIL']),
                60,
                true,
                true,
                180,
                'ACTIVE',
                52,
                3.2,
                'VA Community Care Network',
                systemUserId,
                systemUserId,
                new Date(),
                new Date(),
                1,
            ]);
            // Private Pay (for clients paying out of pocket)
            const privatePayId = uuidv4();
            await client.query(`
        INSERT INTO payers (
          id, organization_id, payer_name, payer_type, payer_code,
          submission_methods, payment_terms_days,
          requires_pre_authorization, requires_referral,
          status, notes,
          created_by, updated_by, created_at, updated_at, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
        `, [
                privatePayId,
                orgId,
                'Private Pay',
                'PRIVATE_PAY',
                'PRIV01',
                JSON.stringify(['EMAIL', 'MAIL']),
                15,
                false,
                false,
                'ACTIVE',
                'Individual clients paying out of pocket',
                systemUserId,
                systemUserId,
                new Date(),
                new Date(),
                1,
            ]);
            console.log('  ✓ Created 5 payers');
            // ========================================================================
            // CREATE RATE SCHEDULES
            // ========================================================================
            console.log('Creating rate schedules...');
            // Standard rate schedule (default for private pay)
            const standardRateId = uuidv4();
            await client.query(`
        INSERT INTO rate_schedules (
          id, organization_id, branch_id, name, description, schedule_type,
          effective_from, rates, status,
          approved_by, approved_at,
          created_by, updated_by, created_at, updated_at, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
        `, [
                standardRateId,
                orgId,
                branchId,
                'Standard Rates 2024',
                'Standard service rates for 2024',
                'STANDARD',
                '2024-01-01',
                JSON.stringify([
                    {
                        id: uuidv4(),
                        serviceTypeId: uuidv4(),
                        serviceTypeCode: 'S5126',
                        serviceTypeName: 'Home Care - Personal Care',
                        unitType: 'HOUR',
                        unitRate: 28.00,
                        roundingRule: 'QUARTER_HOUR',
                        weekendRate: 1.2,
                        holidayRate: 1.5,
                        nightRate: 1.15,
                    },
                    {
                        id: uuidv4(),
                        serviceTypeId: uuidv4(),
                        serviceTypeCode: 'S5125',
                        serviceTypeName: 'Home Care - Companion',
                        unitType: 'HOUR',
                        unitRate: 22.00,
                        roundingRule: 'QUARTER_HOUR',
                        weekendRate: 1.2,
                        holidayRate: 1.5,
                    },
                    {
                        id: uuidv4(),
                        serviceTypeId: uuidv4(),
                        serviceTypeCode: 'G0156',
                        serviceTypeName: 'Home Health Aide Services',
                        unitType: 'HOUR',
                        unitRate: 32.00,
                        roundingRule: 'QUARTER_HOUR',
                        weekendRate: 1.2,
                        holidayRate: 1.5,
                        nightRate: 1.15,
                    },
                    {
                        id: uuidv4(),
                        serviceTypeId: uuidv4(),
                        serviceTypeCode: 'S5125',
                        serviceTypeName: 'Respite Care',
                        unitType: 'HOUR',
                        unitRate: 25.00,
                        roundingRule: 'HALF_HOUR',
                    },
                ]),
                'ACTIVE',
                systemUserId,
                '2024-01-05',
                systemUserId,
                systemUserId,
                new Date(),
                new Date(),
                1,
            ]);
            // Medicare rate schedule
            const medicareRateId = uuidv4();
            await client.query(`
        INSERT INTO rate_schedules (
          id, organization_id, branch_id, name, description, schedule_type,
          payer_id, payer_type, payer_name,
          effective_from, rates, status,
          approved_by, approved_at,
          created_by, updated_by, created_at, updated_at, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
        `, [
                medicareRateId,
                orgId,
                branchId,
                'Medicare Rates 2024',
                'Medicare contracted rates for 2024',
                'PAYER_SPECIFIC',
                medicareId,
                'MEDICARE',
                'Medicare Part A & B',
                '2024-01-01',
                JSON.stringify([
                    {
                        id: uuidv4(),
                        serviceTypeId: uuidv4(),
                        serviceTypeCode: 'G0156',
                        serviceTypeName: 'Home Health Aide Services',
                        unitType: 'HOUR',
                        unitRate: 29.50,
                        roundingRule: 'QUARTER_HOUR',
                        minimumUnits: 1,
                        maximumUnits: 8,
                    },
                    {
                        id: uuidv4(),
                        serviceTypeId: uuidv4(),
                        serviceTypeCode: 'S5126',
                        serviceTypeName: 'Personal Care',
                        unitType: 'HOUR',
                        unitRate: 26.00,
                        roundingRule: 'QUARTER_HOUR',
                        minimumUnits: 1,
                        maximumUnits: 6,
                    },
                ]),
                'ACTIVE',
                systemUserId,
                '2024-01-10',
                systemUserId,
                systemUserId,
                new Date(),
                new Date(),
                1,
            ]);
            // Medicaid rate schedule
            const medicaidRateId = uuidv4();
            await client.query(`
        INSERT INTO rate_schedules (
          id, organization_id, branch_id, name, description, schedule_type,
          payer_id, payer_type, payer_name,
          effective_from, rates, status,
          approved_by, approved_at,
          created_by, updated_by, created_at, updated_at, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
        `, [
                medicaidRateId,
                orgId,
                branchId,
                'Illinois Medicaid Rates 2024',
                'Illinois Medicaid approved rates for 2024',
                'PAYER_SPECIFIC',
                medicaidId,
                'MEDICAID',
                'Illinois Medicaid',
                '2024-01-01',
                JSON.stringify([
                    {
                        id: uuidv4(),
                        serviceTypeId: uuidv4(),
                        serviceTypeCode: 'S5126',
                        serviceTypeName: 'Personal Care Services',
                        unitType: 'HOUR',
                        unitRate: 24.50,
                        roundingRule: 'QUARTER_HOUR',
                        minimumUnits: 0.25,
                        maximumUnits: 20,
                    },
                    {
                        id: uuidv4(),
                        serviceTypeId: uuidv4(),
                        serviceTypeCode: 'S5125',
                        serviceTypeName: 'Homemaker Services',
                        unitType: 'HOUR',
                        unitRate: 20.00,
                        roundingRule: 'QUARTER_HOUR',
                        minimumUnits: 0.25,
                        maximumUnits: 15,
                    },
                ]),
                'ACTIVE',
                systemUserId,
                '2024-01-08',
                systemUserId,
                systemUserId,
                new Date(),
                new Date(),
                1,
            ]);
            console.log('  ✓ Created 3 rate schedules');
            // ========================================================================
            // CREATE SERVICE AUTHORIZATIONS
            // ========================================================================
            console.log('Creating service authorizations...');
            const authorizations = [];
            // Create authorizations for active clients with insurance
            for (let i = 0; i < Math.min(clients.length, 2); i++) {
                const client = clients[i];
                const authId = uuidv4();
                // Determine payer based on client
                const payerId = i === 0 ? medicareId : medicaidId;
                const payerType = i === 0 ? 'MEDICARE' : 'MEDICAID';
                const payerName = i === 0 ? 'Medicare Part A & B' : 'Illinois Medicaid';
                const authNumber = `AUTH-2024-${String(i + 1).padStart(4, '0')}`;
                await client.query(`
          INSERT INTO service_authorizations (
            id, organization_id, branch_id, client_id,
            authorization_number, authorization_type,
            payer_id, payer_type, payer_name,
            service_type_id, service_type_code, service_type_name,
            authorized_units, unit_type, unit_rate, authorized_amount,
            effective_from, effective_to,
            used_units, remaining_units, billed_units,
            requires_referral, status, status_history,
            low_units_threshold, expiration_warning_days,
            notes,
            created_by, updated_by, created_at, updated_at, version
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
          )
          `, [
                    authId,
                    orgId,
                    branchId,
                    client.id,
                    authNumber,
                    'INITIAL',
                    payerId,
                    payerType,
                    payerName,
                    uuidv4(), // service_type_id
                    'S5126',
                    'Personal Care Services',
                    320, // 80 hours over 3 months
                    'HOUR',
                    i === 0 ? 26.00 : 24.50,
                    i === 0 ? 8320.00 : 7840.00,
                    '2024-01-15',
                    '2024-04-15',
                    12.5, // Some units already used
                    307.5,
                    8.0, // Some units already billed
                    false,
                    'ACTIVE',
                    JSON.stringify([
                        {
                            id: uuidv4(),
                            fromStatus: null,
                            toStatus: 'PENDING',
                            timestamp: '2024-01-10T10:00:00Z',
                            changedBy: systemUserId,
                            reason: 'Authorization requested',
                        },
                        {
                            id: uuidv4(),
                            fromStatus: 'PENDING',
                            toStatus: 'ACTIVE',
                            timestamp: '2024-01-15T14:30:00Z',
                            changedBy: systemUserId,
                            reason: 'Authorization approved by payer',
                        },
                    ]),
                    50, // Alert when below 50 hours
                    30, // Alert 30 days before expiration
                    `Initial authorization for personal care services - ${client.first_name} ${client.last_name}`,
                    systemUserId,
                    systemUserId,
                    new Date(),
                    new Date(),
                    1,
                ]);
                authorizations.push({ id: authId, clientId: client.id, authNumber, payerId });
            }
            console.log(`  ✓ Created ${authorizations.length} service authorizations`);
            // ========================================================================
            // CREATE BILLABLE ITEMS
            // ========================================================================
            console.log('Creating billable items...');
            const billableItems = [];
            // Generate billable items for the past month
            const today = new Date();
            const oneMonthAgo = new Date(today);
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            // Create 15 billable items across different clients, dates, and statuses
            for (let i = 0; i < 15; i++) {
                const itemId = uuidv4();
                const clientIndex = i % Math.min(clients.length, 3);
                const client = clients[clientIndex];
                const caregiver = caregivers[i % caregivers.length];
                // Stagger dates over the past month
                const serviceDate = new Date(oneMonthAgo);
                serviceDate.setDate(serviceDate.getDate() + (i * 2));
                // Vary service times and durations
                const startTime = new Date(serviceDate);
                startTime.setHours(9 + (i % 8), 0, 0, 0);
                const durationMinutes = [90, 120, 150, 180][i % 4];
                const endTime = new Date(startTime);
                endTime.setMinutes(endTime.getMinutes() + durationMinutes);
                // Calculate units and amounts
                const units = durationMinutes / 60;
                const unitRate = [28.00, 26.00, 24.50][clientIndex % 3];
                const subtotal = units * unitRate;
                const finalAmount = subtotal;
                // Determine payer and authorization
                const auth = authorizations.find((a) => a.clientId === client.id);
                const payerId = auth ? auth.payerId : privatePayId;
                const payerType = auth
                    ? clientIndex === 0
                        ? 'MEDICARE'
                        : 'MEDICAID'
                    : 'PRIVATE_PAY';
                const payerName = auth
                    ? clientIndex === 0
                        ? 'Medicare Part A & B'
                        : 'Illinois Medicaid'
                    : 'Private Pay';
                // Vary statuses for realism
                const statusOptions = ['READY', 'INVOICED', 'SUBMITTED', 'PAID'];
                const status = statusOptions[Math.min(Math.floor(i / 4), statusOptions.length - 1)];
                await client.query(`
          INSERT INTO billable_items (
            id, organization_id, branch_id, client_id,
            visit_id, evv_record_id,
            service_type_id, service_type_code, service_type_name,
            service_date, start_time, end_time, duration_minutes,
            caregiver_id, caregiver_name,
            rate_schedule_id, unit_type, units, unit_rate, subtotal,
            final_amount,
            authorization_id, authorization_number, is_authorized,
            payer_id, payer_type, payer_name,
            status, status_history,
            is_hold, requires_review, is_denied, is_paid,
            created_by, updated_by, created_at, updated_at, version
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
            $31, $32, $33, $34, $35, $36, $37, $38
          )
          `, [
                    itemId,
                    orgId,
                    branchId,
                    client.id,
                    null, // visit_id
                    null, // evv_record_id
                    uuidv4(), // service_type_id
                    'S5126',
                    'Personal Care Services',
                    serviceDate.toISOString().split('T')[0],
                    startTime.toISOString(),
                    endTime.toISOString(),
                    durationMinutes,
                    caregiver.id,
                    `${caregiver.first_name} ${caregiver.last_name}`,
                    standardRateId,
                    'HOUR',
                    units,
                    unitRate,
                    subtotal,
                    finalAmount,
                    auth ? auth.id : null,
                    auth ? auth.authNumber : null,
                    auth ? true : false,
                    payerId,
                    payerType,
                    payerName,
                    status,
                    JSON.stringify([
                        {
                            id: uuidv4(),
                            fromStatus: null,
                            toStatus: 'PENDING',
                            timestamp: serviceDate.toISOString(),
                            changedBy: systemUserId,
                        },
                        {
                            id: uuidv4(),
                            fromStatus: 'PENDING',
                            toStatus: status,
                            timestamp: new Date().toISOString(),
                            changedBy: systemUserId,
                        },
                    ]),
                    false,
                    false,
                    false,
                    status === 'PAID',
                    systemUserId,
                    systemUserId,
                    new Date(),
                    new Date(),
                    1,
                ]);
                billableItems.push({
                    id: itemId,
                    clientId: client.id,
                    payerId,
                    finalAmount,
                    status,
                    serviceDate,
                });
            }
            console.log(`  ✓ Created ${billableItems.length} billable items`);
            // ========================================================================
            // CREATE INVOICES
            // ========================================================================
            console.log('Creating invoices...');
            const invoices = [];
            // Group billable items by payer for invoicing
            const itemsByPayer = billableItems
                .filter((item) => item.status !== 'READY')
                .reduce((acc, item) => {
                if (!acc[item.payerId]) {
                    acc[item.payerId] = [];
                }
                acc[item.payerId].push(item);
                return acc;
            }, {});
            let invoiceSequence = 1;
            for (const [payerId, items] of Object.entries(itemsByPayer)) {
                const invoiceId = uuidv4();
                const invoiceNumber = `INV-CCHH-2024-${String(invoiceSequence++).padStart(6, '0')}`;
                // Calculate totals
                const subtotal = items.reduce((sum, item) => sum + item.finalAmount, 0);
                const taxAmount = 0; // No tax for healthcare services
                const totalAmount = subtotal;
                const paidAmount = items.every((item) => item.status === 'PAID')
                    ? totalAmount
                    : 0;
                const balanceDue = totalAmount - paidAmount;
                // Determine invoice period
                const dates = items.map((item) => new Date(item.serviceDate));
                const periodStart = new Date(Math.min(...dates.map((d) => d.getTime())));
                const periodEnd = new Date(Math.max(...dates.map((d) => d.getTime())));
                const invoiceDate = new Date(periodEnd);
                invoiceDate.setDate(invoiceDate.getDate() + 5);
                const dueDate = new Date(invoiceDate);
                dueDate.setDate(dueDate.getDate() + 30);
                // Get payer info
                const payerResult = await client.query('SELECT payer_name, payer_type FROM payers WHERE id = $1', [payerId]);
                const payer = payerResult.rows[0];
                // Determine status
                const status = paidAmount === totalAmount ? 'PAID' : 'SENT';
                // Create line items
                const lineItems = items.map((item) => ({
                    id: uuidv4(),
                    billableItemId: item.id,
                    serviceDate: item.serviceDate,
                    serviceCode: 'S5126',
                    serviceDescription: 'Personal Care Services',
                    unitType: 'HOUR',
                    units: item.finalAmount / 26.0, // Rough approximation
                    unitRate: 26.0,
                    subtotal: item.finalAmount,
                    adjustments: 0,
                    total: item.finalAmount,
                }));
                await client.query(`
          INSERT INTO invoices (
            id, organization_id, branch_id,
            invoice_number, invoice_type,
            payer_id, payer_type, payer_name,
            period_start, period_end, invoice_date, due_date,
            billable_item_ids, line_items,
            subtotal, tax_amount, discount_amount, adjustment_amount,
            total_amount, paid_amount, balance_due,
            status, status_history,
            payments,
            created_by, updated_by, created_at, updated_at, version
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29
          )
          `, [
                    invoiceId,
                    orgId,
                    branchId,
                    invoiceNumber,
                    'STANDARD',
                    payerId,
                    payer.payer_type,
                    payer.payer_name,
                    periodStart.toISOString().split('T')[0],
                    periodEnd.toISOString().split('T')[0],
                    invoiceDate.toISOString().split('T')[0],
                    dueDate.toISOString().split('T')[0],
                    JSON.stringify(items.map((item) => item.id)),
                    JSON.stringify(lineItems),
                    subtotal,
                    taxAmount,
                    0, // discount
                    0, // adjustment
                    totalAmount,
                    paidAmount,
                    balanceDue,
                    status,
                    JSON.stringify([
                        {
                            id: uuidv4(),
                            fromStatus: null,
                            toStatus: 'DRAFT',
                            timestamp: invoiceDate.toISOString(),
                            changedBy: systemUserId,
                        },
                        {
                            id: uuidv4(),
                            fromStatus: 'DRAFT',
                            toStatus: status,
                            timestamp: new Date().toISOString(),
                            changedBy: systemUserId,
                        },
                    ]),
                    JSON.stringify([]),
                    systemUserId,
                    systemUserId,
                    new Date(),
                    new Date(),
                    1,
                ]);
                invoices.push({
                    id: invoiceId,
                    invoiceNumber,
                    payerId,
                    totalAmount,
                    paidAmount,
                    balanceDue,
                });
            }
            console.log(`  ✓ Created ${invoices.length} invoices`);
            // ========================================================================
            // CREATE PAYMENTS
            // ========================================================================
            console.log('Creating payments...');
            const payments = [];
            // Create payments for paid invoices
            const paidInvoices = invoices.filter((inv) => inv.paidAmount > 0);
            for (let i = 0; i < paidInvoices.length; i++) {
                const invoice = paidInvoices[i];
                const paymentId = uuidv4();
                const paymentNumber = `PAY-CCHH-2024-${String(i + 1).padStart(6, '0')}`;
                // Get payer info
                const payerResult = await client.query('SELECT payer_name, payer_type FROM payers WHERE id = $1', [invoice.payerId]);
                const payer = payerResult.rows[0];
                const paymentDate = new Date();
                paymentDate.setDate(paymentDate.getDate() - (5 + i));
                await client.query(`
          INSERT INTO payments (
            id, organization_id, branch_id,
            payment_number, payment_type,
            payer_id, payer_type, payer_name,
            amount, currency,
            payment_date, received_date,
            payment_method, reference_number,
            allocations, unapplied_amount,
            status, status_history,
            is_reconciled,
            created_by, updated_by, created_at, updated_at, version
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24
          )
          `, [
                    paymentId,
                    orgId,
                    branchId,
                    paymentNumber,
                    'FULL',
                    invoice.payerId,
                    payer.payer_type,
                    payer.payer_name,
                    invoice.paidAmount,
                    'USD',
                    paymentDate.toISOString().split('T')[0],
                    paymentDate.toISOString().split('T')[0],
                    ['CHECK', 'EFT', 'ACH'][i % 3],
                    `REF-${String(10000 + i)}`,
                    JSON.stringify([
                        {
                            id: uuidv4(),
                            invoiceId: invoice.id,
                            invoiceNumber: invoice.invoiceNumber,
                            amount: invoice.paidAmount,
                            appliedAt: new Date().toISOString(),
                            appliedBy: systemUserId,
                        },
                    ]),
                    0, // fully applied
                    'APPLIED',
                    JSON.stringify([
                        {
                            id: uuidv4(),
                            fromStatus: null,
                            toStatus: 'RECEIVED',
                            timestamp: paymentDate.toISOString(),
                            changedBy: systemUserId,
                        },
                        {
                            id: uuidv4(),
                            fromStatus: 'RECEIVED',
                            toStatus: 'APPLIED',
                            timestamp: new Date().toISOString(),
                            changedBy: systemUserId,
                        },
                    ]),
                    true,
                    systemUserId,
                    systemUserId,
                    new Date(),
                    new Date(),
                    1,
                ]);
                payments.push({ id: paymentId, invoiceId: invoice.id, amount: invoice.paidAmount });
            }
            console.log(`  ✓ Created ${payments.length} payments`);
            console.log('\n✅ Billing data seeded successfully!');
            console.log('\n📊 Summary:');
            console.log(`  Payers: 5`);
            console.log(`  Rate Schedules: 3`);
            console.log(`  Service Authorizations: ${authorizations.length}`);
            console.log(`  Billable Items: ${billableItems.length}`);
            console.log(`  Invoices: ${invoices.length}`);
            console.log(`  Payments: ${payments.length}`);
            console.log(`\n💡 Ready for billing operations demo!`);
        });
    }
    catch (error) {
        console.error('❌ Billing seeding failed:', error);
        process.exit(1);
    }
    finally {
        await db.close();
    }
}
seedBillingData().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
