/**
 * Competitor Analysis Service
 *
 * Provides comprehensive competitive intelligence including:
 * - Competitor profiling and tracking
 * - Market share analysis
 * - Competitive positioning maps
 * - Service offering comparisons
 * - Pricing intelligence
 * - SWOT analysis
 */

import type { Knex } from 'knex';
import type { UserContext } from '@folkcare/core';
import type {
  CompetitorType,
  CompetitorSize,
  ThreatLevel,
  MarketPosition,
  CompetitorProfile,
  MarketShareData,
  MarketShareAnalysis,
  CompetitivePositioning,
  ServiceComparison,
  PricingIntelligence,
  SWOTAnalysis,
  CompetitiveIntelligenceSummary,
  CompetitorAnalysis,
  CompetitorAnalysisQueryOptions,
} from '../types/analytics.js';

// Sample competitor data for home care market
const SAMPLE_COMPETITORS: Array<{
  name: string;
  type: CompetitorType;
  size: CompetitorSize;
  marketPosition: MarketPosition;
  ownershipType: 'PRIVATE' | 'PUBLIC' | 'NON_PROFIT' | 'FRANCHISE' | 'UNKNOWN';
  services: string[];
  strengths: string[];
  weaknesses: string[];
  marketShare: number;
}> = [
  {
    name: 'HomeFirst Care Services',
    type: 'DIRECT',
    size: 'REGIONAL',
    marketPosition: 'LEADER',
    ownershipType: 'PRIVATE',
    services: ['Personal Care', 'Skilled Nursing', 'Companionship', 'Respite Care'],
    strengths: ['Strong brand recognition', 'Extensive caregiver network', 'Technology platform'],
    weaknesses: ['Higher pricing', 'Limited rural coverage'],
    marketShare: 22,
  },
  {
    name: 'Comfort Keepers',
    type: 'DIRECT',
    size: 'ENTERPRISE',
    marketPosition: 'CHALLENGER',
    ownershipType: 'FRANCHISE',
    services: ['Personal Care', 'Companionship', 'Transportation', 'Meal Preparation'],
    strengths: ['National presence', 'Franchise model scalability', 'Brand awareness'],
    weaknesses: ['Inconsistent quality across franchises', 'Less specialized care'],
    marketShare: 18,
  },
  {
    name: 'Visiting Angels',
    type: 'DIRECT',
    size: 'ENTERPRISE',
    marketPosition: 'CHALLENGER',
    ownershipType: 'FRANCHISE',
    services: ['Personal Care', 'Companionship', 'Alzheimer Care', 'Respite Care'],
    strengths: ['Large network', 'Dementia care specialty', 'Marketing presence'],
    weaknesses: ['Variable service quality', 'Staff turnover'],
    marketShare: 15,
  },
  {
    name: 'BrightStar Care',
    type: 'DIRECT',
    size: 'ENTERPRISE',
    marketPosition: 'CHALLENGER',
    ownershipType: 'FRANCHISE',
    services: ['Skilled Nursing', 'Personal Care', 'Medical Staffing', 'Companionship'],
    strengths: ['Medical care expertise', 'Joint Commission accreditation', 'Diverse services'],
    weaknesses: ['Higher cost structure', 'Complex service model'],
    marketShare: 12,
  },
  {
    name: 'Local Senior Services',
    type: 'DIRECT',
    size: 'LOCAL',
    marketPosition: 'NICHE',
    ownershipType: 'NON_PROFIT',
    services: ['Personal Care', 'Companionship', 'Transportation'],
    strengths: ['Community relationships', 'Non-profit pricing', 'Local trust'],
    weaknesses: ['Limited capacity', 'Funding constraints', 'Technology gaps'],
    marketShare: 5,
  },
  {
    name: 'Regional Medical Center Home Health',
    type: 'INDIRECT',
    size: 'REGIONAL',
    marketPosition: 'FOLLOWER',
    ownershipType: 'NON_PROFIT',
    services: ['Skilled Nursing', 'Physical Therapy', 'Occupational Therapy'],
    strengths: ['Hospital referral network', 'Medical expertise', 'Insurance relationships'],
    weaknesses: ['Limited personal care', 'Medical focus only'],
    marketShare: 8,
  },
  {
    name: 'TechCare Home Services',
    type: 'EMERGING',
    size: 'STARTUP',
    marketPosition: 'NICHE',
    ownershipType: 'PRIVATE',
    services: ['Personal Care', 'Remote Monitoring', 'Telehealth Support'],
    strengths: ['Technology innovation', 'Younger workforce', 'Data-driven approach'],
    weaknesses: ['Limited market presence', 'Unproven at scale', 'Cash burn'],
    marketShare: 2,
  },
];

