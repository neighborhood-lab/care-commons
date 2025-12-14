/**
 * Growth Opportunity Analysis Service
 *
 * AI-powered analysis to identify geographic, service line, payer,
 * and partnership growth opportunities for home care agencies.
 */

import { Database, UserContext } from '@folkcare/core';
import { AnalyticsRepository } from '../repository/analytics-repository.js';
import {
  GrowthOpportunityType,
  MarketAttractiveness,
  GeographicOpportunity,
  ServiceLineOpportunity,
  PayerDiversificationOpportunity,
  PartnershipOpportunity,
  GrowthOpportunitySummary,
  GrowthOpportunityAnalysis,
  GrowthOpportunityQueryOptions,
  ServiceType,
  PayerType,
} from '../types/analytics.js';

// Market size constants (industry averages for estimation)
const ELDERLY_CARE_NEED_RATE = 0.15; // 15% of 65+ need home care
const AVG_ANNUAL_REVENUE_PER_CLIENT = 18000;

// Service type characteristics
const SERVICE_CHARACTERISTICS: Record<ServiceType, {
  avgMargin: number;
  staffingRatio: number;
  trainingWeeks: number;
  licensingRequired: boolean;
}> = {
  PERSONAL_CARE: { avgMargin: 0.22, staffingRatio: 6, trainingWeeks: 2, licensingRequired: false },
  HOMEMAKER: { avgMargin: 0.25, staffingRatio: 8, trainingWeeks: 1, licensingRequired: false },
  COMPANION: { avgMargin: 0.28, staffingRatio: 10, trainingWeeks: 1, licensingRequired: false },
  RESPITE: { avgMargin: 0.20, staffingRatio: 4, trainingWeeks: 2, licensingRequired: false },
  SKILLED_NURSING: { avgMargin: 0.15, staffingRatio: 4, trainingWeeks: 0, licensingRequired: true },
  PHYSICAL_THERAPY: { avgMargin: 0.18, staffingRatio: 5, trainingWeeks: 0, licensingRequired: true },
  OCCUPATIONAL_THERAPY: { avgMargin: 0.18, staffingRatio: 5, trainingWeeks: 0, licensingRequired: true },
  SPEECH_THERAPY: { avgMargin: 0.17, staffingRatio: 6, trainingWeeks: 0, licensingRequired: true },
  HOSPICE: { avgMargin: 0.12, staffingRatio: 3, trainingWeeks: 4, licensingRequired: true },
  OTHER: { avgMargin: 0.20, staffingRatio: 6, trainingWeeks: 2, licensingRequired: false },
};

// Payer type characteristics for diversification analysis
const PAYER_DIVERSIFICATION_TARGETS: Record<PayerType, {
  targetPercentage: number;
  avgReimbursement: number;
  credentialingMonths: number;
}> = {
  MEDICARE: { targetPercentage: 0.35, avgReimbursement: 55, credentialingMonths: 4 },
  MEDICAID: { targetPercentage: 0.25, avgReimbursement: 45, credentialingMonths: 6 },
  PRIVATE_INSURANCE: { targetPercentage: 0.20, avgReimbursement: 65, credentialingMonths: 3 },
  PRIVATE_PAY: { targetPercentage: 0.10, avgReimbursement: 75, credentialingMonths: 0 },
  VA: { targetPercentage: 0.05, avgReimbursement: 58, credentialingMonths: 5 },
  WORKERS_COMP: { targetPercentage: 0.02, avgReimbursement: 70, credentialingMonths: 4 },
  MANAGED_CARE: { targetPercentage: 0.02, avgReimbursement: 52, credentialingMonths: 4 },
  OTHER: { targetPercentage: 0.01, avgReimbursement: 50, credentialingMonths: 2 },
};

export class GrowthOpportunityService {
  private repository: AnalyticsRepository;

  constructor(database: Database) {
    this.repository = new AnalyticsRepository(database);
  }

