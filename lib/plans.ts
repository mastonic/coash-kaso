// Plan definitions and access control
export type PlanType = 'trial' | 'coach_pro' | 'rt_manager';
export type Module = 'generator' | 'history' | 'team' | 'presence' | 'schedule' | 'video' | 'coach_dashboard' | 'rt_dashboard';

export interface PlanConfig {
  name: string;
  price: number;
  modules: Module[];
  limits: {
    videoAnalyses: number;
    sessionsPerMonth: number;
    teams: number;
  };
  lsVariantId?: string;
}

export const PLANS: Record<PlanType, PlanConfig> = {
  trial: {
    name: 'Essai',
    price: 0,
    modules: ['generator', 'history', 'team', 'presence', 'schedule', 'video', 'coach_dashboard'],
    limits: {
      videoAnalyses: 2,
      sessionsPerMonth: 10,
      teams: 1,
    },
  },
  coach_pro: {
    name: 'Coach Pro',
    price: 14,
    modules: ['generator', 'history', 'team', 'presence', 'schedule', 'video', 'coach_dashboard'],
    limits: {
      videoAnalyses: 5,
      sessionsPerMonth: -1, // unlimited
      teams: 1,
    },
    lsVariantId: process.env.LEMONSQUEEZY_COACH_PRO_VARIANT_ID,
  },
  rt_manager: {
    name: 'RT Manager',
    price: 49,
    modules: ['generator', 'history', 'team', 'presence', 'schedule', 'video', 'coach_dashboard', 'rt_dashboard'],
    limits: {
      videoAnalyses: -1, // unlimited
      sessionsPerMonth: -1,
      teams: -1,
    },
    lsVariantId: process.env.LEMONSQUEEZY_RT_MANAGER_VARIANT_ID,
  },
};

export function canAccess(plan: PlanType, module: Module): boolean {
  const planConfig = PLANS[plan];
  return planConfig?.modules.includes(module) ?? false;
}

export function getLimit(plan: PlanType, limitKey: 'videoAnalyses' | 'sessionsPerMonth' | 'teams'): number {
  return PLANS[plan]?.limits[limitKey] ?? 0;
}

export function isLimitUnlimited(plan: PlanType, limitKey: 'videoAnalyses' | 'sessionsPerMonth' | 'teams'): boolean {
  const limit = getLimit(plan, limitKey);
  return limit === -1;
}

export function isLimitReached(used: number, plan: PlanType, limitKey: 'videoAnalyses' | 'sessionsPerMonth'): boolean {
  const limit = getLimit(plan, limitKey);
  if (limit === -1) return false; // unlimited
  return used >= limit;
}
