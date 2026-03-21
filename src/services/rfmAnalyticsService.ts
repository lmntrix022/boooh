/**
 * RFM Analytics Service
 *
 * Advanced analytics for RFM segmentation:
 * - Segment distribution with trends
 * - Segment migration tracking (who moved where)
 * - Cohort analysis
 * - Automatic alerts for critical changes
 * - CLV by segment
 *
 * Provides strategic visibility and proactive risk detection
 */

import { supabase } from '@/integrations/supabase/client';
import { RFMSegment } from './rfmSegmentationService';
import { ContactStats } from './crmService';

// Define RFM segments locally
const RFM_SEGMENTS: RFMSegment[] = [
  'champions',
  'loyal_customers',
  'potential_loyalists',
  'new_customers',
  'promising',
  'need_attention',
  'about_to_sleep',
  'at_risk',
  'cant_lose_them',
  'hibernating',
  'lost'
];

// Helper function stubs - these would need proper implementation
const getContactStats = async (_userId: string, _contactId: string): Promise<ContactStats | null> => null;

/**
 * Distribution of customers across RFM segments
 */
export interface RFMDistribution {
  segment: RFMSegment;
  count: number;
  percentage: number;
  totalRevenue: number;
  averageRevenue: number;
  averageCLV: number;
  trend: {
    lastMonth: number;
    change: number;              // +/- number of customers
    changePercent: number;        // +/- percentage
    direction: 'up' | 'down' | 'stable';
  };
}

/**
 * Segment migration (customer moving from one segment to another)
 */
export interface SegmentMigration {
  from: RFMSegment;
  to: RFMSegment;
  count: number;
  period: 'month' | 'quarter' | 'year';
  revenueImpact: number;          // Estimated revenue impact (FCFA)
  severity: 'positive' | 'neutral' | 'negative';
  examples: {                     // Sample contacts who migrated
    contactId: string;
    fullName: string;
    revenue: number;
  }[];
}

/**
 * Alert for significant segment changes
 */
export interface RFMAlert {
  type: 'warning' | 'critical' | 'info';
  severity: 'high' | 'medium' | 'low';
  message: string;
  segment: RFMSegment;
  count: number;
  revenueImpact?: number;
  actionRequired: string;
}

/**
 * Complete RFM dashboard data
 */
export interface RFMDashboardData {
  distribution: RFMDistribution[];
  migrations: SegmentMigration[];
  highlights: {
    totalCustomers: number;
    championsCount: number;
    championsPercent: number;
    atRiskCount: number;
    atRiskPercent: number;
    lostCount: number;
    totalRevenue: number;
    averageCLV: number;
    healthScore: number;          // 0-100 overall health
  };
  alerts: RFMAlert[];
  recommendations: {
    action: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    expectedImpact: number;       // In FCFA
    segment?: RFMSegment;
  }[];
}

/**
 * Get RFM segment distribution with trends
 */
export async function analyzeRFMDistribution(
  userId: string,
  compareWithLastMonth: boolean = true
): Promise<RFMDistribution[]> {
  // Get all contacts with stats
  const { data: contacts, error } = await supabase
    .from('scanned_contacts')
    .select('*')
    .eq('user_id', userId);

  if (error || !contacts) {
    throw new Error('Failed to fetch contacts');
  }

  // Calculate RFM for each contact
  const contactsWithRFM = await Promise.all(
    contacts.map(async (contact) => {
      const stats = await getContactStats(contact.id);
      const rfm = calculateRFMSegment(stats);
      return { contact, stats, rfm };
    })
  );

  const totalCustomers = contactsWithRFM.length;

  // Get last month's distribution if requested
  let lastMonthDistribution: Record<RFMSegment, number> = {} as any;
  if (compareWithLastMonth) {
    lastMonthDistribution = await getHistoricalDistribution(userId, 30);
  }

  // Build distribution for each segment
  const distribution: RFMDistribution[] = RFM_SEGMENTS.map((segment) => {
    const segmentContacts = contactsWithRFM.filter((c) => c.rfm === segment);
    const count = segmentContacts.length;
    const totalRevenue = segmentContacts.reduce((sum, c) => sum + c.stats.totalRevenue, 0);
    const avgRevenue = count > 0 ? totalRevenue / count : 0;

    // Estimate CLV (simple: current revenue × 2.5 for lifetime projection)
    const avgCLV = avgRevenue * 2.5;

    // Calculate trend
    const lastMonth = lastMonthDistribution[segment] || 0;
    const change = count - lastMonth;
    const changePercent = lastMonth > 0 ? (change / lastMonth) * 100 : 0;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 5) {
      direction = change > 0 ? 'up' : 'down';
    }

    return {
      segment,
      count,
      percentage: totalCustomers > 0 ? (count / totalCustomers) * 100 : 0,
      totalRevenue,
      averageRevenue: avgRevenue,
      averageCLV: avgCLV,
      trend: {
        lastMonth,
        change,
        changePercent,
        direction
      }
    };
  });

  // Sort by total revenue (descending)
  return distribution.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * Analyze segment migrations over a period
 */
