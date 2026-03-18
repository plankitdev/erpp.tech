import type { Lead } from '../types';

/**
 * Calculate lead score (0-100) based on multiple signals
 */
export function calculateLeadScore(lead: Lead): number {
  let score = 0;

  // Temperature (0-30)
  if (lead.temperature === 'hot') score += 30;
  else if (lead.temperature === 'warm') score += 18;
  else score += 6;

  // Budget presence (0-15)
  if (lead.expected_budget && lead.expected_budget > 0) {
    score += 10;
    if (lead.expected_budget >= 50000) score += 5;
  }

  // Stage progression (0-25)
  const stageScores: Record<string, number> = {
    new: 5, first_contact: 10, proposal_sent: 15, negotiation: 20, contract_signed: 25, lost: 0,
  };
  score += stageScores[lead.stage] || 0;

  // Activities engagement (0-15)
  const actCount = lead.activities_count || lead.activities?.length || 0;
  score += Math.min(actCount * 3, 15);

  // Recency of last followup (0-10)
  if (lead.last_followup_date) {
    const daysSince = Math.floor((Date.now() - new Date(lead.last_followup_date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 3) score += 10;
    else if (daysSince <= 7) score += 7;
    else if (daysSince <= 14) score += 4;
    else score += 1;
  }

  // Proposal sent (0-5)
  if (lead.proposed_amount && lead.proposed_amount > 0) score += 5;

  return Math.min(Math.max(score, 0), 100);
}

export function getScoreColor(score: number): { text: string; bg: string; ring: string } {
  if (score >= 75) return { text: 'text-emerald-600', bg: 'bg-emerald-500', ring: 'ring-emerald-200' };
  if (score >= 50) return { text: 'text-blue-600', bg: 'bg-blue-500', ring: 'ring-blue-200' };
  if (score >= 25) return { text: 'text-amber-600', bg: 'bg-amber-500', ring: 'ring-amber-200' };
  return { text: 'text-gray-500', bg: 'bg-gray-400', ring: 'ring-gray-200' };
}

export function getScoreLabel(score: number): string {
  if (score >= 75) return 'ممتاز';
  if (score >= 50) return 'جيد';
  if (score >= 25) return 'متوسط';
  return 'ضعيف';
}