  /**
   * Get comprehensive growth opportunity analysis
   */
  async getGrowthOpportunityAnalysis(
    options: GrowthOpportunityQueryOptions,
    context: UserContext
  ): Promise<GrowthOpportunityAnalysis> {
    this.validateAccess(context, options.organizationId, options.branchId);

    const { organizationId, branchId } = options;
    const includeAll = !options.opportunityTypes || options.opportunityTypes.length === 0;

    // Get current organization metrics for context
    const currentMetrics = await this.getCurrentMetrics(organizationId, branchId);

    // Analyze different opportunity types
    const geographicOpportunities =
      (options.includeGeographic !== false &&
        (includeAll || options.opportunityTypes?.includes('GEOGRAPHIC_EXPANSION')))
        ? await this.analyzeGeographicOpportunities(organizationId, branchId, options.geographicRadius)
        : [];

    const serviceLineOpportunities =
      (options.includeServiceLine !== false &&
        (includeAll || options.opportunityTypes?.includes('SERVICE_LINE_EXPANSION')))
        ? await this.analyzeServiceLineOpportunities(organizationId, branchId)
        : [];

    const payerDiversification =
      (options.includePayerDiversification !== false &&
        (includeAll || options.opportunityTypes?.includes('PAYER_DIVERSIFICATION')))
        ? await this.analyzePayerDiversification(organizationId, branchId)
        : [];

    const partnershipOpportunities =
      (options.includePartnerships !== false &&
        (includeAll || options.opportunityTypes?.includes('PARTNERSHIP_OPPORTUNITY')))
        ? await this.analyzePartnershipOpportunities(organizationId, branchId)
        : [];

    // Apply minimum score filter if specified
    const minScore = options.minimumOpportunityScore || 0;
    const filteredGeo = geographicOpportunities.filter(o => o.opportunityScore >= minScore);
    const filteredService = serviceLineOpportunities.filter(o => o.opportunityScore >= minScore);
    const filteredPayer = payerDiversification.filter(o => o.opportunityScore >= minScore);
    const filteredPartner = partnershipOpportunities.filter(o => o.opportunityScore >= minScore);

    // Calculate summary
    const summary = this.calculateSummary(
      filteredGeo,
      filteredService,
      filteredPayer,
      filteredPartner
    );

    // Generate prioritized recommendations
    const recommendations = this.generateRecommendations(
      filteredGeo,
      filteredService,
      filteredPayer,
      filteredPartner
    );

    // Generate SWOT analysis
    const swotAnalysis = this.generateSwotAnalysis(
      currentMetrics,
      filteredGeo,
      filteredService,
      filteredPayer,
      filteredPartner
    );

    // Set growth targets
    const growthTargets = this.calculateGrowthTargets(currentMetrics, summary);

    return {
      analyzedAt: new Date().toISOString(),
      organizationId,
      branchId,
      summary,
      geographicOpportunities: filteredGeo,
      serviceLineOpportunities: filteredService,
      payerDiversification: filteredPayer,
      partnershipOpportunities: filteredPartner,
      recommendations,
      swotAnalysis,
      growthTargets,
    };
  }

  /**
   * Get current organization metrics for context
   */
  private async getCurrentMetrics(
    organizationId: string,
    branchId?: string
  ): Promise<{
    currentRevenue: number;
    clientCount: number;
    caregiverCount: number;
    serviceAreas: string[];
    payerMix: Record<string, number>;
    servicesOffered: ServiceType[];
  }> {
    // Get date range for last 12 months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const dateRange = { startDate, endDate };

    // Fetch metrics from repository
    const revenue = await this.repository.sumPaidAmount(organizationId, dateRange, branchId);
    const clientCount = await this.repository.countActiveClients(organizationId, branchId);
    const revenueByPayer = await this.repository.getRevenueByPayer(organizationId, dateRange, branchId);

    // Calculate payer mix percentages
    const totalRevenue = revenue || 1;
    const payerMix: Record<string, number> = {};
    for (const payer of revenueByPayer) {
      payerMix[payer.payerId] = payer.paidAmount / totalRevenue;
    }

    // Estimate caregiver count based on clients (typical ratio)
    const caregiverCount = Math.ceil(clientCount * 0.8);

    // For demo purposes, assume standard services are offered
    const servicesOffered: ServiceType[] = ['PERSONAL_CARE', 'HOMEMAKER', 'COMPANION'];

    return {
      currentRevenue: revenue,
      clientCount,
      caregiverCount,
      serviceAreas: ['Primary Service Area'],
      payerMix,
      servicesOffered,
    };
  }