// Service types in home care
const SERVICE_TYPES = [
  'Personal Care',
  'Skilled Nursing',
  'Companionship',
  'Respite Care',
  'Alzheimer/Dementia Care',
  'Transportation',
  'Meal Preparation',
  'Light Housekeeping',
  'Medication Management',
  'Physical Therapy',
  'Occupational Therapy',
  'Speech Therapy',
  'Remote Monitoring',
  'Telehealth Support',
];

export class CompetitorAnalysisService {
  constructor(private db: Knex) {}

  /**
   * Generate comprehensive competitor analysis
   */
  async getCompetitorAnalysis(
    options: CompetitorAnalysisQueryOptions,
    _context: UserContext
  ): Promise<CompetitorAnalysis> {
    const { organizationId } = options;
    const includeIndirect = options.includeIndirectCompetitors ?? true;
    const includeEmerging = options.includeEmergingCompetitors ?? true;

    // Get organization info
    const org = await this.db('organizations')
      .where({ id: organizationId })
      .select('name')
      .first();
    const orgName = org?.name ?? 'Our Organization';

    // Filter competitors
    let competitors = SAMPLE_COMPETITORS;
    if (!includeIndirect) {
      competitors = competitors.filter((c) => c.type !== 'INDIRECT');
    }
    if (!includeEmerging) {
      competitors = competitors.filter((c) => c.type !== 'EMERGING');
    }
    if (options.maxCompetitors) {
      competitors = competitors.slice(0, options.maxCompetitors);
    }

    // Generate competitor profiles
    const competitorProfiles = this.generateCompetitorProfiles(competitors);

    // Generate market share analysis
    const marketShare = this.generateMarketShareAnalysis(organizationId, orgName, competitors);

    // Generate competitive positioning
    const positioning = this.generateCompetitivePositioning(organizationId, orgName, competitors);

    // Generate service comparisons
    const serviceComparisons = this.generateServiceComparisons(competitors);

    // Generate pricing intelligence
    const pricingIntelligence = options.includePricing !== false
      ? this.generatePricingIntelligence(competitors)
      : [];

    // Generate SWOT analysis
    const swotAnalysis = options.includeSWOT !== false
      ? this.generateSWOTAnalysis(competitors)
      : this.getEmptySWOT();

    // Generate summary
    const summary = this.generateSummary(
      organizationId,
      marketShare,
      competitorProfiles
    );

    // Generate competitive trends
    const trends = this.generateCompetitiveTrends(competitors);

    // Generate strategic recommendations
    const strategicRecommendations = this.generateStrategicRecommendations(
      competitors,
      marketShare,
      serviceComparisons
    );

    return {
      generatedAt: new Date().toISOString(),
      organizationId,
      summary,
      competitors: competitorProfiles,
      marketShare,
      positioning,
      serviceComparisons,
      pricingIntelligence,
      swotAnalysis,
      trends,
      strategicRecommendations,
    };
  }

