import type { Client } from '../types';

export interface BusinessSettings {
  min_down_payment_pct: number;
  base_interest_rate: number;
  commission_tier1: number;
  commission_tier2: number;
  commission_tier3: number;
  stock_alert_threshold: number;
  scoring_weight_downpayment: number;
  scoring_weight_term: number;
  scoring_weight_income: number;
  scoring_weight_history: number;
}

export const DEFAULT_SETTINGS: BusinessSettings = {
  min_down_payment_pct: 10,
  base_interest_rate: 18,
  commission_tier1: 3,
  commission_tier2: 4,
  commission_tier3: 5,
  stock_alert_threshold: 80,
  scoring_weight_downpayment: 30,
  scoring_weight_term: 20,
  scoring_weight_income: 25,
  scoring_weight_history: 25,
};

export interface RiskAssessment {
  score: number; // 0-100, higher = safer
  band: 'bajo' | 'medio' | 'alto';
  recommendation: 'aprobar' | 'revisar' | 'rechazar';
  reasons: string[];
}

/**
 * Credit risk scoring engine.
 * Combines down payment, term, income ratio, and payment history.
 */
export function assessRisk(client: Partial<Client>, settings: BusinessSettings): RiskAssessment {
  const reasons: string[] = [];
  let score = 0;

  // 1. Down payment (weight: scoring_weight_downpayment)
  const downPct = client.downPaymentPct ?? 0;
  const downScore = Math.min(100, (downPct / 35) * 100);
  score += (downScore * settings.scoring_weight_downpayment) / 100;
  if (downPct < settings.min_down_payment_pct) {
    reasons.push(`Inicial (${downPct}%) por debajo del mínimo (${settings.min_down_payment_pct}%)`);
  } else if (downPct >= 25) {
    reasons.push('Inicial sólida que reduce el saldo financiado');
  }

  // 2. Term (weight: scoring_weight_term) — shorter is safer
  const term = client.termMonths ?? 12;
  const termScore = Math.max(0, 100 - (term - 4) * 8);
  score += (termScore * settings.scoring_weight_term) / 100;
  if (term > 18) {
    reasons.push(`Plazo largo (${term} meses) aumenta el riesgo de impago`);
  } else if (term <= 6) {
    reasons.push('Plazo corto minimiza el riesgo');
  }

  // 3. Income ratio (weight: scoring_weight_income)
  const cost = client.productCost ?? 0;
  const income = client.monthlyIncome ?? 0;
  const financed = cost * (1 - downPct / 100);
  const periodsPerYear = client.frequency === 'semanal' ? 52 : client.frequency === 'quincenal' ? 24 : 12;
  const r = (client.interestRate ?? 18) / 100 / periodsPerYear;
  const totalPeriods = Math.round((term / 12) * periodsPerYear);
  const payment = r === 0 ? financed / totalPeriods : (financed * r) / (1 - Math.pow(1 + r, -totalPeriods));
  const paymentsPerMonth = periodsPerYear / 12;
  const monthlyPayment = payment * paymentsPerMonth;
  const incomeRatio = income > 0 ? monthlyPayment / income : 1;
  const incomeScore = Math.max(0, 100 - incomeRatio * 200);
  score += (incomeScore * settings.scoring_weight_income) / 100;
  if (income === 0) {
    reasons.push('Sin ingresos declarados');
  } else if (incomeRatio > 0.3) {
    reasons.push(`Cuota representa ${(incomeRatio * 100).toFixed(0)}% del ingreso (alto)`);
  } else {
    reasons.push('Cuota asumible frente al ingreso');
  }

  // 4. Payment history (weight: scoring_weight_history)
  const historyScore = client.status === 'en_mora' ? 0 : client.status === 'activo' ? 100 : client.status === 'aprobado' ? 70 : 50;
  score += (historyScore * settings.scoring_weight_history) / 100;
  if (client.status === 'en_mora') {
    reasons.push('Cliente con historial de mora');
  } else if (client.status === 'activo') {
    reasons.push('Cliente con buen historial de pago');
  }

  score = Math.round(Math.max(0, Math.min(100, score)));

  let band: RiskAssessment['band'];
  let recommendation: RiskAssessment['recommendation'];
  if (score >= 70) {
    band = 'bajo';
    recommendation = 'aprobar';
  } else if (score >= 45) {
    band = 'medio';
    recommendation = 'revisar';
  } else {
    band = 'alto';
    recommendation = 'rechazar';
  }

  return { score, band, recommendation, reasons };
}

export const RISK_BAND_STYLES: Record<RiskAssessment['band'], { color: string; bg: string; label: string }> = {
  bajo: { color: 'text-success-500', bg: 'bg-success/15', label: 'Riesgo Bajo' },
  medio: { color: 'text-warning-400', bg: 'bg-warning/15', label: 'Riesgo Medio' },
  alto: { color: 'text-danger-400', bg: 'bg-danger/15', label: 'Riesgo Alto' },
};

export const RECOMMENDATION_STYLES: Record<RiskAssessment['recommendation'], string> = {
  aprobar: 'bg-success/15 text-success-500',
  revisar: 'bg-warning/15 text-warning-400',
  rechazar: 'bg-danger/15 text-danger-400',
};
