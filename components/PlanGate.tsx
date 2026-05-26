'use client';

import { useState } from 'react';
import { Module, PLANS } from '@/lib/plans';
import { usePlan } from '@/hooks/usePlan';

interface PlanGateProps {
  module: Module;
  userPlan?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PlanGate({
  module,
  userPlan,
  children,
  fallback,
}: PlanGateProps) {
  const { plan, canAccess, isLoading } = usePlan();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const currentPlan = userPlan || plan;

  if (isLoading) {
    return <div className="text-[#9CA3AF]">Vérification d'accès...</div>;
  }

  if (!canAccess(module)) {
    // Find which plans have access to this module
    const availablePlans = Object.entries(PLANS).filter(([_, config]) =>
      config.modules.includes(module)
    );

    const cheapestUpgradePlan = availablePlans.find(
      ([planType]) => planType !== 'trial'
    );

    const handleUpgrade = async () => {
      if (!cheapestUpgradePlan) return;

      const email = localStorage.getItem('userEmail');
      if (!email) {
        alert('Veuillez vous connecter d\'abord');
        return;
      }

      setIsCheckingOut(true);
      try {
        const planType = cheapestUpgradePlan[0] as 'coach_pro' | 'rt_manager';
        const response = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: planType,
            email,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create checkout');
        }

        const { checkoutUrl } = await response.json();
        window.location.href = checkoutUrl;
      } catch (error) {
        console.error('Checkout error:', error);
        alert('Erreur lors de la création du paiement');
      } finally {
        setIsCheckingOut(false);
      }
    };

    const upgradePlanName = cheapestUpgradePlan
      ? PLANS[cheapestUpgradePlan[0] as 'coach_pro' | 'rt_manager'].name
      : null;

    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-8 gap-6">
          <div className="space-y-3 text-center">
            <h3 className="text-2xl font-bold text-[#F3F4F6]">
              Upgrade Requis
            </h3>
            <p className="text-[#9CA3AF]">
              Cette fonctionnalité n'est pas disponible avec votre plan actuel.
            </p>
            {upgradePlanName && (
              <p className="text-sm text-[#9CA3AF]">
                Disponible avec {upgradePlanName}
              </p>
            )}
          </div>

          <button
            onClick={handleUpgrade}
            disabled={isCheckingOut}
            className="px-6 py-3 bg-gradient-to-r from-[#39FF14] to-[#10B981] text-[#0A0F0D] font-bold rounded-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 uppercase text-sm"
          >
            {isCheckingOut ? 'Redirection...' : '→ Accéder à l\'Upgrade'}
          </button>
        </div>
      )
    );
  }

  return <>{children}</>;
}