  /**
   * Generate competitor profiles
   */
  private generateCompetitorProfiles(
    competitors: typeof SAMPLE_COMPETITORS
  ): CompetitorProfile[] {
    return competitors.map((c, index) => ({
      id: `competitor-${index + 1}`,
      name: c.name,
      type: c.type,
      size: c.size,
      marketPosition: c.marketPosition,
      threatLevel: this.calculateThreatLevel(c),
      ownershipType: c.ownershipType,
      serviceAreas: this.generateServiceAreas(c.size),
      marketOverlap: this.calculateMarketOverlap(c.size),
      serviceOfferings: c.services.map((s) => ({
        service: s,
        available: true,
        specialty: c.strengths.some((str) => str.toLowerCase().includes(s.toLowerCase())),
      })),
      estimatedRevenue: this.estimateRevenue(c.marketShare),
      estimatedMarketShare: c.marketShare,
      employeeCount: this.estimateEmployeeCount(c.size),
      clientCount: this.estimateClientCount(c.marketShare),
      strengths: c.strengths,
      weaknesses: c.weaknesses,
      differentiators: this.extractDifferentiators(c),
      recentNews: this.generateRecentNews(c.name),
      reputation: this.generateReputation(),
      lastUpdated: new Date().toISOString(),
      dataConfidence: this.getDataConfidence(c.size),
    }));
  }

  /**
   * Calculate threat level for competitor
   */
  private calculateThreatLevel(
    competitor: typeof SAMPLE_COMPETITORS[0]
  ): ThreatLevel {
    // High threat: direct competitors with significant market share
    if (competitor.type === 'DIRECT' && competitor.marketShare >= 15) {
      return 'HIGH';
    }
    // Medium threat: direct competitors or large indirect
    if (competitor.type === 'DIRECT' || competitor.marketShare >= 10) {
      return 'MEDIUM';
    }
    // Low threat: emerging or small
    if (competitor.type === 'EMERGING' || competitor.marketShare >= 5) {
      return 'LOW';
    }
    return 'MINIMAL';
  }

  /**
   * Generate service areas based on size
   */
  private generateServiceAreas(size: CompetitorSize): string[] {
    switch (size) {
      case 'ENTERPRISE':
        return ['National', 'Multi-State'];
      case 'REGIONAL':
        return ['State-wide', 'Multi-County'];
      case 'LOCAL':
        return ['County', 'City'];
      case 'STARTUP':
        return ['City', 'Neighborhood'];
    }
  }

  /**
   * Calculate market overlap
   */
  private calculateMarketOverlap(size: CompetitorSize): number {
    switch (size) {
      case 'ENTERPRISE':
        return 85 + Math.random() * 15;
      case 'REGIONAL':
        return 60 + Math.random() * 30;
      case 'LOCAL':
        return 40 + Math.random() * 40;
      case 'STARTUP':
        return 20 + Math.random() * 30;
    }
  }

  /**
   * Estimate revenue from market share
   */
  private estimateRevenue(marketShare: number): number {
    // Assume total market is $50M
    const totalMarket = 50000000;
    return totalMarket * (marketShare / 100);
  }

  /**
   * Estimate employee count
   */
  private estimateEmployeeCount(size: CompetitorSize): number {
    switch (size) {
      case 'ENTERPRISE':
        return 500 + Math.floor(Math.random() * 1000);
      case 'REGIONAL':
        return 100 + Math.floor(Math.random() * 200);
      case 'LOCAL':
        return 20 + Math.floor(Math.random() * 50);
      case 'STARTUP':
        return 5 + Math.floor(Math.random() * 20);
    }
  }

  /**
   * Estimate client count
   */
  private estimateClientCount(marketShare: number): number {
    // Assume total market has 5000 clients
    const totalClients = 5000;
    return Math.floor(totalClients * (marketShare / 100));
  }

  /**
   * Extract differentiators
   */
  private extractDifferentiators(competitor: typeof SAMPLE_COMPETITORS[0]): string[] {
    const differentiators: string[] = [];
    if (competitor.size === 'ENTERPRISE') {
      differentiators.push('National scale and reach');
    }
    if (competitor.ownershipType === 'NON_PROFIT') {
      differentiators.push('Non-profit mission-driven care');
    }
    if (competitor.type === 'EMERGING') {
      differentiators.push('Technology-forward approach');
    }
    if (competitor.services.includes('Skilled Nursing')) {
      differentiators.push('Medical care capabilities');
    }
    if (competitor.strengths.some((s) => s.toLowerCase().includes('dementia'))) {
      differentiators.push('Dementia care specialization');
    }
    return differentiators;
  }

