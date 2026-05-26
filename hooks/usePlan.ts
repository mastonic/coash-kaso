'use client';

import { useState, useEffect } from 'react';
import { PlanType, Module, canAccess as canAccessModule, getLimit } from '@/lib/plans';

interface PlanData {
  plan: PlanType;
  status: 'active' | 'pending' | 'expired';
  usage: {
    videoAnalysesUsed: number;
    videoAnalysesResetAt: string;
    sessionsGeneratedThisMonth: number;
    sessionsResetAt: string;
  };
  limits: {
    videoAnalyses: number;
    sessionsPerMonth: number;
    teams: number;
  };
  trialEndsAt: string | null;
  planActivatedAt: string | null;
}

interface UsePlanReturn extends PlanData {
  isLoading: boolean;
  error: string | null;
  canAccess: (module: Module) => boolean;
  isLimitReached: (limitKey: 'videoAnalyses' | 'sessionsPerMonth') => boolean;
}

export function usePlan(email?: string): UsePlanReturn {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get email from localStorage if not provided
        const userEmail = email || localStorage.getItem('userEmail');

        if (!userEmail) {
          setError('No user email found');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/user/plan?email=${encodeURIComponent(userEmail)}`);

        if (!response.ok) {
          if (response.status === 404) {
            // User not found - might be new user
            setError('User not found');
          } else {
            throw new Error(`Failed to fetch plan: ${response.statusText}`);
          }
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setPlan(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch plan');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, [email]);

  const canAccess = (module: Module): boolean => {
    if (!plan) return false;
    if (plan.status !== 'active') return false;
    return canAccessModule(plan.plan, module);
  };

  const isLimitReached = (limitKey: 'videoAnalyses' | 'sessionsPerMonth'): boolean => {
    if (!plan) return false;
    const limit = getLimit(plan.plan, limitKey);
    if (limit === -1) return false; // unlimited

    const used =
      limitKey === 'videoAnalyses'
        ? plan.usage.videoAnalysesUsed
        : plan.usage.sessionsGeneratedThisMonth;

    return used >= limit;
  };

  return {
    plan: plan?.plan || 'trial',
    status: plan?.status || 'pending',
    usage: plan?.usage || {
      videoAnalysesUsed: 0,
      videoAnalysesResetAt: new Date().toISOString(),
      sessionsGeneratedThisMonth: 0,
      sessionsResetAt: new Date().toISOString(),
    },
    limits: plan?.limits || {
      videoAnalyses: 0,
      sessionsPerMonth: 0,
      teams: 0,
    },
    trialEndsAt: plan?.trialEndsAt || null,
    planActivatedAt: plan?.planActivatedAt || null,
    isLoading,
    error,
    canAccess,
    isLimitReached,
  };
}