export async function analyzeSegmentMigrations(
  userId: string,
  period: 'month' | 'quarter' | 'year' = 'month'
): Promise<SegmentMigration[]> {
  const daysAgo = period === 'month' ? 30 : period === 'quarter' ? 90 : 365;

  // Get RFM history for all contacts
  const { data: history, error } = await supabase
    .from('rfm_segment_history')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (error || !history) {
    return [];
  }

  // Group by contact to find migrations
  const contactMigrations: Map<string, { from: RFMSegment; to: RFMSegment; revenue: number; fullName: string }> = new Map();

  const contacts = Array.from(new Set(history.map(h => h.contact_id)));

  for (const contactId of contacts) {
    const contactHistory = history
      .filter(h => h.contact_id === contactId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (contactHistory.length >= 2) {
      const latest = contactHistory[0];
      const previous = contactHistory[1];

      if (latest.segment !== previous.segment) {
        // Get contact details
        const { data: contact } = await supabase
          .from('scanned_contacts')
          .select('full_name')
          .eq('id', contactId)
          .single();

        contactMigrations.set(contactId, {
          from: previous.segment as RFMSegment,
          to: latest.segment as RFMSegment,
          revenue: latest.total_revenue || 0,
          fullName: contact?.full_name || 'Unknown'
        });
      }
    }
  }

  // Aggregate migrations
  const migrationMap: Map<string, SegmentMigration> = new Map();

  contactMigrations.forEach((migration, contactId) => {
    const key = `${migration.from}->${migration.to}`;

    if (!migrationMap.has(key)) {
      migrationMap.set(key, {
        from: migration.from,
        to: migration.to,
        count: 0,
        period,
        revenueImpact: 0,
        severity: determineSeverity(migration.from, migration.to),
        examples: []
      });
    }

    const existing = migrationMap.get(key)!;
    existing.count++;
    existing.revenueImpact += estimateRevenueImpact(migration.from, migration.to, migration.revenue);

    // Add up to 3 examples
    if (existing.examples.length < 3) {
      existing.examples.push({
        contactId,
        fullName: migration.fullName,
        revenue: migration.revenue
      });
    }
  });

  return Array.from(migrationMap.values())
    .sort((a, b) => Math.abs(b.revenueImpact) - Math.abs(a.revenueImpact));
}

/**
 * Generate automatic alerts for critical changes
 */
export async function generateRFMAlerts(
  distribution: RFMDistribution[],
  migrations: SegmentMigration[]
): Promise<RFMAlert[]> {
  const alerts: RFMAlert[] = [];

  // Alert 1: Too many At Risk customers
  const championsData = distribution.find(d => d.segment === 'champions');
  const atRiskData = distribution.find(d => d.segment === 'at_risk');

  if (atRiskData && championsData && atRiskData.count > championsData.count * 0.5) {
    alerts.push({
      type: 'critical',
      severity: 'high',
      message: `⚠️ ${atRiskData.count} clients VIP à risque de perte (>${Math.round(championsData.count * 0.5)} seuil)`,
      segment: 'at_risk',
      count: atRiskData.count,
      revenueImpact: atRiskData.totalRevenue,
      actionRequired: 'Lancer campagne de réactivation immédiatement'
    });
  }

  // Alert 2: Champions declining
  if (championsData && championsData.trend.direction === 'down' && Math.abs(championsData.trend.changePercent) > 10) {
    alerts.push({
      type: 'critical',
      severity: 'high',
      message: `🚨 ${Math.abs(championsData.trend.change)} Champions perdus ce mois (-${Math.abs(championsData.trend.changePercent).toFixed(1)}%)`,
      segment: 'champions',
      count: Math.abs(championsData.trend.change),
      actionRequired: 'Analyser les raisons et lancer programme de rétention'
    });
  }

  // Alert 3: High Champion -> At Risk migration
  const championToAtRisk = migrations.find(m =>
    m.from === 'champions' && m.to === 'at_risk'
  );

  if (championToAtRisk && championToAtRisk.count > 3) {
    alerts.push({
      type: 'critical',
      severity: 'high',
      message: `💔 ${championToAtRisk.count} Champions ont glissé vers At Risk`,
      segment: 'champions',
      count: championToAtRisk.count,
      revenueImpact: championToAtRisk.revenueImpact,
      actionRequired: 'Contact personnel urgent de chaque client'
    });
  }

  // Alert 4: Good news - New Customers converting well
  const newCustomersData = distribution.find(d => d.segment === 'new_customers');
  const loyalData = distribution.find(d => d.segment === 'loyal_customers');

  const newToLoyal = migrations.find(m =>
    m.from === 'new_customers' && m.to === 'loyal_customers'
  );

  if (newToLoyal && newToLoyal.count > 5) {
    alerts.push({
      type: 'info',
      severity: 'low',
      message: `✅ ${newToLoyal.count} nouveaux clients convertis en clients fidèles`,
      segment: 'new_customers',
      count: newToLoyal.count,
      actionRequired: 'Continuer la stratégie onboarding actuelle'
    });
  }

  // Alert 5: Hibernating customers growing
  const hibernatingData = distribution.find(d => d.segment === 'hibernating');

  if (hibernatingData && hibernatingData.trend.direction === 'up' && hibernatingData.trend.changePercent > 20) {
    alerts.push({
      type: 'warning',
      severity: 'medium',
      message: `❄️ ${hibernatingData.count} clients en hibernation (+${hibernatingData.trend.changePercent.toFixed(1)}%)`,
      segment: 'hibernating',
      count: hibernatingData.count,
      actionRequired: 'Considérer campagne de win-back à faible coût'
    });
  }

  return alerts;
}

/**
 * Generate strategic recommendations based on RFM analysis
 */
export function generateRFMRecommendations(
  distribution: RFMDistribution[],
  migrations: SegmentMigration[]
): RFMDashboardData['recommendations'] {
  const recommendations: RFMDashboardData['recommendations'] = [];

  // Recommendation 1: Focus on At Risk if high count
  const atRiskData = distribution.find(d => d.segment === 'at_risk');
  if (atRiskData && atRiskData.count > 5) {
    recommendations.push({
      action: `Lancer campagne de réactivation pour ${atRiskData.count} clients At Risk`,
      priority: 'critical',
      expectedImpact: atRiskData.totalRevenue * 0.40, // 40% expected reactivation rate
      segment: 'at_risk'
    });
  }

  // Recommendation 2: Upsell to Potential Loyalists
  const potentialData = distribution.find(d => d.segment === 'potential_loyalists');
  if (potentialData && potentialData.count > 3) {
    recommendations.push({
      action: `Programme d'upsell pour ${potentialData.count} clients Potential Loyalists`,
      priority: 'high',
      expectedImpact: potentialData.averageRevenue * potentialData.count * 0.30, // 30% revenue increase
      segment: 'potential_loyalists'
    });
  }

  // Recommendation 3: Convert New Customers
  const newData = distribution.find(d => d.segment === 'new_customers');
  if (newData && newData.count > 10) {
    recommendations.push({
      action: `Optimiser séquence onboarding pour ${newData.count} nouveaux clients`,
      priority: 'high',
      expectedImpact: newData.averageRevenue * newData.count * 0.30, // 30% make 2nd purchase
      segment: 'new_customers'
    });
  }

  // Recommendation 4: VIP program for Champions
  const championsData = distribution.find(d => d.segment === 'champions');
  if (championsData && championsData.count > 0) {
    recommendations.push({
      action: `Renforcer programme VIP pour ${championsData.count} Champions`,
      priority: 'medium',
      expectedImpact: championsData.averageRevenue * championsData.count * 0.20, // 20% increase
      segment: 'champions'
    });
  }

  // Sort by expected impact
  return recommendations.sort((a, b) => b.expectedImpact - a.expectedImpact);
}

/**
 * Calculate overall customer health score (0-100)
 */
export function calculateHealthScore(distribution: RFMDistribution[]): number {
  let score = 0;

  const championsPercent = distribution.find(d => d.segment === 'champions')?.percentage || 0;
  const loyalPercent = distribution.find(d => d.segment === 'loyal_customers')?.percentage || 0;
  const atRiskPercent = distribution.find(d => d.segment === 'at_risk')?.percentage || 0;
  const lostPercent = distribution.find(d => d.segment === 'lost')?.percentage || 0;

  // Positive factors
  score += championsPercent * 2;           // Champions worth 2x
  score += loyalPercent * 1.5;             // Loyal customers worth 1.5x

  // Negative factors
  score -= atRiskPercent * 1.5;            // At risk is bad
  score -= lostPercent * 2;                // Lost is very bad

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get complete RFM dashboard
 */
export async function getRFMDashboard(userId: string): Promise<RFMDashboardData> {
  const distribution = await analyzeRFMDistribution(userId);
  const migrations = await analyzeSegmentMigrations(userId);

  const totalCustomers = distribution.reduce((sum, d) => sum + d.count, 0);
  const championsCount = distribution.find(d => d.segment === 'champions')?.count || 0;
  const championsPercent = totalCustomers > 0 ? (championsCount / totalCustomers) * 100 : 0;
  const atRiskCount = distribution.find(d => d.segment === 'at_risk')?.count || 0;
  const atRiskPercent = totalCustomers > 0 ? (atRiskCount / totalCustomers) * 100 : 0;
  const lostCount = distribution.find(d => d.segment === 'lost')?.count || 0;
  const totalRevenue = distribution.reduce((sum, d) => sum + d.totalRevenue, 0);
  const averageCLV = distribution.reduce((sum, d) => sum + d.averageCLV * d.count, 0) / Math.max(totalCustomers, 1);
  const healthScore = calculateHealthScore(distribution);

  const alerts = await generateRFMAlerts(distribution, migrations);
  const recommendations = generateRFMRecommendations(distribution, migrations);

  return {
    distribution,
    migrations,
    highlights: {
      totalCustomers,
      championsCount,
      championsPercent,
      atRiskCount,
      atRiskPercent,
      lostCount,
      totalRevenue,
      averageCLV,
      healthScore
    },
    alerts,
    recommendations
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get historical distribution from N days ago
 */
async function getHistoricalDistribution(
  userId: string,
  daysAgo: number
): Promise<Record<RFMSegment, number>> {
  const targetDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  const { data: history } = await supabase
    .from('rfm_segment_history')
    .select('segment')
    .eq('user_id', userId)
    .gte('created_at', targetDate.toISOString())
    .lt('created_at', new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString());

  const distribution: Record<string, number> = {};

  (history || []).forEach((record) => {
    distribution[record.segment] = (distribution[record.segment] || 0) + 1;
  });

  return distribution as Record<RFMSegment, number>;
}

/**
 * Determine severity of a segment migration
 */
function determineSeverity(from: RFMSegment, to: RFMSegment): 'positive' | 'neutral' | 'negative' {
  const hierarchy: RFMSegment[] = [
    'lost',
    'hibernating',
    'about_to_sleep',
    'need_attention',
    'at_risk',
    'cant_lose_them',
    'promising',
    'new_customers',
    'potential_loyalists',
    'loyal_customers',
    'champions'
  ];

  const fromIndex = hierarchy.indexOf(from);
  const toIndex = hierarchy.indexOf(to);

  if (toIndex > fromIndex) return 'positive';
  if (toIndex < fromIndex) return 'negative';
  return 'neutral';
}

/**
 * Estimate revenue impact of a segment migration
 */
function estimateRevenueImpact(from: RFMSegment, to: RFMSegment, currentRevenue: number): number {
  const severity = determineSeverity(from, to);

  if (severity === 'positive') {
    // Expect 20% revenue increase for positive migration
    return currentRevenue * 0.20;
  } else if (severity === 'negative') {
    // Expect 40% revenue decrease for negative migration
    return currentRevenue * -0.40;
  }

  return 0;
}

/**
 * Track RFM segment change for a contact
 * Call this whenever RFM is recalculated
 */
export async function trackRFMSegmentChange(
  contactId: string,
  userId: string,
  segment: RFMSegment,
  stats: ContactStats,
  scores: { r: number; f: number; m: number }
): Promise<void> {
  await supabase.from('rfm_segment_history').insert({
    contact_id: contactId,
    user_id: userId,
    segment,
    r_score: scores.r,
    f_score: scores.f,
    m_score: scores.m,
    total_revenue: stats.totalRevenue,
    total_orders: stats.totalOrders,
    days_since_last_order: stats.daysSinceLastActivity
  });
}