  /**
   * Analyze geographic expansion opportunities
   */
  private async analyzeGeographicOpportunities(
    organizationId: string,
    branchId?: string,
    _radiusMiles?: number
  ): Promise<GeographicOpportunity[]> {
    // Get current client count for context
    const clientCount = await this.repository.countActiveClients(organizationId, branchId);

    // Generate sample opportunities based on typical market characteristics
    // In production, this would integrate with demographic data providers
    const opportunities: GeographicOpportunity[] = [
      this.generateGeographicOpportunity(
        'adjacent-north',
        'North County Region',
        'COUNTY',
        85000,
        18500,
        clientCount,
        3,
        'HIGH'
      ),
      this.generateGeographicOpportunity(
        'adjacent-east',
        'East Metro Area',
        'CITY',
        62000,
        13000,
        clientCount,
        5,
        'MEDIUM'
      ),
      this.generateGeographicOpportunity(
        'underserved-1',
        'Riverside Community',
        'ZIP_CODE',
        28000,
        7200,
        clientCount,
        1,
        'HIGH'
      ),
      this.generateGeographicOpportunity(
        'expansion-zone',
        'South Valley District',
        'COUNTY',
        95000,
        21000,
        clientCount,
        7,
        'MEDIUM'
      ),
    ];

    // Sort by opportunity score descending
    return [...opportunities].sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  /**
   * Generate a geographic opportunity record
   */
  private generateGeographicOpportunity(
    areaId: string,
    areaName: string,
    areaType: 'ZIP_CODE' | 'CITY' | 'COUNTY' | 'STATE' | 'REGION',
    totalPopulation: number,
    elderlyPopulation: number,
    currentClientCount: number,
    competitorCount: number,
    attractiveness: MarketAttractiveness
  ): GeographicOpportunity {
    const elderlyPercentage = elderlyPopulation / totalPopulation;
    const potentialClients = Math.round(elderlyPopulation * ELDERLY_CARE_NEED_RATE);
    const currentPenetration = currentClientCount / potentialClients;
    const untappedRevenue = (potentialClients - currentClientCount) * AVG_ANNUAL_REVENUE_PER_CLIENT;
    const estimatedMarketSize = potentialClients * AVG_ANNUAL_REVENUE_PER_CLIENT;
    const competitorDensity = (competitorCount / elderlyPopulation) * 10000;
    const marketShare = currentClientCount / potentialClients;

    // Calculate investment and ROI
    const investmentRequired = this.calculateGeographicInvestment(areaType, competitorCount);
    const estimatedROI = ((untappedRevenue * 0.2) - investmentRequired) / investmentRequired;
    const timeToBreakeven = Math.round(investmentRequired / (untappedRevenue * 0.2 / 12));

    // Calculate opportunity score (0-100)
    let opportunityScore = 50;
    if (attractiveness === 'HIGH') opportunityScore += 25;
    else if (attractiveness === 'MEDIUM') opportunityScore += 10;
    opportunityScore += Math.min(20, (1 - currentPenetration) * 30);
    opportunityScore -= Math.min(15, competitorDensity * 3);
    opportunityScore += Math.min(10, elderlyPercentage * 40);
    opportunityScore = Math.max(0, Math.min(100, Math.round(opportunityScore)));

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (competitorCount >= 5 || investmentRequired > 200000) {
      riskLevel = 'HIGH';
    } else if (competitorCount >= 3 || investmentRequired > 100000) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    const riskFactors: string[] = [];
    if (competitorCount >= 4) riskFactors.push('High competitor density');
    if (investmentRequired > 150000) riskFactors.push('Significant capital requirement');
    if (currentPenetration < 0.02) riskFactors.push('Limited existing brand awareness');

    return {
      areaId,
      areaName,
      areaType,
      totalPopulation,
      elderlyPopulation,
      elderlyPercentage,
      populationGrowthRate: 0.02 + Math.random() * 0.03,
      currentClientCount: Math.floor(currentClientCount * 0.1),
      currentCaregiverCount: Math.floor(currentClientCount * 0.08),
      marketPenetration: currentPenetration,
      estimatedMarketSize,
      potentialClients,
      untappedRevenue,
      competitorCount,
      competitorDensity,
      marketShare,
      attractiveness,
      opportunityScore,
      investmentRequired,
      estimatedROI,
      timeToBreakeven,
      riskLevel,
      riskFactors,
    };
  }

  /**
   * Calculate geographic expansion investment
   */
  private calculateGeographicInvestment(
    areaType: string,
    competitorCount: number
  ): number {
    let baseInvestment = 0;
    switch (areaType) {
      case 'ZIP_CODE':
        baseInvestment = 25000;
        break;
      case 'CITY':
        baseInvestment = 75000;
        break;
      case 'COUNTY':
        baseInvestment = 150000;
        break;
      case 'STATE':
        baseInvestment = 500000;
        break;
      default:
        baseInvestment = 100000;
    }
    // Add marketing costs for competitive markets
    return baseInvestment + competitorCount * 10000;
  }

  /**
   * Analyze service line expansion opportunities
   */
  private async analyzeServiceLineOpportunities(
    organizationId: string,
    branchId?: string
  ): Promise<ServiceLineOpportunity[]> {
    const dateRange = this.getLastYearDateRange();
    const revenue = await this.repository.sumPaidAmount(organizationId, dateRange, branchId);
    const clientCount = await this.repository.countActiveClients(organizationId, branchId);

    const opportunities: ServiceLineOpportunity[] = [];

    // Analyze each service type
    for (const [serviceType, characteristics] of Object.entries(SERVICE_CHARACTERISTICS)) {
      const service = serviceType as ServiceType;
      const isCurrentlyOffered = ['PERSONAL_CARE', 'HOMEMAKER', 'COMPANION'].includes(service);

      // Calculate market opportunity
      const tam = this.estimateTotalAddressableMarket(service, clientCount);
      const demandTrend = this.getDemandTrend(service);
      const demandGrowthRate = demandTrend === 'GROWING' ? 0.08 : demandTrend === 'STABLE' ? 0.02 : -0.02;

      // Calculate investment
      const staffingNeeded = Math.ceil(clientCount / characteristics.staffingRatio);
      const trainingCost = staffingNeeded * characteristics.trainingWeeks * 1500;
      const equipmentCost = characteristics.licensingRequired ? 25000 : 5000;
      const certificationCost = characteristics.licensingRequired ? 15000 : 0;
      const totalInvestment = trainingCost + equipmentCost + certificationCost + 20000; // Plus overhead

      // Calculate returns
      const expectedRevenue = tam * 0.15; // Capture 15% of TAM
      const expectedMargin = expectedRevenue * characteristics.avgMargin;
      const timeToLaunch = characteristics.licensingRequired ? 6 : 2;
      const paybackPeriod = Math.round(totalInvestment / (expectedMargin / 12));

      // Calculate opportunity score
      let opportunityScore = 50;
      if (!isCurrentlyOffered) opportunityScore += 15; // New service bonus
      if (demandTrend === 'GROWING') opportunityScore += 20;
      opportunityScore += Math.min(15, characteristics.avgMargin * 50);
      if (characteristics.licensingRequired) opportunityScore -= 10;
      opportunityScore = Math.max(0, Math.min(100, Math.round(opportunityScore)));

      // Determine priority
      let priority: 'HIGH' | 'MEDIUM' | 'LOW';
      if (opportunityScore >= 70) priority = 'HIGH';
      else if (opportunityScore >= 50) priority = 'MEDIUM';
      else priority = 'LOW';

      opportunities.push({
        serviceType: service,
        serviceName: this.formatServiceName(service),
        currentlyOffered: isCurrentlyOffered,
        currentRevenue: isCurrentlyOffered ? revenue * 0.3 : 0,
        currentClientCount: isCurrentlyOffered ? Math.floor(clientCount * 0.4) : 0,
        currentMarketShare: isCurrentlyOffered ? 0.08 : 0,
        totalAddressableMarket: tam,
        demandTrend,
        demandGrowthRate,
        unmetDemand: tam * 0.6,
        competitorCount: Math.floor(Math.random() * 8) + 2,
        averageCompetitorPrice: 25 + Math.random() * 15,
        competitiveAdvantage: this.getCompetitiveAdvantage(service, isCurrentlyOffered),
        staffingNeeded,
        trainingCost,
        equipmentCost,
        certificationCost,
        totalInvestment,
        expectedRevenue,
        expectedMargin,
        timeToLaunch,
        paybackPeriod,
        opportunityScore,
        priority,
        recommendation: this.getServiceRecommendation(service, isCurrentlyOffered, opportunityScore),
      });
    }

    // Sort by opportunity score and filter to non-offered or high-value services
    return [...opportunities]
      .filter(o => !o.currentlyOffered || o.opportunityScore >= 60)
      .sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  /**
   * Estimate total addressable market for a service type
   */
  private estimateTotalAddressableMarket(
    _service: ServiceType,
    clientCount: number
  ): number {
    // Estimate based on current client base and market multiplier
    const marketMultiplier = 10; // Assume capturing 10% of current market
    return clientCount * marketMultiplier * AVG_ANNUAL_REVENUE_PER_CLIENT * 0.3;
  }

  /**
   * Get demand trend for service type
   */
  private getDemandTrend(service: ServiceType): 'GROWING' | 'STABLE' | 'DECLINING' {
    // Growing services based on demographic trends and aging population
    const growingServices: ServiceType[] = ['SKILLED_NURSING', 'PHYSICAL_THERAPY', 'RESPITE', 'PERSONAL_CARE'];
    if (growingServices.includes(service)) return 'GROWING';
    // All other services are stable - no home care services are currently declining
    return 'STABLE';
  }

  /**
   * Format service type name for display
   */
  private formatServiceName(service: ServiceType): string {
    return service
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get competitive advantage description
   */
  private getCompetitiveAdvantage(service: ServiceType, currentlyOffered: boolean): string | undefined {
    if (currentlyOffered) {
      return 'Established client relationships and operational expertise';
    }
    if (['SKILLED_NURSING', 'PHYSICAL_THERAPY'].includes(service)) {
      return 'Growing demand with limited qualified providers';
    }
    return undefined;
  }

  /**
   * Get service line recommendation
   */
  private getServiceRecommendation(
    service: ServiceType,
    currentlyOffered: boolean,
    score: number
  ): string {
    if (currentlyOffered) {
      return score >= 70
        ? `Expand ${this.formatServiceName(service)} capacity to capture growing demand`
        : `Optimize current ${this.formatServiceName(service)} operations`;
    }
    return score >= 70
      ? `Strong opportunity to launch ${this.formatServiceName(service)} services`
      : `Consider ${this.formatServiceName(service)} for future expansion`;
  }

  /**
   * Analyze payer diversification opportunities
   */
  private async analyzePayerDiversification(
    organizationId: string,
    branchId?: string
  ): Promise<PayerDiversificationOpportunity[]> {
    const dateRange = this.getLastYearDateRange();
    const revenue = await this.repository.sumPaidAmount(organizationId, dateRange, branchId);
    const revenueByPayer = await this.repository.getRevenueByPayer(organizationId, dateRange, branchId);

    const opportunities: PayerDiversificationOpportunity[] = [];

    // Analyze each payer type
    for (const [payerType, targets] of Object.entries(PAYER_DIVERSIFICATION_TARGETS)) {
      const payer = payerType as PayerType;

      // Estimate current revenue for this payer type based on payer name patterns
      // Note: RevenueByPayer doesn't include payerType, so we estimate from payer names
      const currentPayerRevenue = revenueByPayer
        .filter(p => this.matchesPayerType(p.payerName, payer))
        .reduce((sum, p) => sum + p.paidAmount, 0);
      const currentPercentage = currentPayerRevenue / (revenue || 1);
      const currentPayerCount = revenueByPayer.filter(p => this.matchesPayerType(p.payerName, payer)).length;

      // Calculate gap from target
      const targetRevenue = revenue * targets.targetPercentage;
      const revenueGap = Math.max(0, targetRevenue - currentPayerRevenue);

      // Calculate diversification benefit
      const riskReductionScore = this.calculateRiskReduction(currentPercentage, targets.targetPercentage);
      const revenueStabilityImpact = revenueGap * 0.9; // 90% stability factor

      // Calculate investment
      const investmentRequired = targets.credentialingMonths * 5000 + 15000; // Credentialing + admin

      // Calculate opportunity score
      let opportunityScore = 40;
      if (currentPercentage < targets.targetPercentage * 0.5) opportunityScore += 30;
      else if (currentPercentage < targets.targetPercentage) opportunityScore += 15;
      opportunityScore += riskReductionScore / 5;
      if (targets.avgReimbursement > 60) opportunityScore += 10;
      opportunityScore = Math.max(0, Math.min(100, Math.round(opportunityScore)));

      // Generate compliance requirements
      const complianceRequirements = this.getPayerComplianceRequirements(payer);

      opportunities.push({
        payerType: payer,
        payerTypeName: this.formatPayerTypeName(payer),
        currentPayerCount,
        currentRevenue: currentPayerRevenue,
        revenuePercentage: currentPercentage,
        targetPayerCount: Math.max(currentPayerCount, Math.ceil(targets.targetPercentage * 10)),
        potentialRevenue: revenueGap,
        averageReimbursementRate: targets.avgReimbursement,
        reimbursementVsCurrentAvg: targets.avgReimbursement - 55, // vs industry avg
        riskReductionScore,
        revenueStabilityImpact,
        credentialingTime: targets.credentialingMonths,
        complianceRequirements,
        investmentRequired,
        opportunityScore,
        recommendation: this.getPayerRecommendation(payer, currentPercentage, targets.targetPercentage),
      });
    }

    // Filter to opportunities with room to grow and sort by score
    return [...opportunities]
      .filter(o => o.potentialRevenue > 0)
      .sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  /**
   * Calculate risk reduction score from diversification
   */
  private calculateRiskReduction(current: number, target: number): number {
    if (current >= target) return 0;
    return Math.round((target - current) * 100);
  }

  /**
   * Format payer type name for display
   */
  private formatPayerTypeName(payer: PayerType): string {
    const names: Record<PayerType, string> = {
      MEDICARE: 'Medicare',
      MEDICAID: 'Medicaid',
      PRIVATE_INSURANCE: 'Private Insurance',
      PRIVATE_PAY: 'Private Pay',
      VA: 'Veterans Affairs',
      WORKERS_COMP: "Workers' Compensation",
      MANAGED_CARE: 'Managed Care Organizations',
      OTHER: 'Other Payers',
    };
    return names[payer] || payer;
  }

  /**
   * Get compliance requirements for payer type
   */
  private getPayerComplianceRequirements(payer: PayerType): string[] {
    const requirements: string[] = ['Provider enrollment application', 'Background checks'];
    if (payer === 'MEDICARE' || payer === 'MEDICAID') {
      requirements.push('CMS certification', 'State survey compliance', 'OASIS documentation');
    }
    if (payer === 'VA') {
      requirements.push('VA Community Care Network enrollment');
    }
    if (payer === 'WORKERS_COMP') {
      requirements.push('Workers comp insurance certification');
    }
    return requirements;
  }

  /**
   * Get payer diversification recommendation
   */
  private getPayerRecommendation(payer: PayerType, current: number, target: number): string {
    if (current >= target) {
      return `${this.formatPayerTypeName(payer)} mix is at target level`;
    }
    if (current < target * 0.3) {
      return `Prioritize ${this.formatPayerTypeName(payer)} enrollment for revenue diversification`;
    }
    return `Increase ${this.formatPayerTypeName(payer)} volume to improve payer mix`;
  }

  /**
   * Analyze partnership opportunities
   */
  private async analyzePartnershipOpportunities(
    organizationId: string,
    branchId?: string
  ): Promise<PartnershipOpportunity[]> {
    const clientCount = await this.repository.countActiveClients(organizationId, branchId);

    const partnerTypes: Array<{
      type: PartnershipOpportunity['partnerType'];
      name: string;
      referralPotential: number;
      effortLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    }> = [
      { type: 'HOSPITAL', name: 'Hospitals', referralPotential: 0.25, effortLevel: 'HIGH' },
      { type: 'PHYSICIAN_GROUP', name: 'Physician Groups', referralPotential: 0.20, effortLevel: 'MEDIUM' },
      { type: 'SNF', name: 'Skilled Nursing Facilities', referralPotential: 0.18, effortLevel: 'MEDIUM' },
      { type: 'ACO', name: 'Accountable Care Organizations', referralPotential: 0.15, effortLevel: 'HIGH' },
      { type: 'HEALTH_PLAN', name: 'Health Plans', referralPotential: 0.12, effortLevel: 'HIGH' },
      { type: 'COMMUNITY_ORG', name: 'Community Organizations', referralPotential: 0.08, effortLevel: 'LOW' },
    ];

    const opportunities: PartnershipOpportunity[] = [];

    for (const partner of partnerTypes) {
      // Estimate partner counts and potential
      const estimatedPartnerCount = Math.floor(clientCount / 50) + 3;
      const existingPartners = Math.floor(estimatedPartnerCount * 0.3);
      const referralPotential = Math.round(clientCount * partner.referralPotential);
      const currentReferralVolume = Math.round(referralPotential * 0.4);
      const untappedReferrals = referralPotential - currentReferralVolume;
      const revenueOpportunity = untappedReferrals * AVG_ANNUAL_REVENUE_PER_CLIENT;

      // Calculate opportunity score
      let opportunityScore = 50;
      opportunityScore += Math.min(25, (referralPotential / clientCount) * 100);
      if (partner.effortLevel === 'LOW') opportunityScore += 15;
      else if (partner.effortLevel === 'MEDIUM') opportunityScore += 5;
      opportunityScore += Math.min(10, (estimatedPartnerCount - existingPartners) * 2);
      opportunityScore = Math.max(0, Math.min(100, Math.round(opportunityScore)));

      // Determine strategic value
      let strategicValue: 'HIGH' | 'MEDIUM' | 'LOW';
      if (revenueOpportunity > 500000) strategicValue = 'HIGH';
      else if (revenueOpportunity > 200000) strategicValue = 'MEDIUM';
      else strategicValue = 'LOW';

      opportunities.push({
        partnerType: partner.type,
        partnerTypeName: partner.name,
        partnerCount: estimatedPartnerCount,
        referralPotential,
        revenueOpportunity,
        existingPartners,
        currentReferralVolume,
        partnershipGap: estimatedPartnerCount - existingPartners,
        untappedReferrals,
        strategicValue,
        effortRequired: partner.effortLevel,
        opportunityScore,
        recommendedApproach: this.getPartnershipApproach(partner.type, existingPartners),
      });
    }

    return [...opportunities].sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  /**
   * Get partnership approach recommendation
   */
  private getPartnershipApproach(
    partnerType: PartnershipOpportunity['partnerType'],
    existingPartners: number
  ): string {
    if (existingPartners === 0) {
      return `Develop pilot partnership with one ${partnerType.toLowerCase()} to establish track record`;
    }
    switch (partnerType) {
      case 'HOSPITAL':
        return 'Strengthen discharge planning relationships and post-acute care coordination';
      case 'PHYSICIAN_GROUP':
        return 'Implement physician referral program with outcome reporting';
      case 'SNF':
        return 'Create seamless transitions from skilled nursing to home care';
      case 'ACO':
        return 'Demonstrate value-based care capabilities and cost savings';
      case 'HEALTH_PLAN':
        return 'Pursue preferred provider status through quality metrics';
      case 'COMMUNITY_ORG':
        return 'Build community presence through outreach and education';
      default:
        return 'Expand partnership network through targeted outreach';
    }
  }

  /**
   * Calculate summary metrics
   */
  private calculateSummary(
    geographic: GeographicOpportunity[],
    serviceLine: ServiceLineOpportunity[],
    payer: PayerDiversificationOpportunity[],
    partnership: PartnershipOpportunity[]
  ): GrowthOpportunitySummary {
    const totalPotentialRevenue =
      geographic.reduce((sum, o) => sum + o.untappedRevenue, 0) +
      serviceLine.filter(o => !o.currentlyOffered).reduce((sum, o) => sum + o.expectedRevenue, 0) +
      payer.reduce((sum, o) => sum + o.potentialRevenue, 0) +
      partnership.reduce((sum, o) => sum + o.revenueOpportunity, 0);

    const totalInvestmentRequired =
      geographic.reduce((sum, o) => sum + o.investmentRequired, 0) +
      serviceLine.filter(o => !o.currentlyOffered).reduce((sum, o) => sum + o.totalInvestment, 0) +
      payer.reduce((sum, o) => sum + o.investmentRequired, 0);

    const averageROI = totalInvestmentRequired > 0
      ? (totalPotentialRevenue * 0.15 - totalInvestmentRequired) / totalInvestmentRequired
      : 0;

    // Determine top opportunity type
    const typeScores: Record<GrowthOpportunityType, number> = {
      GEOGRAPHIC_EXPANSION: geographic.reduce((sum, o) => sum + o.opportunityScore, 0),
      SERVICE_LINE_EXPANSION: serviceLine.reduce((sum, o) => sum + o.opportunityScore, 0),
      PAYER_DIVERSIFICATION: payer.reduce((sum, o) => sum + o.opportunityScore, 0),
      PARTNERSHIP_OPPORTUNITY: partnership.reduce((sum, o) => sum + o.opportunityScore, 0),
      CLIENT_SEGMENT_GROWTH: 0,
      MARKET_PENETRATION: 0,
    };
    const topOpportunityType = (Object.entries(typeScores)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'GEOGRAPHIC_EXPANSION') as GrowthOpportunityType;

    // Count by priority
    const allOpportunities = [
      ...geographic.map(o => ({ score: o.opportunityScore })),
      ...serviceLine.map(o => ({ score: o.opportunityScore })),
      ...payer.map(o => ({ score: o.opportunityScore })),
      ...partnership.map(o => ({ score: o.opportunityScore })),
    ];

    return {
      totalPotentialRevenue,
      totalInvestmentRequired,
      averageROI,
      topOpportunityType,
      opportunityCount: allOpportunities.length,
      highPriorityCount: allOpportunities.filter(o => o.score >= 70).length,
      mediumPriorityCount: allOpportunities.filter(o => o.score >= 50 && o.score < 70).length,
      lowPriorityCount: allOpportunities.filter(o => o.score < 50).length,
    };
  }

  /**
   * Generate prioritized recommendations
   */
  private generateRecommendations(
    geographic: GeographicOpportunity[],
    serviceLine: ServiceLineOpportunity[],
    payer: PayerDiversificationOpportunity[],
    partnership: PartnershipOpportunity[]
  ): GrowthOpportunityAnalysis['recommendations'] {
    const recommendations: GrowthOpportunityAnalysis['recommendations'] = [];
    let priority = 1;

    // Add top geographic opportunities
    for (const geo of geographic.slice(0, 2)) {
      recommendations.push({
        priority: priority++,
        type: 'GEOGRAPHIC_EXPANSION',
        title: `Expand to ${geo.areaName}`,
        description: `${geo.areaType} with ${geo.elderlyPopulation.toLocaleString()} elderly residents and ${geo.competitorCount} competitors`,
        potentialRevenue: geo.untappedRevenue,
        investmentRequired: geo.investmentRequired,
        timeframe: `${geo.timeToBreakeven} months to breakeven`,
        nextSteps: [
          'Conduct detailed market analysis',
          'Identify local caregiver recruitment sources',
          'Develop marketing launch plan',
          'Establish referral partnerships',
        ],
      });
    }

    // Add top service line opportunities
    for (const service of serviceLine.filter(s => !s.currentlyOffered).slice(0, 2)) {
      recommendations.push({
        priority: priority++,
        type: 'SERVICE_LINE_EXPANSION',
        title: `Launch ${service.serviceName}`,
        description: `${service.demandTrend.toLowerCase()} demand with ${service.expectedMargin.toLocaleString()} annual margin potential`,
        potentialRevenue: service.expectedRevenue,
        investmentRequired: service.totalInvestment,
        timeframe: `${service.timeToLaunch} months to launch, ${service.paybackPeriod} months payback`,
        nextSteps: [
          'Assess staffing requirements',
          'Identify training and certification needs',
          'Develop service protocols',
          'Create marketing materials',
        ],
      });
    }

    // Add top payer diversification opportunity
    const topPayer = payer[0];
    if (topPayer) {
      recommendations.push({
        priority: priority++,
        type: 'PAYER_DIVERSIFICATION',
        title: `Increase ${topPayer.payerTypeName} Volume`,
        description: `Currently ${(topPayer.revenuePercentage * 100).toFixed(1)}% of revenue, target is higher`,
        potentialRevenue: topPayer.potentialRevenue,
        investmentRequired: topPayer.investmentRequired,
        timeframe: `${topPayer.credentialingTime} months credentialing`,
        nextSteps: topPayer.complianceRequirements,
      });
    }

    // Add top partnership opportunity
    const topPartner = partnership[0];
    if (topPartner) {
      recommendations.push({
        priority: priority++,
        type: 'PARTNERSHIP_OPPORTUNITY',
        title: `Expand ${topPartner.partnerTypeName} Partnerships`,
        description: `${topPartner.partnershipGap} potential new partners with ${topPartner.untappedReferrals} untapped referrals`,
        potentialRevenue: topPartner.revenueOpportunity,
        investmentRequired: 25000,
        timeframe: '3-6 months to establish',
        nextSteps: [
          'Identify target partners',
          'Develop partnership value proposition',
          'Create outcome reporting capabilities',
          'Schedule introduction meetings',
        ],
      });
    }

    return recommendations.slice(0, 6);
  }

  /**
   * Generate SWOT analysis
   */
  private generateSwotAnalysis(
    metrics: { currentRevenue: number; clientCount: number; servicesOffered: ServiceType[] },
    _geographic: GeographicOpportunity[],
    serviceLine: ServiceLineOpportunity[],
    payer: PayerDiversificationOpportunity[],
    partnership: PartnershipOpportunity[]
  ): GrowthOpportunityAnalysis['swotAnalysis'] {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const threats: string[] = [];

    // Strengths
    if (metrics.clientCount > 100) strengths.push('Established client base');
    if (metrics.servicesOffered.length >= 3) strengths.push('Diverse service offerings');
    if (metrics.currentRevenue > 1000000) strengths.push('Strong revenue foundation');
    strengths.push('Existing operational infrastructure');

    // Weaknesses
    const lowPayerDiversity = payer.filter(p => p.potentialRevenue > 100000).length > 3;
    if (lowPayerDiversity) weaknesses.push('Limited payer diversification');
    if (metrics.servicesOffered.length < 5) weaknesses.push('Narrow service portfolio');
    if (partnership.filter(p => p.existingPartners === 0).length > 2) {
      weaknesses.push('Underdeveloped referral partnerships');
    }

    // Opportunities
    const growingServices = serviceLine.filter(s => s.demandTrend === 'GROWING' && !s.currentlyOffered);
    if (growingServices.length > 0) {
      opportunities.push(`Expansion into ${growingServices[0]?.serviceName || 'growing services'}`);
    }
    opportunities.push('Aging population driving market growth');
    opportunities.push('Value-based care partnerships with health systems');

    // Threats
    threats.push('Competitive pressure from larger agencies');
    threats.push('Caregiver recruitment and retention challenges');
    threats.push('Reimbursement rate pressures');
    if (payer.some(p => p.revenuePercentage > 0.5)) {
      threats.push('Revenue concentration risk');
    }

    return { strengths, weaknesses, opportunities, threats };
  }

  /**
   * Calculate growth targets
   */
  private calculateGrowthTargets(
    metrics: { currentRevenue: number; clientCount: number },
    summary: GrowthOpportunitySummary
  ): GrowthOpportunityAnalysis['growthTargets'] {
    const realisticCapture = Math.min(summary.totalPotentialRevenue * 0.25, metrics.currentRevenue * 0.3);
    const projectedRevenue = metrics.currentRevenue + realisticCapture;

    return {
      currentAnnualRevenue: metrics.currentRevenue,
      projectedRevenue,
      revenueGrowthTarget: realisticCapture / metrics.currentRevenue,
      clientGrowthTarget: 0.15, // 15% client growth target
      marketShareTarget: 0.12, // 12% market share target
    };
  }

  /**
   * Match payer name to payer type using name patterns
   */
  private matchesPayerType(payerName: string, payerType: PayerType): boolean {
    const lowerName = payerName.toLowerCase();
    switch (payerType) {
      case 'MEDICARE':
        return lowerName.includes('medicare');
      case 'MEDICAID':
        return lowerName.includes('medicaid') || lowerName.includes('medi-cal');
      case 'PRIVATE_INSURANCE':
        return lowerName.includes('aetna') || lowerName.includes('cigna') ||
               lowerName.includes('united') || lowerName.includes('blue cross') ||
               lowerName.includes('anthem') || lowerName.includes('humana');
      case 'PRIVATE_PAY':
        return lowerName.includes('private') || lowerName.includes('self-pay');
      case 'VA':
        return lowerName.includes('veteran') || lowerName.includes(' va ') || lowerName === 'va';
      case 'WORKERS_COMP':
        return lowerName.includes('worker') || lowerName.includes('comp');
      case 'MANAGED_CARE':
        return lowerName.includes('managed') || lowerName.includes('hmo') || lowerName.includes('aco');
      default:
        return false;
    }
  }

  /**
   * Get date range for last year
   */
  private getLastYearDateRange(): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    return { startDate, endDate };
  }

  /**
   * Validate user has access to organization data
   */
  private validateAccess(
    context: UserContext,
    organizationId: string,
    _branchId?: string
  ): void {
    if (!context.organizationId) {
      throw new Error('Organization context required');
    }
    if (context.organizationId !== organizationId) {
      throw new Error('Access denied to organization data');
    }
  }
}