  /**
   * Generate recent news items
   */
  private generateRecentNews(
    name: string
  ): CompetitorProfile['recentNews'] {
    const now = new Date();
    return [
      {
        date: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString().slice(0, 10),
        headline: `${name} announces service expansion`,
        sentiment: 'POSITIVE' as const,
      },
      {
        date: new Date(now.getFullYear(), now.getMonth() - 2, 8).toISOString().slice(0, 10),
        headline: `${name} recognized for quality care`,
        sentiment: 'POSITIVE' as const,
      },
    ];
  }

  /**
   * Generate reputation data
   */
  private generateReputation(): CompetitorProfile['reputation'] {
    return {
      overallRating: 3.5 + Math.random() * 1.5,
      reviewCount: 50 + Math.floor(Math.random() * 200),
      sources: [
        {
          source: 'Google',
          rating: 3.5 + Math.random() * 1.5,
          reviewCount: 30 + Math.floor(Math.random() * 100),
        },
        {
          source: 'Caring.com',
          rating: 3.5 + Math.random() * 1.5,
          reviewCount: 10 + Math.floor(Math.random() * 50),
        },
      ],
    };
  }

  /**
   * Get data confidence level
   */
  private getDataConfidence(size: CompetitorSize): 'HIGH' | 'MEDIUM' | 'LOW' {
    switch (size) {
      case 'ENTERPRISE':
        return 'HIGH';
      case 'REGIONAL':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  /**
   * Generate market share analysis
   */
  private generateMarketShareAnalysis(
    organizationId: string,
    orgName: string,
    competitors: typeof SAMPLE_COMPETITORS
  ): MarketShareAnalysis {
    // Our estimated market share
    const ourShare = 12;

    // Build share data
    const shares: MarketShareData[] = [
      {
        organizationId,
        organizationName: orgName,
        isOwnOrganization: true,
        marketShare: ourShare,
        shareChange: 1.5,
        clientCount: 600,
        revenueEstimate: 6000000,
        growthRate: 12,
      },
      ...competitors.map((c, i) => ({
        organizationId: `competitor-${i + 1}`,
        organizationName: c.name,
        isOwnOrganization: false,
        marketShare: c.marketShare,
        shareChange: -2 + Math.random() * 4,
        clientCount: this.estimateClientCount(c.marketShare),
        revenueEstimate: this.estimateRevenue(c.marketShare),
        growthRate: Math.random() * 20 - 5,
      })),
    ];

    // Sort by market share
    shares.sort((a, b) => b.marketShare - a.marketShare);

    // Calculate our rank
    const ourRank = shares.findIndex((s) => s.isOwnOrganization) + 1;

    // Calculate concentration (HHI)
    const hhi = shares.reduce((sum, s) => sum + Math.pow(s.marketShare, 2), 0);

    // Generate trends
    const trends = this.generateMarketShareTrends(ourShare);

    return {
      market: 'Local Home Care Market',
      totalMarketSize: 50000000,
      marketGrowthRate: 8,
      ourShare,
      ourRank,
      totalCompetitors: competitors.length,
      concentration: hhi,
      shares,
      trends,
    };
  }

  /**
   * Generate market share trends
   */
  private generateMarketShareTrends(
    currentShare: number
  ): MarketShareAnalysis['trends'] {
    const trends: MarketShareAnalysis['trends'] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const variation = 0.9 + Math.random() * 0.2;
      trends.push({
        period: date.toISOString().slice(0, 7),
        ourShare: currentShare * variation,
        topCompetitorShare: 22 * variation,
        marketSize: 50000000 * (1 + (5 - i) * 0.01),
      });
    }

    return trends;
  }

  /**
   * Generate competitive positioning map
   */
  private generateCompetitivePositioning(
    organizationId: string,
    orgName: string,
    competitors: typeof SAMPLE_COMPETITORS
  ): CompetitivePositioning {
    const positions: CompetitivePositioning['positions'] = [
      {
        organizationId,
        organizationName: orgName,
        isOwnOrganization: true,
        xValue: 65, // Service breadth
        yValue: 70, // Price/quality
        bubbleSize: 12,
      },
      ...competitors.map((c, i) => ({
        organizationId: `competitor-${i + 1}`,
        organizationName: c.name,
        isOwnOrganization: false,
        xValue: this.calculateServiceBreadth(c.services.length),
        yValue: this.calculatePriceQuality(c),
        bubbleSize: c.marketShare,
      })),
    ];

    return {
      xAxis: {
        label: 'Service Breadth',
        description: 'Range and diversity of services offered',
      },
      yAxis: {
        label: 'Price/Quality Position',
        description: 'Premium (high) vs. value (low) positioning',
      },
      positions,
      quadrants: {
        topRight: 'Premium Full-Service',
        topLeft: 'Specialty Premium',
        bottomRight: 'Value Full-Service',
        bottomLeft: 'Budget Focused',
      },
    };
  }

  /**
   * Calculate service breadth score
   */
  private calculateServiceBreadth(serviceCount: number): number {
    // Normalize to 0-100 scale
    return Math.min(100, (serviceCount / SERVICE_TYPES.length) * 100 + Math.random() * 20);
  }

  /**
   * Calculate price/quality position
   */
  private calculatePriceQuality(competitor: typeof SAMPLE_COMPETITORS[0]): number {
    let score = 50;
    if (competitor.size === 'ENTERPRISE') score += 15;
    if (competitor.ownershipType === 'NON_PROFIT') score -= 10;
    if (competitor.marketPosition === 'LEADER') score += 10;
    if (competitor.strengths.some((s) => s.toLowerCase().includes('technology'))) score += 10;
    return Math.min(100, Math.max(0, score + Math.random() * 20 - 10));
  }

  /**
   * Generate service comparisons
   */
  private generateServiceComparisons(
    competitors: typeof SAMPLE_COMPETITORS
  ): ServiceComparison[] {
    // Our services
    const ourServices = new Set([
      'Personal Care',
      'Companionship',
      'Respite Care',
      'Light Housekeeping',
      'Meal Preparation',
      'Transportation',
    ]);

    return SERVICE_TYPES.map((service) => {
      const competitorsOffering = competitors.filter((c) =>
        c.services.includes(service)
      );

      const coverage = (competitorsOffering.length / competitors.length) * 100;
      const offered = ourServices.has(service);

      let opportunity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (!offered && coverage > 50) opportunity = 'HIGH';
      else if (!offered && coverage > 25) opportunity = 'MEDIUM';

      return {
        serviceName: service,
        category: this.getServiceCategory(service),
        ourStatus: offered ? 'OFFERED' : 'NOT_OFFERED',
        competitorCoverage: coverage,
        competitors: competitors.map((c, i) => ({
          competitorId: `competitor-${i + 1}`,
          competitorName: c.name,
          offered: c.services.includes(service),
          specialization: c.strengths.some((s) =>
            s.toLowerCase().includes(service.toLowerCase())
          ),
        })),
        marketOpportunity: opportunity,
        recommendation:
          opportunity === 'HIGH'
            ? `Consider adding ${service} - high competitor coverage indicates demand`
            : undefined,
      };
    });
  }

  /**
   * Get service category
   */
  private getServiceCategory(service: string): string {
    const categories: Record<string, string[]> = {
      'Personal Care': ['Personal Care', 'Light Housekeeping', 'Meal Preparation'],
      'Medical Care': ['Skilled Nursing', 'Physical Therapy', 'Occupational Therapy', 'Speech Therapy', 'Medication Management'],
      'Companionship': ['Companionship', 'Transportation'],
      'Specialty Care': ['Alzheimer/Dementia Care', 'Respite Care'],
      'Technology': ['Remote Monitoring', 'Telehealth Support'],
    };

    for (const [category, services] of Object.entries(categories)) {
      if (services.includes(service)) return category;
    }
    return 'Other';
  }

  /**
   * Generate pricing intelligence
   */
  private generatePricingIntelligence(
    competitors: typeof SAMPLE_COMPETITORS
  ): PricingIntelligence[] {
    const services = ['Personal Care', 'Companionship', 'Skilled Nursing', 'Respite Care'];

    return services.map((service) => {
      const baseRate = service === 'Skilled Nursing' ? 75 : service === 'Respite Care' ? 35 : 28;
      const ourRate = baseRate + Math.random() * 5;
      const marketAvg = baseRate + Math.random() * 3;

      const competitorRates = competitors
        .filter((c) => c.services.includes(service))
        .map((c, i) => ({
          competitorId: `competitor-${i + 1}`,
          competitorName: c.name,
          rate: baseRate + (c.marketPosition === 'LEADER' ? 5 : 0) + Math.random() * 8 - 4,
        }));

      const rates = competitorRates.map((r) => r.rate);
      const marketLow = Math.min(...rates, ourRate);
      const marketHigh = Math.max(...rates, ourRate);

      const percentile = ((ourRate - marketLow) / (marketHigh - marketLow)) * 100;

      let recommendation: 'INCREASE' | 'MAINTAIN' | 'DECREASE' | 'EVALUATE';
      let rationale: string;

      if (percentile < 30) {
        recommendation = 'EVALUATE';
        rationale = 'Pricing below market - evaluate if this is intentional positioning';
      } else if (percentile > 80) {
        recommendation = 'EVALUATE';
        rationale = 'Pricing above market - ensure value proposition supports premium';
      } else {
        recommendation = 'MAINTAIN';
        rationale = 'Pricing competitive with market average';
      }

      return {
        serviceType: service,
        ourRate,
        marketAverage: marketAvg,
        marketLow,
        marketHigh,
        percentile,
        competitorRates,
        recommendation,
        rationale,
      };
    });
  }

  /**
   * Generate SWOT analysis
   */
  private generateSWOTAnalysis(
    competitors: typeof SAMPLE_COMPETITORS
  ): SWOTAnalysis {
    const highThreatCompetitors = competitors.filter(
      (c) => c.type === 'DIRECT' && c.marketShare >= 15
    );

    return {
      strengths: [
        {
          factor: 'Technology Platform',
          description: 'Modern EVV and scheduling system improves efficiency',
          competitiveAdvantage: 'HIGH',
        },
        {
          factor: 'Local Market Knowledge',
          description: 'Deep understanding of local demographics and needs',
          competitiveAdvantage: 'MEDIUM',
        },
        {
          factor: 'Quality Focus',
          description: 'Consistent high-quality care delivery',
          competitiveAdvantage: 'HIGH',
        },
        {
          factor: 'Caregiver Retention',
          description: 'Lower turnover than industry average',
          competitiveAdvantage: 'MEDIUM',
        },
      ],
      weaknesses: [
        {
          factor: 'Brand Awareness',
          description: 'Limited brand recognition compared to national franchises',
          riskLevel: 'MEDIUM',
          mitigation: 'Increase local marketing and community engagement',
        },
        {
          factor: 'Service Range',
          description: 'Fewer medical services than some competitors',
          riskLevel: 'LOW',
          mitigation: 'Consider partnerships with medical providers',
        },
        {
          factor: 'Geographic Coverage',
          description: 'Limited to primary service area',
          riskLevel: 'LOW',
          mitigation: 'Evaluate expansion opportunities strategically',
        },
      ],
      opportunities: [
        {
          factor: 'Aging Population',
          description: 'Growing demand for home care services',
          potential: 'HIGH',
          timeframe: 'LONG',
          actionRequired: 'Scale operations to meet increasing demand',
        },
        {
          factor: 'Technology Differentiation',
          description: 'Leverage technology for competitive advantage',
          potential: 'HIGH',
          timeframe: 'SHORT',
          actionRequired: 'Continue investment in digital capabilities',
        },
        {
          factor: 'Unserved Markets',
          description: 'Rural areas with limited competition',
          potential: 'MEDIUM',
          timeframe: 'MEDIUM',
          actionRequired: 'Evaluate expansion into underserved areas',
        },
        {
          factor: 'Specialty Services',
          description: 'Growing demand for dementia and chronic care',
          potential: 'HIGH',
          timeframe: 'MEDIUM',
          actionRequired: 'Develop specialty care programs',
        },
      ],
      threats: [
        {
          factor: 'Large Competitors',
          description: `${highThreatCompetitors.length} major competitors with significant market share`,
          severity: 'HIGH',
          likelihood: 'HIGH',
          response: 'Differentiate on quality and technology',
        },
        {
          factor: 'Caregiver Shortage',
          description: 'Industry-wide workforce challenges',
          severity: 'HIGH',
          likelihood: 'HIGH',
          response: 'Invest in recruitment and retention programs',
        },
        {
          factor: 'Regulatory Changes',
          description: 'Evolving compliance requirements increase costs',
          severity: 'MEDIUM',
          likelihood: 'MEDIUM',
          response: 'Maintain strong compliance infrastructure',
        },
        {
          factor: 'Reimbursement Pressure',
          description: 'Payer rate negotiations challenging margins',
          severity: 'MEDIUM',
          likelihood: 'HIGH',
          response: 'Diversify payer mix and improve efficiency',
        },
      ],
    };
  }

  /**
   * Get empty SWOT structure
   */
  private getEmptySWOT(): SWOTAnalysis {
    return {
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
    };
  }

  /**
   * Generate summary
   */
  private generateSummary(
    organizationId: string,
    marketShare: MarketShareAnalysis,
    competitors: CompetitorProfile[]
  ): CompetitiveIntelligenceSummary {
    const directCompetitors = competitors.filter((c) => c.type === 'DIRECT');
    const indirectCompetitors = competitors.filter((c) => c.type === 'INDIRECT');
    const emergingCompetitors = competitors.filter((c) => c.type === 'EMERGING');
    const highThreat = competitors.filter((c) => c.threatLevel === 'HIGH');

    const overallThreatLevel: ThreatLevel =
      highThreat.length >= 3 ? 'HIGH' :
      highThreat.length >= 1 ? 'MEDIUM' : 'LOW';

    return {
      organizationId,
      analysisDate: new Date().toISOString(),
      marketOverview: {
        marketName: marketShare.market,
        totalMarketSize: marketShare.totalMarketSize,
        growthRate: marketShare.marketGrowthRate,
        competitorCount: competitors.length,
        ourMarketShare: marketShare.ourShare,
        ourRank: marketShare.ourRank,
      },
      competitorCount: {
        direct: directCompetitors.length,
        indirect: indirectCompetitors.length,
        emerging: emergingCompetitors.length,
        total: competitors.length,
      },
      threatAssessment: {
        overallThreatLevel,
        highThreatCompetitors: highThreat.length,
        keyThreats: highThreat.map((c) => `${c.name} (${c.marketPosition})`),
      },
      keyFindings: [
        `Market leader ${competitors[0]?.name ?? 'N/A'} holds ${competitors[0]?.estimatedMarketShare ?? 0}% market share`,
        `${emergingCompetitors.length} emerging competitors entering the market`,
        `Technology adoption becoming key differentiator`,
        `Growing demand for specialty care services`,
      ],
      recommendations: [
        'Focus on technology differentiation',
        'Develop specialty care programs',
        'Strengthen referral partnerships',
        'Monitor emerging competitor growth',
      ],
    };
  }

  /**
   * Generate competitive trends
   */
  private generateCompetitiveTrends(
    competitors: typeof SAMPLE_COMPETITORS
  ): CompetitorAnalysis['trends'] {
    return [
      {
        trend: 'Technology Adoption',
        description: 'Competitors investing in mobile apps and remote monitoring',
        impact: 'HIGH',
        timeframe: '1-2 years',
        affectedCompetitors: competitors
          .filter((c) => c.size === 'ENTERPRISE')
          .map((c) => c.name),
        ourImplication: 'Must maintain technology leadership position',
      },
      {
        trend: 'Consolidation',
        description: 'Larger players acquiring smaller agencies',
        impact: 'MEDIUM',
        timeframe: '2-3 years',
        affectedCompetitors: competitors
          .filter((c) => c.size === 'LOCAL')
          .map((c) => c.name),
        ourImplication: 'Consider strategic partnerships or acquisition opportunities',
      },
      {
        trend: 'Specialty Services Growth',
        description: 'Increasing focus on dementia care and chronic conditions',
        impact: 'HIGH',
        timeframe: '1-3 years',
        affectedCompetitors: competitors.map((c) => c.name),
        ourImplication: 'Develop specialized care programs to remain competitive',
      },
      {
        trend: 'Value-Based Care',
        description: 'Shift toward outcomes-based reimbursement',
        impact: 'MEDIUM',
        timeframe: '2-4 years',
        affectedCompetitors: competitors
          .filter((c) => c.services.includes('Skilled Nursing'))
          .map((c) => c.name),
        ourImplication: 'Invest in quality measurement and reporting capabilities',
      },
    ];
  }

  /**
   * Generate strategic recommendations
   */
  private generateStrategicRecommendations(
    competitors: typeof SAMPLE_COMPETITORS,
    marketShare: MarketShareAnalysis,
    serviceComparisons: ServiceComparison[]
  ): CompetitorAnalysis['strategicRecommendations'] {
    const recommendations: CompetitorAnalysis['strategicRecommendations'] = [];
    let priority = 1;

    // Market share growth
    if (marketShare.ourRank > 3) {
      recommendations.push({
        priority: priority++,
        area: 'Market Share Growth',
        recommendation: 'Increase marketing investment and referral partnerships',
        rationale: `Currently ranked #${marketShare.ourRank} - opportunity to grow market share`,
        competitorsAddressed: competitors
          .filter((c) => c.marketShare > marketShare.ourShare)
          .map((c) => c.name),
        expectedOutcome: 'Increase market share by 2-3% annually',
        timeframe: '12-18 months',
      });
    }

    // Service expansion
    const highOpportunityServices = serviceComparisons.filter(
      (s) => s.marketOpportunity === 'HIGH'
    );
    if (highOpportunityServices.length > 0) {
      recommendations.push({
        priority: priority++,
        area: 'Service Expansion',
        recommendation: `Add ${highOpportunityServices[0]?.serviceName ?? 'new services'} to service portfolio`,
        rationale: 'High competitor coverage indicates market demand',
        competitorsAddressed: highOpportunityServices[0]?.competitors
          .filter((c) => c.offered)
          .map((c) => c.competitorName) ?? [],
        expectedOutcome: 'Capture additional market share in growing segment',
        timeframe: '6-12 months',
      });
    }

    // Technology differentiation
    recommendations.push({
      priority: priority++,
      area: 'Technology Leadership',
      recommendation: 'Continue investment in digital capabilities',
      rationale: 'Technology becoming key competitive differentiator',
      competitorsAddressed: competitors
        .filter((c) => !c.strengths.some((s) => s.toLowerCase().includes('technology')))
        .map((c) => c.name),
      expectedOutcome: 'Maintain competitive advantage and operational efficiency',
      timeframe: 'Ongoing',
    });

    // Competitive defense
    const directThreats = competitors.filter(
      (c) => c.type === 'DIRECT' && c.marketShare >= 15
    );
    if (directThreats.length > 0) {
      recommendations.push({
        priority: priority++,
        area: 'Competitive Defense',
        recommendation: 'Strengthen client retention and referral programs',
        rationale: `${directThreats.length} direct competitors with significant market presence`,
        competitorsAddressed: directThreats.map((c) => c.name),
        expectedOutcome: 'Protect existing client base and referral relationships',
        timeframe: 'Immediate and ongoing',
      });
    }

    return recommendations;
  }
}
